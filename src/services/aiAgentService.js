// AI Agent Service - Enhanced wrapper for FetchIt AI Agent with user management
import fetchitAIAgent from './fetchitAIAgent';

class AIAgentService {
  constructor() {
    this.agent = fetchitAIAgent;
    this.currentUserId = null;
    this.sessionStartTime = null;
  }

  // Initialize service with user context
  async initialize(userId = 'default_user') {
    this.currentUserId = userId;
    this.sessionStartTime = new Date().toISOString();
    
    // Wait for agent to be ready
    let attempts = 0;
    while (!this.agent.isAvailable() && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (this.agent.isAvailable()) {
      console.log(`AI Agent Service initialized for user: ${userId}`);
      return true;
    } else {
      console.warn('AI Agent Service failed to initialize');
      return false;
    }
  }

  // Check if service is ready
  isReady() {
    return this.agent.isAvailable() && this.currentUserId;
  }

  // Process user query with context
  async processQuery(query, context = {}) {
    if (!this.isReady()) {
      throw new Error('AI Agent Service not ready');
    }

    try {
      console.log(`Processing query for ${this.currentUserId}: ${query}`);
      
      // Add any contextual files if provided
      if (context.files && context.files.length > 0) {
        await this.indexContextFiles(context.files);
      }

      // Get response from AI agent
      const response = await this.agent.answerQuestion(this.currentUserId, query);
      
      // Enhance response with additional context
      return {
        ...response,
        timestamp: new Date().toISOString(),
        userId: this.currentUserId,
        queryProcessingTime: Date.now() - new Date().getTime()
      };
      
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        answer: "I encountered an error processing your request. Please try again.",
        sourceFiles: [],
        confidence: 0,
        error: error.message
      };
    }
  }

  // Index files from context
  async indexContextFiles(files) {
    for (const file of files) {
      try {
        if (file.content && file.content.length > 50) {
          await this.agent.indexFile(
            this.currentUserId,
            file.name || file.id,
            file.type || 'text',
            file.content,
            {
              source: 'context',
              timestamp: new Date().toISOString(),
              ...file.metadata
            }
          );
        }
      } catch (error) {
        console.warn(`Failed to index context file ${file.name}:`, error);
      }
    }
  }

  // Upload and index a file
  async uploadFile(file, content, metadata = {}) {
    if (!this.isReady()) {
      throw new Error('AI Agent Service not ready');
    }

    try {
      const result = await this.agent.indexFile(
        this.currentUserId,
        file.name,
        this.getFileType(file),
        content,
        {
          uploadDate: new Date().toISOString(),
          fileSize: file.size,
          mimeType: file.type,
          ...metadata
        }
      );

      console.log(`File ${file.name} uploaded and indexed successfully`);
      return result;
      
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      throw error;
    }
  }

  // Search user's files
  async searchFiles(query, options = {}) {
    if (!this.isReady()) {
      throw new Error('AI Agent Service not ready');
    }

    const { topK = 5, minSimilarity = 0.3 } = options;
    
    try {
      const results = await this.agent.searchFiles(this.currentUserId, query, topK);
      
      // Filter by minimum similarity if specified
      return results.filter(result => result.similarity >= minSimilarity);
      
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  // Get user's indexed files
  getIndexedFiles() {
    if (!this.isReady()) {
      return [];
    }

    return this.agent.listIndexedFiles(this.currentUserId);
  }

  // Remove a file from index
  async removeFile(filePath) {
    if (!this.isReady()) {
      throw new Error('AI Agent Service not ready');
    }

    try {
      const result = await this.agent.removeFile(this.currentUserId, filePath);
      console.log(`File ${filePath} removed from index`);
      return result;
      
    } catch (error) {
      console.error(`Error removing file ${filePath}:`, error);
      throw error;
    }
  }

  // Get conversation history
  getConversationHistory() {
    if (!this.isReady()) {
      return [];
    }

    return this.agent.getChatHistory(this.currentUserId);
  }

  // Clear conversation history
  clearHistory() {
    if (!this.isReady()) {
      return false;
    }

    this.agent.clearChatHistory(this.currentUserId);
    console.log(`Cleared conversation history for ${this.currentUserId}`);
    return true;
  }

  // Summarize text
  async summarizeText(text, options = {}) {
    const { sentences = 3 } = options;
    
    try {
      return await this.agent.summarizeText(text, sentences);
    } catch (error) {
      console.error('Error summarizing text:', error);
      return text.substring(0, 200) + '...'; // Fallback
    }
  }

  // Get service statistics
  getStats() {
    if (!this.isReady()) {
      return { error: 'Service not ready' };
    }

    const userStats = this.agent.getStats(this.currentUserId);
    const globalStats = this.agent.getStats();
    
    return {
      user: {
        ...userStats,
        userId: this.currentUserId,
        sessionStartTime: this.sessionStartTime
      },
      global: globalStats
    };
  }

  // Determine file type from file object
  getFileType(file) {
    if (file.type) {
      if (file.type.includes('pdf')) return 'pdf';
      if (file.type.includes('word') || file.type.includes('document')) return 'docx';
      if (file.type.includes('text')) return 'txt';
      if (file.type.includes('csv')) return 'csv';
    }
    
    // Fallback to extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension || 'txt';
  }

  // Health check
  async healthCheck() {
    try {
      const isAgentReady = this.agent.isAvailable();
      const stats = this.getStats();
      
      return {
        status: isAgentReady ? 'healthy' : 'unavailable',
        agent: isAgentReady,
        userId: this.currentUserId,
        timestamp: new Date().toISOString(),
        stats: stats.user || {}
      };
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Switch user context
  async switchUser(newUserId) {
    this.currentUserId = newUserId;
    this.sessionStartTime = new Date().toISOString();
    console.log(`Switched to user context: ${newUserId}`);
    return true;
  }
}

// Create singleton instance
const aiAgentService = new AIAgentService();
export default aiAgentService;
