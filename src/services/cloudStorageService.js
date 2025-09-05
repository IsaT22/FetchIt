// Cloud Storage Service - Disabled (Firebase not configured)

class CloudStorageService {
  constructor() {
    this.app = null;
    this.storage = null;
    this.firestore = null;
    this.isInitialized = false;
  }

  // Initialize Firebase - DISABLED
  async initialize() {
    console.log('Cloud storage disabled - Firebase not configured');
    this.isInitialized = false;
    return;
  }

  // Check if cloud storage is available
  isAvailable() {
    return false;
  }

  // Upload file to Firebase Storage - DISABLED
  async uploadFile(file, metadata = {}) {
    throw new Error('Cloud storage disabled - Firebase not configured');
  }

  // Get all files from cloud storage - DISABLED
  async getFiles(filters = {}) {
    return [];
  }

  // Search files in cloud storage - DISABLED
  async searchFiles(query, filters = {}) {
    return [];
  }

  // Calculate relevance score for search results - DISABLED
  calculateRelevanceScore(file, query) {
    return 0;
  }

  // Delete file from cloud storage - DISABLED
  async deleteFile(file) {
    throw new Error('Cloud storage disabled - Firebase not configured');
  }

  // Sync local file to cloud - DISABLED
  async syncToCloud(fileData, fileBlob) {
    console.log('Cloud storage not available for sync');
    return null;
  }

  // Get storage statistics - DISABLED
  async getStorageStats() {
    return {
      totalFiles: 0,
      totalSize: 0,
      byType: {}
    };
  }
}

// Create singleton instance
const cloudStorageService = new CloudStorageService();
export default cloudStorageService;
