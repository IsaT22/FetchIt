
import faiss
import numpy as np
import json
import os
from typing import List, Dict, Any

from .embedder import Embedder

class VectorIndex:
    def __init__(self, embedder: Embedder, index_path: str):
        self.embedder = embedder
        self.index_path = index_path
        self.index = None
        self.documents: List[Dict[str, Any]] = [] # Stores {'content': str, 'metadata': dict}
        self.load_index()

    def load_index(self):
        """Loads the FAISS index and documents from disk if they exist."""
        if os.path.exists(self.index_path) and os.path.exists(self.index_path + ".docs"):
            print(f"Loading index from {self.index_path}")
            self.index = faiss.read_index(self.index_path)
            with open(self.index_path + ".docs", "r") as f:
                self.documents = json.load(f)
            print(f"Loaded {len(self.documents)} documents.")
        else:
            print("No existing index found, starting fresh.")
            # Initialize an empty index. Dimension will be set when first documents are added.
            self.index = None
            self.documents = []

    def save_index(self):
        """Saves the FAISS index and documents to disk."""
        if self.index is not None:
            print(f"Saving index to {self.index_path}")
            faiss.write_index(self.index, self.index_path)
            with open(self.index_path + ".docs", "w") as f:
                json.dump(self.documents, f)
            print("Index saved.")
        else:
            print("No index to save.")

    def add_documents(self, texts: List[str], metadata: Dict[str, Any]):
        """Adds texts and their metadata to the index."""
        if not texts:
            return

        embeddings = self.embedder.embed(texts)
        embeddings_np = np.array(embeddings).astype("float32")

        if self.index is None:
            # Initialize FAISS index with the dimension of the first embedding
            dimension = embeddings_np.shape[1]
            self.index = faiss.IndexFlatL2(dimension) # L2 distance for similarity
            print(f"Initialized FAISS index with dimension {dimension}")

        # Add embeddings to the FAISS index
        self.index.add(embeddings_np)

        # Store content and metadata
        for i, text in enumerate(texts):
            doc_metadata = metadata.copy()
            doc_metadata["chunk_id"] = len(self.documents) # Unique ID for this chunk
            self.documents.append({"content": text, "metadata": doc_metadata})
        
        self.save_index()

    def remove_documents(self, file_path: str):
        """Removes documents associated with a specific file_path from the index.
           Note: FAISS IndexFlatL2 does not support direct removal. 
           This is a placeholder for a more sophisticated re-indexing strategy.
           For now, it will effectively rebuild the index without the specified file.
        """
        print(f"Attempting to remove documents for {file_path}. This will rebuild the index.")
        new_documents = [doc for doc in self.documents if doc["metadata"].get("file_path") != file_path]
        
        # Rebuild the index from scratch with the remaining documents
        self.index = None # Reset index
        self.documents = [] # Reset documents
        
        if new_documents:
            # Re-add documents that are not part of the removed file
            all_texts = [doc["content"] for doc in new_documents]
            all_metadata = [doc["metadata"] for doc in new_documents]
            
            # This is a simplified re-indexing. In a production system, you'd re-embed and re-add.
            # For now, we'll just re-add the content and metadata, assuming embeddings can be regenerated.
            # A more robust solution would involve storing embeddings or using a FAISS index that supports deletion.
            
            # For this basic implementation, we'll re-embed and re-add.
            # This is inefficient for large indices but demonstrates the concept.
            
            # Let's just re-add the documents one by one to leverage the existing add_documents logic.
            # This is still not ideal for performance but ensures correctness.
            
            # Re-thinking: The `add_documents` method expects a list of texts and *one* metadata dict.
            # We need to iterate through `new_documents` and add them individually or in batches.
            
            # Let's make `add_documents` handle a list of (text, metadata) pairs for easier re-indexing.
            # For now, let's just re-add them one by one.
            
            # This is a major simplification. Proper deletion in FAISS often involves ID mapping and re-indexing.
            # For the scope of this project, we'll simulate by filtering and re-saving the document list.
            # The FAISS index itself won't shrink, but search results will filter out removed files.
            
            # Let's update the `remove_documents` to just mark documents as inactive or rebuild the `documents` list.
            # The actual FAISS index deletion is complex. For now, we'll rely on filtering at search time.
            
            # Re-thinking again: The simplest way to handle deletion with IndexFlatL2 is to rebuild the index.
            # This is inefficient but correct for a basic implementation.
            
            # Let's just filter the `self.documents` list and then rebuild the FAISS index from scratch.
            # This will be done by re-adding all remaining documents.
            
            # Reset index and documents
            self.index = None
            self.documents = []
            
            # Re-add all documents that are not part of the removed file
            for doc in new_documents:
                # This is inefficient as it re-embeds. A production system would store embeddings.
                self.add_documents([doc["content"]], doc["metadata"])
            
            print(f"Rebuilt index with {len(self.documents)} documents.")
        else:
            print("No documents remaining after removal. Index will be empty.")
            self.index = None # Ensure index is truly empty
            self.documents = []
            self.save_index() # Save empty state

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Performs a semantic search and returns top_k relevant documents."""
        if self.index is None or not self.documents:
            return []

        query_embedding = np.array(self.embedder.embed([query])).astype("float32")
        
        # Ensure query_embedding has the same dimension as the index
        if query_embedding.shape[1] != self.index.d:
            print(f"Warning: Query embedding dimension ({query_embedding.shape[1]}) does not match index dimension ({self.index.d}). Cannot search.")
            return []

        distances, indices = self.index.search(query_embedding, top_k)

        results = []
        for i, doc_idx in enumerate(indices[0]):
            if doc_idx < len(self.documents):
                doc = self.documents[doc_idx]
                results.append({
                    "content": doc["content"],
                    "metadata": doc["metadata"],
                    "distance": distances[0][i]
                })
        return results

    def list_indexed_files(self) -> List[str]:
        """Returns a list of unique file paths currently in the index."""
        return list(set([doc["metadata"]["file_path"] for doc in self.documents if "file_path" in doc["metadata"]]))



