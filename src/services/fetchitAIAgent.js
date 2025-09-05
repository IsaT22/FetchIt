// FetchIt AI Agent - JavaScript implementation based on Python agent
import localEmbeddingService from './localEmbeddingService';
import fileStorageService from './fileStorageService';

class FetchItAIAgent {
  constructor() {
    this.isInitialized = false;
    this.userIndices = new Map(); // Per-user vector indices
    this.chatHistories = new Map(); // Per-user chat histories
    this.chunkSize = 1000;
    this.chunkOverlap = 200;
    this.initialize();
  }

  async initialize() {
    try {
      // Try local embeddings with timeout
      let attempts = 0;
      const maxAttempts = 10; // Reduce wait time
      
      while (!localEmbeddingService.isAvailable() && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (localEmbeddingService.isAvailable()) {
        this.isInitialized = true;
        console.log('FetchIt AI Agent initialized with local embeddings');
      } else {
        // Initialize without embeddings for now
        this.isInitialized = true;
        console.warn('FetchIt AI Agent initialized without embeddings (will use text search fallback)');
      }
    } catch (error) {
      console.error('Error initializing FetchIt AI Agent:', error);
      // Still initialize for basic functionality
      this.isInitialized = true;
    }
  }

  // Check if agent is available
  isAvailable() {
    return this.isInitialized; // Available even without embeddings
  }

  // Get or create user-specific vector index
  getUserIndex(userId) {
    if (!this.userIndices.has(userId)) {
      this.userIndices.set(userId, {
        documents: [],
        embeddings: [],
        metadata: []
      });
    }
    return this.userIndices.get(userId);
  }

  // Index a file for a specific user
  async indexFile(userId, filePath, fileType, content, metadata = {}) {
    if (!this.isAvailable()) {
      throw new Error('FetchIt AI Agent not available');
    }

    console.log(`Indexing file ${filePath} for user ${userId}`);
    
    try {
      // Process and chunk the text content
      const chunks = this.chunkText(content);
      
      // Generate embeddings for chunks
      const embeddings = await localEmbeddingService.generateEmbeddings(chunks);
      
      // Get user's index
      const userIndex = this.getUserIndex(userId);
      
      // Add documents to user's index
      chunks.forEach((chunk, index) => {
        userIndex.documents.push(chunk);
        userIndex.embeddings.push(embeddings[index]);
        userIndex.metadata.push({
          filePath,
          fileType,
          chunkIndex: index,
          ...metadata
        });
      });

      console.log(`Successfully indexed ${chunks.length} chunks from ${filePath}`);
      return { success: true, chunksIndexed: chunks.length };
      
    } catch (error) {
      console.error(`Error indexing file ${filePath}:`, error);
      throw error;
    }
  }

  // Remove a file from user's index
  removeFile(userId, filePath) {
    console.log(`Removing file ${filePath} for user ${userId}`);
    
    const userIndex = this.getUserIndex(userId);
    const indicesToRemove = [];
    
    // Find all chunks belonging to this file
    userIndex.metadata.forEach((meta, index) => {
      if (meta.filePath === filePath) {
        indicesToRemove.push(index);
      }
    });
    
    // Remove in reverse order to maintain indices
    indicesToRemove.reverse().forEach(index => {
      userIndex.documents.splice(index, 1);
      userIndex.embeddings.splice(index, 1);
      userIndex.metadata.splice(index, 1);
    });
    
    console.log(`Successfully removed ${indicesToRemove.length} chunks from ${filePath}`);
    return { success: true, chunksRemoved: indicesToRemove.length };
  }

  // List indexed files for a user
  listIndexedFiles(userId) {
    const userIndex = this.getUserIndex(userId);
    const uniqueFiles = [...new Set(userIndex.metadata.map(meta => meta.filePath))];
    return uniqueFiles;
  }

  // Perform semantic search against user's indexed files
  async searchFiles(userId, query, topK = 5) {
    if (!this.isAvailable()) {
      throw new Error('FetchIt AI Agent not available');
    }

    console.log(`Searching files for user ${userId} with query: ${query}`);
    
    try {
      const userIndex = this.getUserIndex(userId);
      
      if (userIndex.documents.length === 0) {
        console.log('No documents indexed for this user');
        return [];
      }

      // Check if embeddings are available
      if (localEmbeddingService.isAvailable() && userIndex.embeddings.length > 0) {
        // Use semantic search with embeddings
        const queryEmbedding = await localEmbeddingService.generateEmbedding(query);
        
        const similarities = userIndex.embeddings.map((embedding, index) => ({
          similarity: localEmbeddingService.calculateSimilarity(queryEmbedding, embedding),
          content: userIndex.documents[index],
          metadata: userIndex.metadata[index],
          index
        }));

        const results = similarities
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK)
          .filter(result => result.similarity > 0.3);

        console.log(`Found ${results.length} relevant results via semantic search`);
        return results;
      } else {
        // Fallback to keyword search
        const queryLower = query.toLowerCase();
        const keywordResults = userIndex.documents
          .map((doc, index) => ({
            similarity: this.calculateKeywordSimilarity(doc, queryLower),
            content: doc,
            metadata: userIndex.metadata[index],
            index
          }))
          .filter(result => result.similarity > 0)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK);

        console.log(`Found ${keywordResults.length} relevant results via keyword search`);
        return keywordResults;
      }
      
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  // Summarize text content
  async summarizeText(textContent, numSentences = 3) {
    // Simple extractive summarization
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length <= numSentences) {
      return textContent.trim();
    }

    // Score sentences by word frequency and position
    const wordFreq = {};
    const words = textContent.toLowerCase().match(/\b\w+\b/g) || [];
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    const sentenceScores = sentences.map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
      const score = sentenceWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0) / sentenceWords.length;
      const positionScore = index < sentences.length * 0.3 ? 1.2 : 1; // Boost early sentences
      
