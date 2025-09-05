// OCR Service - Handles Optical Character Recognition for images and scanned documents
import { createWorker } from 'tesseract.js';

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
  }

  // Initialize Tesseract worker
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.worker = await createWorker('eng');
      this.isInitialized = true;
      console.log('OCR service initialized with Tesseract.js');
    } catch (error) {
      console.error('Error initializing OCR service:', error);
      this.isInitialized = false;
    }
  }

  // Check if OCR service is available
  isAvailable() {
    return this.isInitialized && this.worker;
  }

  // Check if file type is supported for OCR
  isImageFile(file) {
    return this.supportedTypes.includes(file.type.toLowerCase());
  }

  // Extract text from image file
  async extractTextFromImage(file, options = {}) {
    if (!this.isAvailable()) {
      await this.initialize();
      if (!this.isAvailable()) {
        throw new Error('OCR service not available');
      }
    }

    if (!this.isImageFile(file)) {
      throw new Error(`Unsupported file type for OCR: ${file.type}`);
    }

    try {
      const { data: { text, confidence } } = await this.worker.recognize(file, {
        logger: options.onProgress || null
      });

      const cleanedText = this.cleanOCRText(text);
      
      return {
        success: true,
        text: cleanedText,
        confidence: confidence,
        originalText: text,
        wordCount: cleanedText.split(/\s+/).filter(word => word.length > 0).length
      };

    } catch (error) {
      console.error('OCR extraction error:', error);
      return {
        success: false,
        text: '',
        confidence: 0,
        error: error.message
      };
    }
  }

  // Extract text from multiple images
  async extractTextFromImages(files, options = {}) {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (options.onProgress) {
        options.onProgress({
          status: 'recognizing text',
          progress: (i / files.length) * 100,
          currentFile: file.name
        });
      }

      try {
        const result = await this.extractTextFromImage(file, {
          onProgress: options.onProgress
        });
        
        results.push({
          fileName: file.name,
          fileSize: file.size,
          ...result
        });
      } catch (error) {
        results.push({
          fileName: file.name,
          fileSize: file.size,
          success: false,
          text: '',
          confidence: 0,
          error: error.message
        });
      }
    }

    return results;
  }

  // Clean and normalize OCR text output
  cleanOCRText(text) {
    if (!text) return '';

    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove common OCR artifacts
      .replace(/[|\\]/g, 'I')
      .replace(/[0O]/g, (match, offset, string) => {
        // Context-based O/0 correction (basic)
        const before = string[offset - 1];
        const after = string[offset + 1];
        if (/[a-zA-Z]/.test(before) || /[a-zA-Z]/.test(after)) {
          return 'O';
        }
        return match;
      })
      // Fix common character substitutions
      .replace(/rn/g, 'm')
      .replace(/\b1\b/g, 'I')
      // Remove leading/trailing whitespace
      .trim();
  }

  // Analyze OCR quality and suggest improvements
  analyzeOCRQuality(result) {
    const analysis = {
      quality: 'unknown',
      confidence: result.confidence || 0,
      suggestions: []
    };

    if (result.confidence > 85) {
      analysis.quality = 'excellent';
    } else if (result.confidence > 70) {
      analysis.quality = 'good';
    } else if (result.confidence > 50) {
      analysis.quality = 'fair';
      analysis.suggestions.push('Consider improving image quality or resolution');
    } else {
      analysis.quality = 'poor';
      analysis.suggestions.push('Image quality is too low for reliable OCR');
      analysis.suggestions.push('Try scanning at higher resolution or better lighting');
    }

    // Check for common issues
    const text = result.text || '';
    if (text.length < 10) {
      analysis.suggestions.push('Very little text detected - check if image contains readable text');
    }

    const specialCharRatio = (text.match(/[^a-zA-Z0-9\s]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) {
      analysis.suggestions.push('High number of special characters detected - may indicate OCR errors');
    }

    return analysis;
  }

  // Process scanned PDF pages (if PDF is converted to images first)
  async processScannedPDF(imageFiles, options = {}) {
    const results = await this.extractTextFromImages(imageFiles, options);
    
    // Combine all text from pages
    const combinedText = results
      .filter(result => result.success)
      .map(result => result.text)
      .join('\n\n--- Page Break ---\n\n');

    const totalConfidence = results.reduce((sum, result) => sum + (result.confidence || 0), 0) / results.length;

    return {
      success: results.some(result => result.success),
      text: combinedText,
      confidence: totalConfidence,
      pageResults: results,
      totalPages: results.length,
      successfulPages: results.filter(result => result.success).length
    };
  }

  // Terminate worker to free resources
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('OCR service terminated');
    }
  }

  // Get supported file types
  getSupportedTypes() {
    return [...this.supportedTypes];
  }

  // Validate file for OCR processing
  validateFile(file) {
    const errors = [];
    
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    if (!this.isImageFile(file)) {
      errors.push(`Unsupported file type: ${file.type}. Supported types: ${this.supportedTypes.join(', ')}`);
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      errors.push('File size too large (max 10MB for OCR processing)');
    }

    if (file.size < 1024) { // 1KB minimum
      errors.push('File size too small (minimum 1KB)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
const ocrService = new OCRService();
export default ocrService;
