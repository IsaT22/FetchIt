
import os
from typing import Dict, List, Any

from .vector_index import VectorIndex
from .embedder import Embedder
from .connector_interface import FileConnector
from .summarizer import Summarizer
from .utils import TextProcessor

class FetchItAgent:
    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir
        os.makedirs(self.data_dir, exist_ok=True)
        self.embedder = Embedder()
        self.vector_indices: Dict[str, VectorIndex] = {}
        self.summarizer = Summarizer()
        self.text_processor = TextProcessor()
        self.chat_histories: Dict[str, List[Dict[str, str]]] = {}

    def _get_vector_index(self, user_id: str) -> VectorIndex:
        if user_id not in self.vector_indices:
            user_index_path = os.path.join(self.data_dir, f"user_{user_id}_index.faiss")
            self.vector_indices[user_id] = VectorIndex(self.embedder, user_index_path)
        return self.vector_indices[user_id]

    def index_file(self, user_id: str, file_path: str, file_type: str, connector: FileConnector):
        """Indexes the content of a file for a specific user."""
        print(f"Indexing file {file_path} for user {user_id}")
        try:
            # The connector provides the raw file content (e.g., binary for PDF/DOCX)
            raw_content = connector.read_file(file_path, file_type)
            # The TextProcessor extracts text from the raw content based on file_type
            text_content = self.text_processor.extract_text_from_raw(raw_content, file_type)
            
            chunks = self.text_processor.chunk_text(text_content)
            metadata = {"file_path": file_path, "file_type": file_type}
            self._get_vector_index(user_id).add_documents(chunks, metadata)
            print(f"Successfully indexed {file_path}")
        except Exception as e:
            print(f"Error indexing file {file_path}: {e}")
            raise

    def remove_file(self, user_id: str, file_path: str):
        """Removes a file's content from the user's index."""
        print(f"Removing file {file_path} for user {user_id}")
        self._get_vector_index(user_id).remove_documents(file_path)
        print(f"Successfully removed {file_path}")

    def list_indexed_files(self, user_id: str) -> List[str]:
        """Lists files that have been indexed for a given user."""
        return self._get_vector_index(user_id).list_indexed_files()

    def search_files(self, user_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Performs a semantic search against the user's indexed files."""
        print(f"Searching files for user {user_id} with query: {query}")
        results = self._get_vector_index(user_id).search(query, top_k)
        print(f"Found {len(results)} results.")
        return results

    def summarize_file(self, user_id: str, file_path: str, file_type: str, connector: FileConnector, num_sentences: int = 3) -> str:
        """Generates an extractive summary of a specific indexed file."""
        print(f"Summarizing file {file_path} for user {user_id}")
        try:
            raw_content = connector.read_file(file_path, file_type)
            text_content = self.text_processor.extract_text_from_raw(raw_content, file_type)
            return self.summarizer.summarize(text_content, num_sentences)
        except Exception as e:
            print(f"Error summarizing file {file_path}: {e}")
            raise

    def summarize_text(self, text_content: str, num_sentences: int = 3) -> str:
        """Generates an extractive summary of provided text content."""
        return self.summarizer.summarize(text_content, num_sentences)

    def answer_question(self, user_id: str, question: str) -> Dict[str, Any]:
        """Answers a question based on indexed files and conversational context."""
        print(f"Answering question for user {user_id}: {question}")
        
        # 1. Retrieve relevant documents/chunks based on the question
        search_results = self.search_files(user_id, question, top_k=5) # Get top 5 relevant chunks
        
        if not search_results:
            return {"answer": "I couldn't find relevant information in your indexed files to answer that question.", "source_files": []}

        # 2. Combine relevant text for context
        context_texts = [result['content'] for result in search_results]
        combined_context = "\n\n".join(context_texts)

        # 3. Use a simple approach for answering: summarize the context or directly use relevant snippets
        answer = self.summarizer.summarize(combined_context, num_sentences=2) # Summarize the context
        
        # Extract unique source files from search results
        source_files = list(set([result['metadata']['file_path'] for result in search_results if 'file_path' in result['metadata']]))

        return {"answer": answer, "source_files": source_files}

    def get_chat_history(self, user_id: str) -> List[Dict[str, str]]:
        """Retrieves the current conversational history for a user."""
        return self.chat_histories.get(user_id, [])

    def add_to_chat_history(self, user_id: str, role: str, message: str):
        """Adds a message to the conversational history for a user."""
        if user_id not in self.chat_histories:
            self.chat_histories[user_id] = []
        self.chat_histories[user_id].append({"role": role, "content": message})

    def clear_chat_history(self, user_id: str):
        """Clears the conversational history for a user."""
        if user_id in self.chat_histories:
            del self.chat_histories[user_id]
        print(f"Chat history cleared for user {user_id}")

    def process_message(self, user_id: str, message: str) -> Dict[str, Any]:
        """Main entry point for processing user messages."""
        self.add_to_chat_history(user_id, "user", message)
        
        # Simple intent recognition for demonstration
        message_lower = message.lower()
        
        response = {"answer": "I'm not sure how to respond to that. Can you please rephrase or ask about your indexed files?", "source_files": []}

        if "summarize" in message_lower and "file" in message_lower:
            # This intent requires a file path and type. For a real system, you'd extract it from the message.
            # For now, let's assume the backend provides the file path and type.
            response["answer"] = "To summarize a file, please provide the file path and type. For example: 'summarize file /path/to/document.pdf as pdf'"
        elif "summarize" in message_lower:
            response["answer"] = "What would you like me to summarize? Please specify a file or a topic."
        elif "find" in message_lower or "search" in message_lower or "what is" in message_lower or "tell me about" in message_lower:
            query = message
            answer_data = self.answer_question(user_id, query)
            response = answer_data
        elif "list files" in message_lower or "what files do you have" in message_lower:
            indexed_files = self.list_indexed_files(user_id)
            if indexed_files:
                response["answer"] = "You have the following files indexed:\n" + "\n".join(indexed_files)
            else:
                response["answer"] = "You don't have any files indexed yet."
        elif "clear history" in message_lower:
            self.clear_chat_history(user_id)
            response["answer"] = "Your chat history has been cleared."
        
        self.add_to_chat_history(user_id, "agent", response["answer"])
        return response



