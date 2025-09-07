// Local Embedding Service - Uses Transformers.js for client-side embeddings
import { pipeline, env } from '@xenova/transformers';

// Allow remote models for initial download, then cache locally
env.allowRemoteModels = true;
env.allowLocalModels = true;

class LocalEmbeddingService {
  constructor() {
    this.extractor = null;
    this.isInitialized = false;
    this.modelName = 'Xenova/all-MiniLM-L6-v2'; // Fast, lightweight model
    this.chunkSize = 1000;
    this.chunkOverlap = 200;
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing local embedding model...');
      
      // Load the sentence embedding pipeline
      this.extractor = await pipeline('feature-extraction', this.modelName, {
        quantized: true, // Use quantized model for better performance
      });
      
      this.isInitialized = true;
      console.log('Local embedding service initialized with', this.modelName);
      
    } catch (error) {
      console.error('Local embedding service failed to initialize:', error);
      this.isInitialized = false;
    }
  }

  // Check if embedding service is available
  isAvailable() {
    return this.isInitialized && this.extractor;
  }

  // Generate embeddings for a single text
  async generateEmbedding(text) {
    if (!this.isAvailable()) {
      throw new Error('Local embedding service not available');
    }

    try {
      const output = await this.extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  // Generate embeddings for multiple texts
  async generateEmbeddings(texts) {
    if (!this.isAvailable()) {
      throw new Error('Local embedding service not available');
    }

    try {
      const embeddings = [];
      
      // Process texts in batches to avoid memory issues
      const batchSize = 5;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.generateEmbedding(text));
        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);
      }
      
      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  // Generate embedding for query (alias for generateEmbedding)
  async generateQueryEmbedding(query) {
    return await this.generateEmbedding(query);
  }

  // Calculate cosine similarity between two vectors
  calculateSimilarity(vectorA, vectorB) {
    if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, similarity)); // Clamp between 0 and 1
  }

  // Split text into chunks for processing
  chunkText(text, maxChunkSize = null) {
    const chunkSize = maxChunkSize || this.chunkSize;
    const overlap = this.chunkOverlap;
    
    if (!text || text.length <= chunkSize) {
      return [text || ''];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);
      
      // Try to break at word boundaries
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start + chunkSize * 0.8) {
          end = lastSpace;
        }
      }

      const chunk = text.slice(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      start = end - overlap;
      if (start >= text.length) break;
    }

    return chunks;
  }

  // Process file content and generate embeddings
  async processFileContent(content, fileName = '') {
    if (!this.isAvailable()) {
      console.warn('Local embedding service not available for file processing');
      return [];
    }

    try {
      const chunks = this.chunkText(content);
      const embeddings = await this.generateEmbeddings(chunks);
      
      return chunks.map((chunk, index) => ({
        text: chunk,
        embedding: embeddings[index],
        fileName: fileName,
        chunkIndex: index
      }));
    } catch (error) {
      console.error('Error processing file content:', error);
      return [];
    }
  }

  // Semantic search within processed content
  async semanticSearch(query, processedContent, limit = 5) {
    if (!this.isAvailable() || !processedContent || processedContent.length === 0) {
      return [];
    }

    try {
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      const results = processedContent.map(item => ({
        ...item,
        similarity: this.calculateSimilarity(queryEmbedding, item.embedding)
      }));

      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .filter(result => result.similarity > 0.3); // Filter out low similarity results
    } catch (error) {
      console.error('Error in semantic search:', error);
      return [];
    }
  }
}

// Create singleton instance
const localEmbeddingService = new LocalEmbeddingService();
export default localEmbeddingService;
