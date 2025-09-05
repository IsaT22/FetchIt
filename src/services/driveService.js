// Google Drive API integration service
// This service handles file search and retrieval from Google Drive
import encryptionService from './encryptionService';
import fileStorageService from './fileStorageService';

class DriveService {
  constructor() {
    this.isInitialized = false;
    this.gapi = null;
  }

  // Initialize Google Drive API
  async initialize() {
    return new Promise((resolve) => {
      // Mock initialization for demo - replace with actual Google API
      setTimeout(() => {
        this.isInitialized = true;
        console.log('Drive API initialized (mock)');
        resolve(true);
      }, 1000);
    });
  }

  // Search for files by name or content
  async searchFiles(query, platforms = ['googleDrive']) {
    console.log(`🔍 DriveService.searchFiles called with query: "${query}"`);
    
    if (!this.isInitialized) {
      console.log('🔄 Initializing Drive service...');
      await this.initialize();
    }

    console.log('🔍 Searching Google Drive files with query:', query);
    console.log('🔐 Checking for stored Google Drive tokens...');
    
    // Check connection status first
    const connectionStatus = localStorage.getItem('connection_googleDrive');
    if (!connectionStatus) {
      console.log('❌ Google Drive not connected - no connection data found');
      throw new Error('Google Drive not connected. Please go to Connections and connect your Google Drive account.');
    }
    
    console.log('✅ Google Drive connection data found:', connectionStatus ? 'Yes' : 'No');
    console.log('🔑 Checking Google Drive authentication tokens...');
    let tokens = null;
    try {
      const encryptedTokens = localStorage.getItem('tokens_googleDrive');
      console.log('🔐 Encrypted tokens found:', !!encryptedTokens);
      if (encryptedTokens) {
        tokens = encryptionService.decrypt(encryptedTokens);
        console.log('✅ Tokens decrypted successfully');
        console.log('🔑 Token info:', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresAt: tokens.expires_at
        });
      }
    } catch (error) {
      console.warn('❌ Failed to decrypt Google Drive tokens:', error);
    }

    if (!tokens || !tokens.access_token) {
      console.log('❌ No valid Google Drive tokens found - user needs to authenticate');
      throw new Error('Please connect your Google Drive account to search files. Go to Connections → Google Drive to authenticate.');
    }

