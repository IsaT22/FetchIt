
import os
from typing import List

# For PDF processing
import pypdf

# For DOCX processing
from docx import Document

class TextProcessor:
    def __init__(self):
        pass

    def extract_text_from_raw(self, raw_content: Any, file_type: str) -> str:
        """Extracts text content from raw content (bytes for binary, string for text files)."""
        text_content = ""
        if file_type == "txt":
            text_content = raw_content # raw_content is already string for txt
        elif file_type == "pdf":
            try:
                # pypdf expects a file-like object or path. We need to wrap raw_content (bytes) in BytesIO.
                from io import BytesIO
                pdf_file = BytesIO(raw_content)
                reader = pypdf.PdfReader(pdf_file)
                for page in reader.pages:
                    text_content += page.extract_text() or ""
            except Exception as e:
                print(f"Error extracting text from PDF: {e}")
                text_content = ""
        elif file_type == "docx":
            try:
                # python-docx expects a file-like object or path. We need to wrap raw_content (bytes) in BytesIO.
                from io import BytesIO
                docx_file = BytesIO(raw_content)
                document = Document(docx_file)
                for paragraph in document.paragraphs:
                    text_content += paragraph.text + "\n"
            except Exception as e:
                print(f"Error extracting text from DOCX: {e}")
                text_content = ""
        else:
            raise ValueError(f"Unsupported file type for text extraction: {file_type}")
        return text_content

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Splits text into smaller chunks with optional overlap."""
        if not text:
            return []

        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap
            if start >= len(text) - overlap and end < len(text):
                # Ensure the last chunk includes the end of the text
                chunks.append(text[start:])
                break
        return chunks


