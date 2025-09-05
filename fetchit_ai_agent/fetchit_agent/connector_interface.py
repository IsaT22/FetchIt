
from abc import ABC, abstractmethod
from typing import Dict, Any
import os

class FileConnector(ABC):
    """Abstract base class for file connectors."""
    @abstractmethod
    def read_file(self, file_path: str, file_type: str) -> Any:
        """Reads the content of a file and returns it as a string or bytes."""
        pass

    @abstractmethod
    def get_file_metadata(self, file_path: str) -> Dict[str, Any]:
        """Retrieves metadata for a given file path."""
        pass

class LocalFileConnector(FileConnector):
    """A concrete implementation of FileConnector for local file system access."""
    def read_file(self, file_path: str, file_type: str) -> Any:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if file_type == "txt":
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        elif file_type == "pdf" or file_type == "docx":
            with open(file_path, "rb") as f:
                return f.read() # Return raw bytes for binary files
        else:
            raise ValueError(f"Unsupported file type for LocalFileConnector: {file_type}")

    def get_file_metadata(self, file_path: str) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        return {
            "file_name": os.path.basename(file_path),
            "file_size": os.path.getsize(file_path),
            "last_modified": os.path.getmtime(file_path),
            "source": "local_filesystem"
        }


