from fastapi import APIRouter, HTTPException, status
from models import IngestRequest, IngestResponse, QueryRequest, QueryResponse, Item, ErrorResponse
from database import db
from content_fetcher import fetcher
from rag_pipeline import rag
from logger import logger
import uuid
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api")

@router.post("/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_content(request: IngestRequest):
    """
    Ingest content (note or URL) into the knowledge base.
    """
    try:
        item_id = str(uuid.uuid4())
        content = request.content
        url = None
        
        # Fetch URL content if needed
        if request.source_type == "url":
            url = request.content
            try:
                content = fetcher.fetch_url_content(url)
            except Exception as e:
                logger.error(f"URL fetch failed: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to fetch URL content: {str(e)}"
                )
        elif request.source_type == "note" and request.url:
            # Support optional URL for notes
            url = request.url
        
        # Store in database
        try:
            db_item = db.add_item(
                item_id=item_id,
                content=content,
                source_type=request.source_type,
                url=url
            )
        except Exception as e:
            logger.error(f"Database storage failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store content in database"
            )
        
        # Index in vector store
        try:
            rag.add_document(
                doc_id=item_id,
                content=content,
                metadata={
                    "source_type": request.source_type,
                    "url": url,
                    "timestamp": db_item["timestamp"]
                }
            )
        except Exception as e:
            logger.error(f"Vector indexing failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to index content in vector store"
            )
        
        return IngestResponse(
            id=item_id,
            message="Content ingested successfully",
            source_type=request.source_type,
            timestamp=datetime.fromisoformat(db_item["timestamp"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in ingest: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.get("/items", response_model=List[Item])
async def get_items():
    """
    Retrieve all saved items.
    """
    try:
        items = db.get_all_items()
        
        return [
            Item(
                id=item["id"],
                content=item["content"],
                source_type=item["source_type"],
                url=item["url"],
                timestamp=datetime.fromisoformat(item["timestamp"])
            )
            for item in items
        ]
        
    except Exception as e:
        logger.error(f"Failed to retrieve items: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve items"
        )

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str):
    """
    Delete an item from the knowledge base.
    """
    try:
        # Delete from database
        try:
            db.delete_item(item_id)
        except Exception as e:
            logger.error(f"Database deletion failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        
        # Delete from vector store
        try:
            rag.delete_document(item_id)
        except Exception as e:
            logger.error(f"Vector store deletion failed: {str(e)}")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in delete: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.post("/query", response_model=QueryResponse)
async def query_knowledge(request: QueryRequest):
    """
    Query the knowledge base using the LangGraph RAG pipeline.
    """
    try:
        # Run LangGraph pipeline
        result = rag.run_graph(request.question, item_id=request.item_id)
        
        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            question=request.question,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Unexpected error in query: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "AI Knowledge Inbox", "mode": "LangGraph"}
