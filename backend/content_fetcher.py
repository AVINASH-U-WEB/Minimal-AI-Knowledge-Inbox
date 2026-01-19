import requests
from bs4 import BeautifulSoup
from typing import Optional
from logger import logger

class ContentFetcher:
    """Fetch and extract content from URLs."""
    
    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def fetch_url_content(self, url: str) -> str:
        """
        Fetch and extract text content from a URL.
        
        Args:
            url: The URL to fetch content from
            
        Returns:
            Extracted text content
            
        Raises:
            Exception: If fetching or parsing fails
        """
        try:
            logger.info(f"Fetching content from URL: {url}")
            
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            
            # Parse HTML content
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Get text content
            text = soup.get_text(separator=' ', strip=True)
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            if not text:
                raise ValueError("No text content extracted from URL")
            
            logger.info(f"Successfully fetched {len(text)} characters from {url}")
            return text
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout fetching URL: {url}")
            raise Exception(f"Request timeout while fetching {url}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error fetching URL {url}: {str(e)}")
            raise Exception(f"Failed to fetch URL: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing URL {url}: {str(e)}")
            raise Exception(f"Failed to process URL content: {str(e)}")

# Global fetcher instance
fetcher = ContentFetcher()