    try {
      // Extract keywords for better search
      const extractKeywords = (query) => {
        const commonWords = ['give', 'me', 'show', 'find', 'search', 'get', 'files', 'documents', 'docs', 'slides', 'sheets', 'related', 'to', 'about', 'containing', 'with', 'that', 'mentions', 'anything', 'google', 'drive', 'in', 'the'];
        const words = query.toLowerCase().split(/\s+/).filter(word => 
          word.length > 2 && !commonWords.includes(word)
        );
        return words;
      };
      
      const keywords = extractKeywords(query);
      console.log('🔍 Extracted keywords for search:', keywords);
      
      // Build comprehensive search query for each keyword
      const keywordQueries = keywords.map(keyword => 
        `(name contains '${keyword}' or fullText contains '${keyword}')`
      ).join(' or ');
      
      // Comprehensive file type filter including all Google Workspace types
      const fileTypeFilter = `(
        mimeType='application/vnd.google-apps.document' or 
        mimeType='application/vnd.google-apps.spreadsheet' or 
        mimeType='application/vnd.google-apps.presentation' or 
        mimeType='application/vnd.google-apps.folder' or
        mimeType='application/pdf' or 
        mimeType contains 'text' or 
        mimeType contains 'document' or 
        mimeType contains 'sheet' or 
        mimeType contains 'presentation'
      )`;
      
      const searchQuery = `(${keywordQueries}) and ${fileTypeFilter}`;
      console.log('🔍 Google Drive search query:', searchQuery);
      
      const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,parents)&pageSize=100&orderBy=modifiedTime desc`;
      console.log('🌐 Making API request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google Drive API error:', response.status, errorText);
        if (response.status === 401) {
          throw new Error('Google Drive authentication expired. Please reconnect your account.');
        }
        throw new Error(`Google Drive API error: ${response.status}`);
      }
      

      const data = await response.json();
      console.log('📄 Google Drive API response:', data);
      console.log(`📊 Found ${data.files?.length || 0} files from Google Drive API`);
      
      // Log detailed file information for debugging
      if (data.files && data.files.length > 0) {
        console.log('📋 Files found:');
        data.files.forEach((file, index) => {
          console.log(`  ${index + 1}. "${file.name}" (${file.mimeType})`);
        });
      } else {
        console.warn('⚠️ No files found! This might indicate:');
        console.warn('  - Search query is too restrictive');
        console.warn('  - Files don\'t match the mimeType filter');
        console.warn('  - Google Drive permissions issue');
        console.warn('  - Files are in folders that need different search approach');
      }
      
      // Process files with content and store them
      const filesWithContent = [];
      
      for (const file of data.files) {
        try {
          let content = '';
          let relevanceScore = 50;
          
          console.log(`📄 Processing file: ${file.name} (${file.mimeType})`);
          
          try {
            // Try to get file content based on file type
            let contentUrl = null;
            
            if (file.mimeType === 'application/vnd.google-apps.document') {
              contentUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
            } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
              contentUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
            } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
              contentUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
            } else if (file.mimeType === 'application/pdf') {
              // For PDFs, we can't easily extract text via API, but we can note it
              console.log(`📄 PDF file detected: ${file.name} - content extraction limited`);
            } else if (file.mimeType.includes('text')) {
              contentUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
            }
            
            if (contentUrl) {
              const contentResponse = await fetch(contentUrl, {
                headers: { 'Authorization': `Bearer ${tokens.access_token}` }
              });
              
              if (contentResponse.ok) {
                content = await contentResponse.text();
                console.log(`✅ Got content for ${file.name}: ${content.length} chars`);
                
                // Calculate relevance based on keyword matches in content
                const contentLower = content.toLowerCase();
                const keywordMatches = keywords.filter(keyword => 
                  contentLower.includes(keyword.toLowerCase())
                ).length;
                relevanceScore = Math.min(95, 50 + (keywordMatches / keywords.length) * 45);
                console.log(`🎯 Relevance score for ${file.name}: ${relevanceScore} (${keywordMatches}/${keywords.length} keywords matched)`);
              }
            } else {
              console.log(`⚠️ Cannot extract content from ${file.mimeType} file: ${file.name}`);
            }
          } catch (contentError) {
            console.warn(`Failed to get content for ${file.name}:`, contentError);
          }
          
          const fileData = {
            id: file.id,
            name: file.name,
            content: content,
            mimeType: file.mimeType,
            platform: 'Google Drive',
            size: file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink,
            webContentLink: file.webContentLink,
            summary: content.substring(0, 1000), // First 1000 chars for search
            relevanceScore: relevanceScore
          };
          
          // Store file content and metadata
          try {
            await fileStorageService.storeFile(fileData);
            console.log(`💾 Stored file: ${file.name}`);
          } catch (storeError) {
            console.warn(`Failed to store file ${file.name}:`, storeError);
          }

          // Index in vector database for semantic search
          try {
            const chromaService = (await import('./chromaService')).default;
            await chromaService.addDocument(file.id, file.name, content, {
              platform: 'googleDrive',
              mimeType: file.mimeType,
              webViewLink: file.webViewLink,
              modifiedTime: file.modifiedTime
            });
            console.log(`🔍 Indexed Google Drive file: ${file.name}`);
          } catch (error) {
            console.warn(`Error indexing file ${file.name} in vector DB:`, error);
          }

          filesWithContent.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            platform: 'Google Drive',
            size: file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink,
            webContentLink: file.webContentLink,
            content: content.substring(0, 1000), // First 1000 chars for search
            relevanceScore: relevanceScore
          });
          
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          // Continue with other files even if one fails
        }
      }
      
      const finalResults = filesWithContent.map(file => ({
        id: file.id,
        name: file.name,
        platform: 'Google Drive',
        mimeType: file.mimeType,
        size: file.size,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        content: file.content || '',
        summary: file.summary || `${file.name} - ${file.mimeType}`,
        relevanceScore: file.relevanceScore || 50
      }));

      console.log(`✅ Returning ${finalResults.length} processed Google Drive files`);
      console.log('📋 Final results:', finalResults.map(f => ({ name: f.name, relevance: f.relevanceScore })));
      
      return finalResults;

    } catch (error) {
      console.error('❌ Error searching Google Drive:', error);
      
      // Handle null errors
      if (!error) {
        throw new Error('Unknown error occurred while searching Google Drive');
      }
      
      // Check if it's an authentication error
      if (error.message && error.message.includes('401')) {
        throw new Error('Google Drive authentication expired. Please reconnect your account in Settings → Connections.');
      }
      
      // For other errors, throw with helpful message
      const errorMessage = error.message || 'Unknown error';
      throw new Error(`Failed to search Google Drive: ${errorMessage}. Please check your internet connection and try again.`);
    }
  }
}

const driveService = new DriveService();
export default driveService;
