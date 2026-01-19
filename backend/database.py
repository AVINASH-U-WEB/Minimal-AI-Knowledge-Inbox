import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
import json
from logger import logger

class Database:
    """SQLite database manager for content metadata."""
    
    def __init__(self, db_path: str = "knowledge_inbox.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize database schema."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS items (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    url TEXT,
                    timestamp TEXT NOT NULL
                )
            """)
            
            conn.commit()
            conn.close()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")
            raise
    
    def add_item(self, item_id: str, content: str, source_type: str, url: Optional[str] = None) -> Dict:
        """Add a new item to the database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            timestamp = datetime.utcnow().isoformat()
            
            cursor.execute(
                "INSERT INTO items (id, content, source_type, url, timestamp) VALUES (?, ?, ?, ?, ?)",
                (item_id, content, source_type, url, timestamp)
            )
            
            conn.commit()
            conn.close()
            
            logger.info(f"Item added: {item_id} ({source_type})")
            
            return {
                "id": item_id,
                "content": content,
                "source_type": source_type,
                "url": url,
                "timestamp": timestamp
            }
        except Exception as e:
            logger.error(f"Failed to add item: {str(e)}")
            raise
    
    def get_all_items(self) -> List[Dict]:
        """Retrieve all items from the database."""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM items ORDER BY timestamp DESC")
            rows = cursor.fetchall()
            
            items = [dict(row) for row in rows]
            conn.close()
            
            logger.info(f"Retrieved {len(items)} items from database")
            return items
        except Exception as e:
            logger.error(f"Failed to retrieve items: {str(e)}")
            raise
    
    def get_item_by_id(self, item_id: str) -> Optional[Dict]:
        """Retrieve a specific item by ID."""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
            row = cursor.fetchone()
            
            conn.close()
            
            if row:
                return dict(row)
            return None
        except Exception as e:
            logger.error(f"Failed to retrieve item {item_id}: {str(e)}")
            raise
    
    def delete_item(self, item_id: str) -> bool:
        """Delete an item from the database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
            deleted = cursor.rowcount > 0
            
            conn.commit()
            conn.close()
            
            if deleted:
                logger.info(f"Item deleted: {item_id}")
            else:
                logger.warning(f"Item not found for deletion: {item_id}")
                raise ValueError(f"Item {item_id} not found")
            
            return deleted
        except Exception as e:
            logger.error(f"Failed to delete item {item_id}: {str(e)}")
            raise

# Global database instance
db = Database()
