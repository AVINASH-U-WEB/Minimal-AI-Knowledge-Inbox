import os
from typing import List, Dict, Optional, TypedDict, Literal
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import END, StateGraph
from logger import logger
from dotenv import load_dotenv

load_dotenv()

class GraphState(TypedDict):
    """
    Represents the state of our graph.
    """
    question: str
    generation: str
    documents: List[str]
    sources: List[Dict]
    item_id: Optional[str]
    grounded: bool
    useful: bool
    retries: int

class RAGPipeline:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50, top_k: int = 3):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.top_k = top_k
        
        logger.info("Loading embedding model...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        logger.info("Initializing ChromaDB...")
        self.chroma_client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection = self.chroma_client.get_or_create_collection(
            name="knowledge_inbox",
            metadata={"hnsw:space": "cosine"}
        )
        
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")
            
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0,
            groq_api_key=api_key
        )
        
        self.app = self.build_graph()
        logger.info("LangGraph Pipeline initialized")

    def chunk_text(self, text: str) -> List[str]:
        chunks = []
        start = 0
        text_length = len(text)
        while start < text_length:
            end = start + self.chunk_size
            chunk = text[start:end]
            if chunk.strip():
                chunks.append(chunk.strip())
            start += self.chunk_size - self.chunk_overlap
        return chunks

    def add_document(self, doc_id: str, content: str, metadata: Dict):
        try:
            chunks = self.chunk_text(content)
            embeddings = self.embedding_model.encode(chunks).tolist()
            chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
            chunk_metadata = []
            for i in range(len(chunks)):
                meta = {
                    "chunk_index": i,
                    "parent_doc_id": str(doc_id),
                    "source_type": str(metadata.get("source_type", "unknown"))
                }
                if "url" in metadata and metadata["url"]:
                    meta["url"] = str(metadata["url"])
                if "timestamp" in metadata and metadata["timestamp"]:
                    meta["timestamp"] = str(metadata["timestamp"])
                chunk_metadata.append(meta)
            
            self.collection.add(
                ids=chunk_ids,
                embeddings=embeddings,
                documents=chunks,
                metadatas=chunk_metadata
            )
            logger.info(f"Added document {doc_id} with {len(chunks)} chunks")
        except Exception as e:
            logger.error(f"Failed to add document: {e}")
            raise

    def delete_document(self, doc_id: str):
        try:
            results = self.collection.get(where={"parent_doc_id": str(doc_id)})
            if results and results['ids']:
                self.collection.delete(ids=results['ids'])
                logger.info(f"Deleted document {doc_id}")
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            raise



    def retrieve(self, state: GraphState):
        logger.info("---RETRIEVE---")
        question = state["question"]
        item_id = state.get("item_id")
        
        query_embedding = self.embedding_model.encode([question]).tolist()
        where_filter = {"parent_doc_id": str(item_id)} if item_id else None
        
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=self.top_k,
            where=where_filter
        )
        
        documents = []
        sources = []
        if results['documents'] and results['documents'][0]:
            for i in range(len(results['documents'][0])):
                doc_content = results['documents'][0][i]
                documents.append(doc_content)
                
                source_meta = results['metadatas'][0][i].copy()
                source_meta['content'] = doc_content
                sources.append(source_meta)
                
        return {"documents": documents, "sources": sources}

    def generate(self, state: GraphState):
        logger.info("---GENERATE---")
        question = state["question"]
        documents = state["documents"]
        retries = state.get("retries", 0)
        
        if not documents:
            return {
                "generation": "I don't have enough information in the saved content to answer this question.",
                "grounded": True,
                "useful": True
            }

        context = "\n\n".join(documents)
        
        system = "You are an assistant that answers questions ONLY using the provided context."
        human = f"""
        Answer the question based strictly on the context below.
        If the answer is not present in the context, say exactly:
        "I don't have enough information in the saved notes to answer this."
        
        Context:
        {context}
        
        Question:
        {question}
        """
        
        prompt = ChatPromptTemplate.from_messages([("system", system), ("human", human)])
        chain = prompt | self.llm | StrOutputParser()
        generation = chain.invoke({})
        
        return {"generation": generation, "retries": retries + 1}

    def grade_groundedness(self, state: GraphState):
        logger.info("---CHECK GROUNDEDNESS---")
        question = state["question"]
        documents = state["documents"]
        generation = state["generation"]
        
        if "i don't have enough information" in generation.lower():
            return {"grounded": True} 

        system = "You are a grader assessing whether an answer is grounded in / supported by a set of facts."
        human = f"""
        Facts:
        {documents}
        
        LLM Answer:
        {generation}
        
        Is the answer grounded in the facts? Give a binary 'YES' or 'NO' score.
        """
        
        prompt = ChatPromptTemplate.from_messages([("system", system), ("human", human)])
        chain = prompt | self.llm | StrOutputParser()
        score = chain.invoke({})
        
        grounded = "YES" in score.upper()
        logger.info(f"Grounded: {grounded}")
        return {"grounded": grounded}

    def grade_answer_quality(self, state: GraphState):
        logger.info("---CHECK ANSWER QUALITY---")
        question = state["question"]
        generation = state["generation"]
        
        if "i don't have enough information" in generation.lower():
            return {"useful": True}

        system = "You are a grader assessing whether an answer is useful to resolve a question."
        human = f"""
        Question: {question}
        Answer: {generation}
        
        Does the answer resolve the question? Give a binary 'YES' or 'NO' score.
        """
        prompt = ChatPromptTemplate.from_messages([("system", system), ("human", human)])
        chain = prompt | self.llm | StrOutputParser()
        score = chain.invoke({})
        
        useful = "YES" in score.upper()
        logger.info(f"Useful: {useful}")
        return {"useful": useful}



    def check_groundedness(self, state: GraphState):
        if state["grounded"]:
            return "useful"
        if state["retries"] > 2:
            return "stop" 
        return "retry"

    def check_utility(self, state: GraphState):
        if state["useful"]:
            return "stop"
        if state["retries"] > 2:
            return "stop"
        return "retry"

    def build_graph(self):
        workflow = StateGraph(GraphState)
        
        # Define Nodes
        workflow.add_node("retrieve", self.retrieve)
        workflow.add_node("generate", self.generate)
        workflow.add_node("grade_groundedness", self.grade_groundedness)
        workflow.add_node("grade_answer_quality", self.grade_answer_quality)
        
        # Define Edges
        workflow.set_entry_point("retrieve")
        workflow.add_edge("retrieve", "generate")
        workflow.add_edge("generate", "grade_groundedness")
        
        # Conditional Edges
        workflow.add_conditional_edges(
            "grade_groundedness",
            self.check_groundedness,
            {
                "useful": "grade_answer_quality",
                "retry": "generate", 
                "stop": END
            }
        )
        
        workflow.add_conditional_edges(
            "grade_answer_quality",
            self.check_utility,
            {
                "stop": END,
                "retry": "generate"
            }
        )
        
        return workflow.compile()

    def run_graph(self, question: str, item_id: Optional[str] = None):
        """Entry point for the API"""
        inputs = {"question": question, "item_id": item_id, "retries": 0}
        config = {"recursion_limit": 25}
        
        result = self.app.invoke(inputs, config=config)
        
        return {
            "answer": result["generation"],
            "sources": result.get("sources", [])
        }

rag = RAGPipeline()
