// File Storage Service - Handles file upload, storage, and retrieval
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Papa from 'papaparse';
import embeddingService from './embeddingService';
import llmService from './llmService';
import cloudStorageService from './cloudStorageService';
import ocrService from './ocrService';
import fetchitAIAgent from './fetchitAIAgent';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

class FileStorageService {
  constructor() {
    this.dbName = 'FetchItFileDB';
    this.dbVersion = 2; // Increment for embeddings support
    this.db = null;
    this.useCloudStorage = false;
    this.useEmbeddings = false;
    this.useOCR = false;
    this.initialized = false;
  }

  // Initialize the service
  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.initDB();
      await this.initializeServices();
      this.initialized = true;
    } catch (error) {
      console.error('FileStorageService initialization failed:', error);
      throw error;
    }
  }

  // Initialize additional services
  async initializeServices() {
    // Don't auto-initialize cloud storage to prevent Firebase errors
    try {
      await cloudStorageService.initialize();
      this.useCloudStorage = cloudStorageService.isAvailable();
    } catch (error) {
      console.log('Cloud storage not available - using local storage only');
      this.useCloudStorage = false;
    }
    
    this.useEmbeddings = embeddingService.isAvailable();
    this.useOCR = true; // OCR is always available with Tesseract
    
    if (this.useOCR) {
      await ocrService.initialize();
    }
    
    console.log('Services initialized:', {
      cloudStorage: this.useCloudStorage,
      embeddings: this.useEmbeddings,
      ocr: this.useOCR,
      llm: llmService.isAvailable()
    });
  }

  // Initialize IndexedDB
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create files store
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('name', 'name', { unique: false });
          filesStore.createIndex('type', 'type', { unique: false });
          filesStore.createIndex('uploadDate', 'uploadDate', { unique: false });
          filesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
        
        // Create file content store
        if (!db.objectStoreNames.contains('fileContent')) {
          db.createObjectStore('fileContent', { keyPath: 'fileId' });
        }
        
        // Create embeddings store
        if (!db.objectStoreNames.contains('embeddings')) {
          const embeddingsStore = db.createObjectStore('embeddings', { keyPath: 'id', autoIncrement: true });
          embeddingsStore.createIndex('fileId', 'fileId', { unique: false });
          embeddingsStore.createIndex('chunkIndex', 'chunkIndex', { unique: false });
        }
        
      };
    });
  }

  // Upload and process files
  async uploadFiles(files) {
    const results = [];
    
    for (const file of files) {
      try {
        const fileData = await this.processFile(file);
        const storedFile = await this.storeFile(fileData);
        results.push(storedFile);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results.push({ error: error.message, fileName: file.name });
      }
    }
    
    return results;
  }

  // Process individual file
  async processFile(file) {
    const fileId = this.generateFileId();
    const content = await this.extractContent(file);
    const metadata = this.extractMetadata(file, content);
    
    const fileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: new Date().toISOString(),
      lastModified: new Date(file.lastModified).toISOString(),
      content: content,
      metadata: metadata,
      tags: this.generateTags(file.name, content),
      searchableText: this.createSearchableText(file.name, content, metadata)
    };
    
    // Index with FetchIt AI Agent if available
    if (fetchitAIAgent.isAvailable() && content && content.length > 50) {
      try {
        const userId = 'default_user'; // Can be made dynamic later
        await fetchitAIAgent.indexFile(userId, file.name, metadata.fileExtension, content, {
          fileId: fileId,
          uploadDate: fileData.uploadDate,
          fileType: file.type,
          size: file.size
        });
        console.log(`Indexed file ${file.name} with FetchIt AI Agent`);
      } catch (error) {
        console.error('Error indexing with FetchIt AI Agent:', error);
      }
    }
    
    // Generate embeddings if service is available (fallback)
    if (this.useEmbeddings && content && content.length > 50) {
      try {
        const embeddings = await embeddingService.generateFileEmbeddings(content, file.name, fileId);
        fileData.embeddings = embeddings;
      } catch (error) {
        console.error('Error generating embeddings:', error);
      }
    }
    
    return fileData;
  }

  // Extract content based on file type
  async extractContent(file) {
    const fileType = file.type.toLowerCase();
    let content = '';
    
    try {
      if (fileType.includes('pdf')) {
        content = await this.extractPDFContent(file);
      } else if (fileType.includes('wordprocessingml') || fileType.includes('msword')) {
        content = await this.extractDocxContent(file);
      } else if (fileType.includes('spreadsheetml') || fileType.includes('csv')) {
        content = await this.extractCSVContent(file);
      } else if (fileType.includes('text') || fileType.includes('plain')) {
        content = await this.extractTextContent(file);
      } else if (this.useOCR && ocrService.isImageFile(file)) {
        // Use OCR for image files
        const ocrResult = await ocrService.extractTextFromImage(file);
        content = ocrResult.success ? ocrResult.text : 'OCR extraction failed';
      } else {
        content = 'Binary file - content extraction not supported';
      }
      
      return content;
    } catch (error) {
      console.error('Content extraction error:', error);
      return 'Content extraction failed';
    }
  }

  // Extract PDF content
  async extractPDFContent(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  }

  // Extract DOCX content
  async extractDocxContent(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  // Extract CSV content
  async extractCSVContent(file) {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true });
    
    // Convert CSV to readable text format
    let content = '';
    if (parsed.data && parsed.data.length > 0) {
      const headers = Object.keys(parsed.data[0]);
      content += `Headers: ${headers.join(', ')}\n\n`;
      
      parsed.data.slice(0, 10).forEach((row, index) => {
        content += `Row ${index + 1}:\n`;
        headers.forEach(header => {
          content += `  ${header}: ${row[header] || 'N/A'}\n`;
        });
        content += '\n';
      });
      
      if (parsed.data.length > 10) {
        content += `... and ${parsed.data.length - 10} more rows`;
      }
    }
    
    return content;
  }

  // Extract plain text content
  async extractTextContent(file) {
    return await file.text();
  }

  // Extract metadata
  extractMetadata(file, content) {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute
    
    return {
      wordCount,
      readingTime,
      fileExtension: file.name.split('.').pop()?.toLowerCase() || '',
      encoding: 'UTF-8',
      language: this.detectLanguage(content)
    };
  }

  // Generate tags from filename and content
  generateTags(filename, content) {
    const tags = new Set();
    
    // Extract from filename
    const nameWords = filename.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    nameWords.forEach(word => tags.add(word));
    
    // Extract from content (common business terms)
    const businessTerms = [
      'report', 'analysis', 'budget', 'sales', 'marketing', 'strategy',
      'project', 'proposal', 'meeting', 'presentation', 'quarterly',
      'annual', 'revenue', 'profit', 'client', 'customer', 'employee'
    ];
    
    const contentLower = content.toLowerCase();
    businessTerms.forEach(term => {
      if (contentLower.includes(term)) {
        tags.add(term);
      }
    });
    
    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  // Create searchable text
  createSearchableText(filename, content, metadata) {
    return `${filename} ${content} ${metadata.fileExtension} ${metadata.language}`.toLowerCase();
  }

  // Detect language (simple implementation)
  detectLanguage(content) {
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const contentLower = content.toLowerCase();
    const englishMatches = englishWords.filter(word => contentLower.includes(word)).length;
    
    return englishMatches > 3 ? 'English' : 'Unknown';
  }

  // Store file in IndexedDB and cloud
  async storeFile(fileData) {
    if (!this.db) await this.initDB();
    
    // Import encryption service
    const encryptionService = (await import('./encryptionService')).default;
    
    // Store embeddings if available
    if (fileData.embeddings && fileData.embeddings.length > 0) {
      await this.storeEmbeddings(fileData.embeddings);
    }
    
    // Store in cloud if available
    if (this.useCloudStorage) {
      try {
        const blob = new Blob([fileData.content || ''], { type: fileData.type });
        const file = new File([blob], fileData.name, { type: fileData.type });
        await cloudStorageService.uploadFile(file, fileData);
      } catch (error) {
        console.error('Cloud storage failed, using local only:', error);
      }
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files', 'fileContent'], 'readwrite');
      const filesStore = transaction.objectStore('files');
      const contentStore = transaction.objectStore('fileContent');
      
      // Store file metadata (encrypt sensitive fields)
      const fileRecord = { ...fileData };
      delete fileRecord.content; // Store content separately
      delete fileRecord.embeddings; // Store embeddings separately
      
      // Encrypt searchable text and tags
      try {
        fileRecord.searchableText = encryptionService.encrypt(fileData.searchableText);
        fileRecord.tags = encryptionService.encrypt(fileData.tags);
        fileRecord.metadata = encryptionService.encrypt(fileData.metadata);
      } catch (error) {
        console.error('Failed to encrypt file metadata:', error);
        // Store unencrypted as fallback
      }
      
      filesStore.add(fileRecord);
      
      // Store file content separately (encrypted)
      try {
        const encryptedContent = encryptionService.encrypt(fileData.content || '');
        contentStore.add({
          fileId: fileData.id,
          content: encryptedContent,
          encrypted: true
        });
      } catch (error) {
        console.error('Failed to encrypt file content:', error);
        // Store unencrypted as fallback
        contentStore.add({
          fileId: fileData.id,
          content: fileData.content || '',
          encrypted: false
        });
      }
      
      transaction.oncomplete = () => resolve(fileData);
      transaction.onerror = () => reject(transaction.error);
    });
  }
  
  // Store embeddings in IndexedDB
  async storeEmbeddings(embeddings) {
    if (!this.db || !embeddings || embeddings.length === 0) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['embeddings'], 'readwrite');
      const embeddingsStore = transaction.objectStore('embeddings');
      
      embeddings.forEach(embedding => {
        embeddingsStore.add(embedding);
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Search files with semantic search support
  async searchFiles(query, filters = {}) {
    if (!this.db) await this.initDB();
    
    const encryptionService = (await import('./encryptionService')).default;
    
    // Use semantic search if embeddings are available
    if (this.useEmbeddings && query && query.length > 10) {
      try {
        return await this.semanticSearch(query, filters);
      } catch (error) {
        console.error('Semantic search failed, falling back to text search:', error);
      }
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();
      
      request.onsuccess = () => {
        let files = request.result;
        
        // Decrypt searchable fields for search
        files = files.map(file => {
          const decryptedFile = { ...file };
          try {
            if (typeof file.searchableText === 'string' && file.searchableText.length > 100) {
              decryptedFile.searchableText = encryptionService.decrypt(file.searchableText);
            }
            if (typeof file.tags === 'string') {
              decryptedFile.tags = encryptionService.decrypt(file.tags);
            }
            if (typeof file.metadata === 'string') {
              decryptedFile.metadata = encryptionService.decrypt(file.metadata);
            }
          } catch (error) {
            // Keep original values if decryption fails
            console.warn('Failed to decrypt file metadata for search:', error);
          }
          return decryptedFile;
        });
        
        // Apply text search
        if (query) {
          const queryLower = query.toLowerCase();
          files = files.filter(file => 
            (file.searchableText && file.searchableText.includes(queryLower)) ||
            file.name.toLowerCase().includes(queryLower) ||
            (Array.isArray(file.tags) && file.tags.some(tag => tag.includes(queryLower)))
          );
        }
        
        // Apply filters
        if (filters.type) {
          files = files.filter(file => file.type.includes(filters.type));
        }
        
        if (filters.dateFrom) {
          files = files.filter(file => new Date(file.uploadDate) >= new Date(filters.dateFrom));
        }
        
        if (filters.dateTo) {
          files = files.filter(file => new Date(file.uploadDate) <= new Date(filters.dateTo));
        }
        
        if (filters.tags && filters.tags.length > 0) {
          files = files.filter(file => 
            filters.tags.some(tag => file.tags.includes(tag))
          );
        }
        
        // Sort by relevance (simple scoring)
        if (query) {
          files = files.map(file => ({
            ...file,
            relevanceScore: this.calculateRelevanceScore(file, query)
          })).sort((a, b) => b.relevanceScore - a.relevanceScore);
        } else {
          // Sort by upload date if no query
          files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        }
        
        resolve(files);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  // Semantic search using embeddings
  async semanticSearch(query, filters = {}) {
    if (!this.useEmbeddings) return [];
    
    try {
      // Generate query embedding
      const queryEmbedding = await embeddingService.generateQueryEmbedding(query);
      if (!queryEmbedding) return [];
      
      // Get all embeddings from database
      const embeddings = await this.getAllEmbeddings();
      if (embeddings.length === 0) return [];
      
      // Find most similar embeddings
      const similarities = embeddingService.findMostSimilar(queryEmbedding, embeddings, 20);
      
      // Get unique file IDs and their best scores
      const fileScores = new Map();
      similarities.forEach(sim => {
        const fileId = sim.document.fileId;
        const currentScore = fileScores.get(fileId) || 0;
        if (sim.similarity > currentScore) {
          fileScores.set(fileId, sim.similarity);
        }
      });
      
      // Get file metadata for top matches
      const files = await this.getFilesByIds(Array.from(fileScores.keys()));
      
      // Add similarity scores and apply filters
      let results = files.map(file => ({
        ...file,
        relevanceScore: fileScores.get(file.id) || 0
      })).filter(file => file.relevanceScore > 0.3); // Minimum similarity threshold
      
      // Apply additional filters
      if (filters.type) {
        results = results.filter(file => file.type.includes(filters.type));
      }
      
      if (filters.dateFrom) {
        results = results.filter(file => new Date(file.uploadDate) >= new Date(filters.dateFrom));
      }
      
      if (filters.dateTo) {
        results = results.filter(file => new Date(file.uploadDate) <= new Date(filters.dateTo));
      }
      
      return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }
  
  // Get all embeddings from database
  async getAllEmbeddings() {
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['embeddings'], 'readonly');
      const store = transaction.objectStore('embeddings');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result.map(item => ({
          embedding: item.embedding,
          document: {
            fileId: item.fileId,
            fileName: item.fileName,
            chunkIndex: item.chunkIndex,
            text: item.text
          }
        })));
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  // Get files by IDs
  async getFilesByIds(fileIds) {
    if (!this.db || fileIds.length === 0) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const results = [];
      let completed = 0;
      
      fileIds.forEach(fileId => {
        const request = store.get(fileId);
        request.onsuccess = () => {
          if (request.result) {
            results.push(request.result);
          }
          completed++;
          if (completed === fileIds.length) {
            resolve(results);
          }
        };
        request.onerror = () => {
          completed++;
          if (completed === fileIds.length) {
            resolve(results);
          }
        };
      });
    });
  }

  // Calculate relevance score
  calculateRelevanceScore(file, query) {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    // Exact name match
    if (file.name.toLowerCase().includes(queryLower)) {
      score += 50;
    }
    
    // Tag matches
    const tagMatches = file.tags.filter(tag => tag.includes(queryLower)).length;
    score += tagMatches * 20;
    
    // Content relevance (based on searchable text)
    const queryWords = queryLower.split(/\s+/);
    queryWords.forEach(word => {
      if (file.searchableText.includes(word)) {
        score += 10;
      }
    });
    
    // Recency bonus
    const daysSinceUpload = (Date.now() - new Date(file.uploadDate)) / (1000 * 60 * 60 * 24);
    if (daysSinceUpload < 7) score += 15;
    else if (daysSinceUpload < 30) score += 10;
    
    return Math.min(score, 100);
  }

  // Get file content
  async getFileContent(fileId) {
    if (!this.db) await this.initDB();
    
    const encryptionService = (await import('./encryptionService')).default;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['fileContent'], 'readonly');
      const store = transaction.objectStore('fileContent');
      const request = store.get(fileId);
      
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve('');
          return;
        }
        
        // Decrypt content if it was encrypted
        if (result.encrypted) {
          try {
            const decryptedContent = encryptionService.decrypt(result.content);
            resolve(decryptedContent);
          } catch (error) {
            console.error('Failed to decrypt file content:', error);
            resolve('Content decryption failed');
          }
        } else {
          resolve(result.content || '');
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get all files
  async getAllFiles() {
    return this.searchFiles('');
  }

  // Delete file
  async deleteFile(fileId) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files', 'fileContent'], 'readwrite');
      const filesStore = transaction.objectStore('files');
      const contentStore = transaction.objectStore('fileContent');
      
      filesStore.delete(fileId);
      contentStore.delete(fileId);
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Generate unique file ID
  generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get storage stats
  async getStorageStats() {
    const files = await this.getAllFiles();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    const typeStats = {};
    files.forEach(file => {
      const ext = file.metadata.fileExtension || 'unknown';
      typeStats[ext] = (typeStats[ext] || 0) + 1;
    });
    
    return {
      totalFiles: files.length,
      totalSize,
      typeBreakdown: typeStats,
      averageFileSize: files.length > 0 ? totalSize / files.length : 0
    };
  }
}

const fileStorageService = new FileStorageService();
export default fileStorageService;
