// Chroma Vector Database Service - Handles semantic search and embeddings storage
// Note: Using fetch API directly since chromadb package has compatibility issues
// import { ChromaApi, OpenAIEmbeddingFunction } from 'chromadb';

class ChromaService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.embeddingFunction = null;
    this.isInitialized = false;
    this.collectionName = 'fetchit_documents';
    this.initialize();
  }

  // Initialize Chroma client using direct API calls
  async initialize() {
    try {
      const chromaKey = process.env.REACT_APP_CHROMA_API_KEY;
      
      if (!chromaKey) {
        console.warn('Chroma API key missing. Vector search will be disabled.');
        this.isInitialized = false;
        return;
      }

      this.chromaKey = chromaKey;
      this.baseUrl = 'https://api.trychroma.com';
      
      // Test connection and get or create collection
      try {
        await this.getOrCreateCollection();
        this.isInitialized = true;
        console.log('Chroma vector database initialized successfully');
      } catch (error) {
        console.warn('Chroma vector database not available - using fallback search');
        this.isInitialized = false;
      }
    } catch (error) {
      console.warn('Chroma vector database not available - using fallback search');
      this.isInitialized = false;
    }
  }

  // Get or create collection using direct API calls
  async getOrCreateCollection() {
    const headers = {
      'Authorization': `Bearer ${this.chromaKey}`,
      'Content-Type': 'application/json'
    };

    try {
      // Try to get existing collection
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        this.collection = await response.json();
        return this.collection;
      }
    } catch (error) {
      console.log('Collection does not exist, creating new one...');
    }

    // Create new collection
    const createResponse = await fetch(`${this.baseUrl}/api/v1/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: this.collectionName,
        metadata: {
          description: 'FetchIt document embeddings for semantic search'
        }
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create collection: ${createResponse.statusText}`);
    }

    this.collection = await createResponse.json();
    return this.collection;
  }

  // Check if service is available
  isAvailable() {
    return this.isInitialized && this.collection;
  }

  // Generate embeddings using local embedding service
  async generateEmbeddings(texts) {
    try {
      const localEmbeddingService = (await import('./localEmbeddingService')).default;
      
      if (!localEmbeddingService.isAvailable()) {
        throw new Error('Local embedding service not available');
      }
      
      return await localEmbeddingService.generateEmbeddings(texts);
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }

  // Add document to vector database
  async addDocument(fileId, fileName, content, metadata = {}) {
    if (!this.isAvailable()) {
      console.warn('Chroma service not available, skipping document indexing');
      return false;
    }

    try {
      // Split content into chunks
      const chunks = this.chunkText(content);
      
      // Generate embeddings for chunks
      const embeddings = await this.generateEmbeddings(chunks);
      
      // Prepare data for Chroma
      const documents = chunks;
      const metadatas = chunks.map((chunk, index) => ({
        ...metadata,
        fileName,
        fileId,
        chunkIndex: index,
        totalChunks: chunks.length,
        addedAt: new Date().toISOString()
      }));
      const ids = chunks.map((chunk, index) => `${fileId}_chunk_${index}`);

      // Add to collection via API
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.chromaKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documents,
          metadatas,
          ids,
          embeddings
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add documents: ${response.statusText}`);
      }

      console.log(`Added ${chunks.length} chunks for file: ${fileName}`);
      return true;

    } catch (error) {
      console.error('Error adding document to Chroma:', error);
      return false;
    }
  }

  // Search for similar documents
  async searchDocuments(query, limit = 10) {
    if (!this.isAvailable()) {
      console.warn('Chroma service not available, falling back to keyword search');
      return [];
    }

    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbeddings([query]);
      
      // Search collection via API
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.chromaKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query_embeddings: queryEmbedding,
          n_results: limit,
          include: ['documents', 'metadatas', 'distances']
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const results = await response.json();

      // Transform results to match expected format
      const documents = [];
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          documents.push({
            content: results.documents[0][i],
            metadata: results.metadatas[0][i],
            similarity: 1 - results.distances[0][i] // Convert distance to similarity
          });
        }
      }

      return documents;

    } catch (error) {
      console.error('Error searching Chroma:', error);
      return [];
    }
  }

  // Delete document from vector database
  async deleteDocument(fileId) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      // Delete all chunks for this file via API
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.chromaKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          where: { fileId: fileId }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete documents: ${response.statusText}`);
      }

      console.log(`Deleted chunks for file: ${fileId}`);
      return true;

    } catch (error) {
      console.error('Error deleting document from Chroma:', error);
      return false;
    }
  }

  // Split text into chunks
  chunkText(text, fileName = '') {
    const chunkSize = 1000;
    const chunkOverlap = 200;
    
    if (!text || text.length < chunkSize) {
      return [text || ''];
    }

    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
      const chunk = text.slice(i, i + chunkSize);
      chunks.push(chunk);
    }

    return chunks;
  }

  // Get all files (placeholder method for compatibility)
  async getAllFiles() {
    console.warn('getAllFiles called on chromaService - this method is not implemented for vector database');
    return [];
  }

  // Get collection stats
  async getStats() {
    if (!this.isAvailable()) {
      return { documents: 0, collections: 0 };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.chromaKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get stats: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        documents: data.count || 0,
        collections: 1,
        collectionName: this.collectionName
      };
    } catch (error) {
      console.error('Error getting Chroma stats:', error);
      return { documents: 0, collections: 0 };
    }
  }
}

// Create singleton instance
const chromaService = new ChromaService();
export default chromaService;
