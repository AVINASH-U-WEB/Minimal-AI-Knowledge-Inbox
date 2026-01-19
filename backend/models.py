from pydantic import BaseModel, Field, validator
from typing import Literal, Optional, List
from datetime import datetime

class IngestRequest(BaseModel):
    """Request model for ingesting content."""
    content: str = Field(..., min_length=1, description="Text content or URL to ingest")
    source_type: Literal["note", "url"] = Field(..., description="Type of content being ingested")
    url: Optional[str] = Field(None, description="Optional URL for notes")
    
    @validator('content')
    def validate_content(cls, v, values):
        """Validate content based on source type."""
        if not v or not v.strip():
            raise ValueError("Content cannot be empty")
        
        if values.get('source_type') == 'url':
            if not (v.startswith('http://') or v.startswith('https://')):
                raise ValueError("URL must start with http:// or https://")
        
        return v.strip()

class IngestResponse(BaseModel):
    """Response model for successful ingestion."""
    id: str
    message: str
    source_type: str
    timestamp: datetime

class Item(BaseModel):
    """Model for a saved content item."""
    id: str
    content: str
    source_type: str
    url: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

class QueryRequest(BaseModel):
    """Request model for querying the knowledge base."""
    question: str = Field(..., min_length=1, description="Question to ask")
    item_id: Optional[str] = Field(None, description="Optional: query specific item only")
    
    @validator('question')
    def validate_question(cls, v):
        """Validate question is not empty."""
        if not v or not v.strip():
            raise ValueError("Question cannot be empty")
        return v.strip()

class Source(BaseModel):
    """Model for a source citation."""
    content: str
    source_type: str
    url: Optional[str] = None
    timestamp: datetime

class QueryResponse(BaseModel):
    """Response model for query results."""
    answer: str
    sources: List[Source]
    question: str

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