      return {
        sentence: sentence.trim(),
        score: score * positionScore,
        index
      };
    });

    // Return top sentences in original order
    const topSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, numSentences)
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence);

    return topSentences.join('. ') + '.';
  }

  // Answer a question based on indexed files
  async answerQuestion(userId, question) {
    console.log(`Answering question for user ${userId}: ${question}`);
    
    try {
      // 1. Search for relevant documents
      const searchResults = await this.searchFiles(userId, question, 5);
      
      if (searchResults.length === 0) {
        return {
          answer: "I couldn't find relevant information in your indexed files to answer that question.",
          sourceFiles: [],
          confidence: 0
        };
      }

      // 2. Combine relevant context
      const contextTexts = searchResults.map(result => result.content);
      const combinedContext = contextTexts.join('\n\n');
      
      // 3. Generate answer using summarization
      const answer = await this.summarizeText(combinedContext, 2);
      
      // 4. Extract unique source files
      const sourceFiles = [...new Set(searchResults.map(result => result.metadata.filePath))];
      
      // 5. Calculate confidence based on similarity scores
      const avgSimilarity = searchResults.reduce((sum, result) => sum + result.similarity, 0) / searchResults.length;
      const confidence = Math.round(avgSimilarity * 100);

      // 6. Store in chat history
      this.addToChatHistory(userId, question, answer, sourceFiles);

      return {
        answer,
        sourceFiles,
        confidence,
        relevantChunks: searchResults.length
      };
      
    } catch (error) {
      console.error('Error answering question:', error);
      return {
        answer: "I encountered an error while processing your question. Please try again.",
        sourceFiles: [],
        confidence: 0
      };
    }
  }

  // Get chat history for a user
  getChatHistory(userId) {
    return this.chatHistories.get(userId) || [];
  }

  // Add to chat history
  addToChatHistory(userId, question, answer, sourceFiles = []) {
    if (!this.chatHistories.has(userId)) {
      this.chatHistories.set(userId, []);
    }
    
    const history = this.chatHistories.get(userId);
    history.push({
      timestamp: new Date().toISOString(),
      question,
      answer,
      sourceFiles,
      type: 'qa'
    });
    
    // Keep only last 50 interactions
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  // Clear chat history for a user
  clearChatHistory(userId) {
    this.chatHistories.delete(userId);
  }

  // Chunk text into smaller pieces
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
      
      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastExclamation = text.lastIndexOf('!', end);
        const lastQuestion = text.lastIndexOf('?', end);
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (lastSentenceEnd > start + chunkSize * 0.7) {
          end = lastSentenceEnd + 1;
        } else {
          // Fall back to word boundaries
          const lastSpace = text.lastIndexOf(' ', end);
          if (lastSpace > start + chunkSize * 0.8) {
            end = lastSpace;
          }
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

  // Simple keyword similarity calculation
  calculateKeywordSimilarity(document, query) {
    const docLower = document.toLowerCase();
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    
    if (queryWords.length === 0) return 0;
    
    let matches = 0;
    let totalWords = queryWords.length;
    
    queryWords.forEach(word => {
      if (docLower.includes(word)) {
        matches++;
      }
    });
    
    return matches / totalWords;
  }

  // Get agent statistics
  getStats(userId = null) {
    if (userId) {
      const userIndex = this.getUserIndex(userId);
      const uniqueFiles = this.listIndexedFiles(userId);
      const chatHistory = this.getChatHistory(userId);
      
      return {
        documentsIndexed: userIndex.documents.length,
        filesIndexed: uniqueFiles.length,
        conversationHistory: chatHistory.length,
        isInitialized: this.isInitialized
      };
    }
    
    // Global stats
    const totalUsers = this.userIndices.size;
    const totalDocuments = Array.from(this.userIndices.values())
      .reduce((sum, index) => sum + index.documents.length, 0);
    
    return {
      totalUsers,
      totalDocuments,
      isInitialized: this.isInitialized
    };
  }
}

// Create singleton instance
const fetchitAIAgent = new FetchItAIAgent();
export default fetchitAIAgent;
