// Feedback Service - Handles user feedback and sends to LLM for learning
import llmService from './llmService';

class FeedbackService {
  constructor() {
    this.feedbackQueue = [];
    this.isProcessing = false;
    this.batchSize = 5;
    this.processingInterval = 30000; // Process every 30 seconds
    this.startProcessing();
  }

  // Record user feedback and queue for LLM processing
  async recordFeedback(feedbackData) {
    const enhancedFeedback = {
      ...feedbackData,
      timestamp: new Date().toISOString(),
      processed: false,
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Store locally for persistence
    const existingFeedback = JSON.parse(localStorage.getItem('fetchit_file_feedback') || '[]');
    existingFeedback.push(enhancedFeedback);
    localStorage.setItem('fetchit_file_feedback', JSON.stringify(existingFeedback));

    // Add to processing queue
    this.feedbackQueue.push(enhancedFeedback);
    
    console.log('📝 Feedback recorded and queued for LLM processing:', enhancedFeedback);

    // Process immediately if queue is getting full
    if (this.feedbackQueue.length >= this.batchSize) {
      this.processFeedbackBatch();
    }

    return enhancedFeedback.id;
  }

  // Start automatic feedback processing
  startProcessing() {
    setInterval(() => {
      if (this.feedbackQueue.length > 0 && !this.isProcessing) {
        this.processFeedbackBatch();
      }
    }, this.processingInterval);
  }

  // Process feedback batch with LLM
  async processFeedbackBatch() {
    if (this.isProcessing || this.feedbackQueue.length === 0) return;

    const batch = this.feedbackQueue.splice(0, this.batchSize);
    this.isProcessing = true;
    
    console.log(`🤖 Processing ${batch.length} feedback items with LLM...`);

    try {
      // Send to LLM for analysis
      await this.sendFeedbackToLLM(batch);
      
      // Mark as processed in localStorage
      this.markFeedbackAsProcessed(batch);
      
      console.log(`✅ Successfully processed ${batch.length} feedback items`);
      
    } catch (error) {
      console.error('❌ Error processing feedback batch:', error);
      // Re-queue failed items
      this.feedbackQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  // Send feedback to LLM for learning
  async sendFeedbackToLLM(feedbackBatch) {
    if (!llmService.isAvailable()) {
      console.warn('LLM service not available, skipping feedback processing');
      return;
    }

    // Group feedback by query and file relevance
    const feedbackSummary = this.analyzeFeedbackPatterns(feedbackBatch);
    
    const learningPrompt = this.buildLearningPrompt(feedbackSummary);
    
    try {
      // Send to LLM for analysis and learning
      const llmResponse = await llmService.generateResponse(
        learningPrompt,
        [],
        []
      );
      
      console.log('🧠 LLM feedback analysis:', llmResponse);
      
      // Store LLM insights for future search improvements
      this.storeLearningInsights(feedbackSummary, llmResponse);
      
    } catch (error) {
      console.error('Error sending feedback to LLM:', error);
      throw error;
    }
  }

  // Analyze feedback patterns for learning
  analyzeFeedbackPatterns(feedbackBatch) {
    const patterns = {
      relevantFiles: [],
      irrelevantFiles: [],
      queryPatterns: {},
      fileTypePatterns: {},
      timestamp: new Date().toISOString()
    };

    feedbackBatch.forEach(feedback => {
      const { query, fileName, fileType, feedbackType, value } = feedback;
      
      if (feedbackType === 'relevant' && value) {
        patterns.relevantFiles.push({ fileName, fileType, query });
      } else if (feedbackType === 'notRelevant' && value) {
        patterns.irrelevantFiles.push({ fileName, fileType, query });
      }
      
      // Track query patterns
      if (!patterns.queryPatterns[query]) {
        patterns.queryPatterns[query] = { relevant: 0, irrelevant: 0 };
      }
      
      if (feedbackType === 'relevant' && value) {
        patterns.queryPatterns[query].relevant++;
      } else if (feedbackType === 'notRelevant' && value) {
        patterns.queryPatterns[query].irrelevant++;
      }
      
      // Track file type patterns
      if (fileType) {
        if (!patterns.fileTypePatterns[fileType]) {
          patterns.fileTypePatterns[fileType] = { relevant: 0, irrelevant: 0 };
        }
        
        if (feedbackType === 'relevant' && value) {
          patterns.fileTypePatterns[fileType].relevant++;
        } else if (feedbackType === 'notRelevant' && value) {
          patterns.fileTypePatterns[fileType].irrelevant++;
        }
      }
    });

    return patterns;
  }

  // Build learning prompt for LLM
  buildLearningPrompt(feedbackSummary) {
    return `You are FetchIt's learning system. Analyze this user feedback to improve future search results.

FEEDBACK ANALYSIS:
- Relevant files marked by users: ${feedbackSummary.relevantFiles.length}
- Irrelevant files marked by users: ${feedbackSummary.irrelevantFiles.length}

RELEVANT FILES:
${feedbackSummary.relevantFiles.map(f => `- "${f.fileName}" (${f.fileType}) for query: "${f.query}"`).join('\n')}

IRRELEVANT FILES:
${feedbackSummary.irrelevantFiles.map(f => `- "${f.fileName}" (${f.fileType}) for query: "${f.query}"`).join('\n')}

QUERY PATTERNS:
${Object.entries(feedbackSummary.queryPatterns).map(([query, stats]) => 
  `- "${query}": ${stats.relevant} relevant, ${stats.irrelevant} irrelevant`
).join('\n')}

Provide specific recommendations to improve search accuracy for similar queries in the future.`;
  }

  // Store learning insights
  storeLearningInsights(feedbackSummary, llmResponse) {
    const insights = {
      timestamp: new Date().toISOString(),
      feedbackSummary,
      llmRecommendations: llmResponse,
      totalFeedback: feedbackSummary.relevantFiles.length + feedbackSummary.irrelevantFiles.length
    };
    
    const existingInsights = JSON.parse(localStorage.getItem('fetchit_learning_insights') || '[]');
    existingInsights.push(insights);
    
    // Keep only last 50 insights to prevent storage bloat
    if (existingInsights.length > 50) {
      existingInsights.splice(0, existingInsights.length - 50);
    }
    
    localStorage.setItem('fetchit_learning_insights', JSON.stringify(existingInsights));
  }

  // Mark feedback as processed
  markFeedbackAsProcessed(feedbackBatch) {
    const processedIds = feedbackBatch.map(f => f.id);
    const existingFeedback = JSON.parse(localStorage.getItem('fetchit_file_feedback') || '[]');
    
    const updatedFeedback = existingFeedback.map(feedback => {
      if (processedIds.includes(feedback.id)) {
        return { ...feedback, processed: true, processedAt: new Date().toISOString() };
      }
      return feedback;
    });
    
    localStorage.setItem('fetchit_file_feedback', JSON.stringify(updatedFeedback));
  }

  // Get learning insights for search improvement
  getLearningInsights() {
    return JSON.parse(localStorage.getItem('fetchit_learning_insights') || '[]');
  }

  // Apply learning insights to improve search
  getSearchImprovements(query) {
    const insights = this.getLearningInsights();
    const improvements = {
      priorityKeywords: [],
      avoidKeywords: [],
      preferredFileTypes: [],
      avoidFileTypes: []
    };

    // Analyze insights to extract search improvements
    insights.forEach(insight => {
      if (insight.llmAnalysis && insight.feedbackSummary) {
        // Extract patterns from LLM analysis
        const analysis = insight.llmAnalysis.toLowerCase();
        
        // Look for keyword recommendations
        if (analysis.includes('prioritize') || analysis.includes('focus on')) {
          // Extract recommended keywords (simplified pattern matching)
          const queryWords = query.toLowerCase().split(' ');
          queryWords.forEach(word => {
            if (analysis.includes(word) && !improvements.priorityKeywords.includes(word)) {
              improvements.priorityKeywords.push(word);
            }
          });
        }
        
        // Look for file type preferences
        Object.entries(insight.feedbackSummary.fileTypePatterns).forEach(([type, stats]) => {
          const relevanceRatio = stats.relevant / (stats.relevant + stats.irrelevant);
          if (relevanceRatio > 0.7 && !improvements.preferredFileTypes.includes(type)) {
            improvements.preferredFileTypes.push(type);
          } else if (relevanceRatio < 0.3 && !improvements.avoidFileTypes.includes(type)) {
            improvements.avoidFileTypes.push(type);
          }
        });
      }
    });

    return improvements;
  }
}

// Create singleton instance
const feedbackService = new FeedbackService();
export default feedbackService;
