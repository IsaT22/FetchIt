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
  async searchFiles(query, setProcessingStatus, platforms = ['googleDrive']) {
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

      console.log('🔍 Starting Google Drive search for:', query);
      
      // Apply learning insights to improve search
      const feedbackService = (await import('./feedbackService')).default;
      const searchImprovements = feedbackService.getSearchImprovements(query);
      console.log('🧠 Applying learning insights:', searchImprovements);
      
      // Smart folder detection based on query context
      const folderHints = this.detectRelevantFolders(query);
      console.log('📁 Detected relevant folders:', folderHints);
      
      // Extract meaningful keywords from query - exclude generic query words
      const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'give', 'top', 'most', 'recently', 'edited', 'files', 'related', 'find', 'show', 'list', 'search'];
      
      const keywords = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word))
        .slice(0, 5); // Limit to 5 most relevant keywords
      
      console.log('🔍 Extracted keywords for search:', keywords);
      
      // Find relevant folders if hints detected
      let targetFolders = [];
      if (folderHints.length > 0) {
        if (setProcessingStatus) setProcessingStatus('Finding relevant folders...');
        targetFolders = await this.findFoldersByPattern(folderHints, tokens);
        console.log('📁 Found target folders:', targetFolders);
        
        // If we found specific folders, reduce search scope for faster results
        if (targetFolders.length > 0) {
          console.log('🎯 Using targeted folder search for faster results');
        }
      }

      // Build targeted search query with folder constraints
      let searchQuery;
      if (targetFolders.length > 0) {
        // Search within specific folders first
        const folderQueries = targetFolders.map(folder => 
          `'${folder.id}' in parents`
        ).join(' or ');
        
        const keywordQueries = keywords.map(keyword => 
          `(name contains '${keyword}' or fullText contains '${keyword}')`
        ).join(' or ');
        
        searchQuery = `(${folderQueries}) and (${keywordQueries}) and (mimeType contains 'document' or mimeType contains 'spreadsheet' or mimeType contains 'presentation' or mimeType contains 'pdf' or mimeType contains 'text' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.presentation')`;
      } else {
        // Fallback to general search
        const keywordQueries = keywords.map(keyword => 
          `(name contains '${keyword}' or fullText contains '${keyword}')`
        ).join(' or ');
        
        searchQuery = `(${keywordQueries}) and (mimeType contains 'document' or mimeType contains 'spreadsheet' or mimeType contains 'presentation' or mimeType contains 'pdf' or mimeType contains 'text' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.presentation')`;
      }
      console.log('🔍 Google Drive search query:', searchQuery);
      
      // Adjust page size based on search type - smaller for targeted searches
      const pageSize = targetFolders.length > 0 ? 20 : 100;
      const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,webContentLink,parents,owners,permissions,shared)&pageSize=${pageSize}`;
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
          // Try to refresh the token automatically
          console.log('🔄 Attempting to refresh expired token...');
          const tokenValidation = await import('./tokenValidationService');
          const refreshResult = await tokenValidation.default.validateAndRefreshToken();
          
          if (refreshResult.valid) {
            console.log('✅ Token refreshed, retrying search...');
            // Retry the search with refreshed tokens
            return this.searchFiles(query, setProcessingStatus);
          } else {
            throw new Error('Google Drive authentication expired. Please reconnect your account.');
          }
        }
        throw new Error(`Google Drive API error: ${response.status}`);
      }
      

      const data = await response.json();
      console.log('📄 Google Drive API response:', data);
      console.log(`📊 Found ${data.files?.length || 0} files from Google Drive API`);
      
      // Log detailed file information for debugging
      if (data.files && data.files.length > 0) {
        console.log('📋 All files found:');
        data.files.forEach((file, index) => {
          console.log(`${index + 1}. ${file.name} (${file.mimeType}) - ID: ${file.id}`);
        });
      }
      
      // Process files with content and store them
      const filesWithContent = [];
      
      for (const file of data.files) {
        if (typeof setProcessingStatus === 'function') {
          setProcessingStatus(`Reading ${file.name}...`);
        }
        try {
          let content = '';
          let relevanceScore = 50;
          
          console.log(`📄 Processing file: ${file.name} (${file.mimeType})`);
          
          try {
            // Try to get file content for different file types
            let contentUrl = null;
            
            if (file.mimeType === 'application/vnd.google-apps.document') {
              contentUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
            } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
              contentUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
            } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
              contentUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
            } else if (file.mimeType.includes('text') || file.mimeType.includes('document')) {
              contentUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
            }
            
            if (contentUrl) {
              console.log(`🔍 Attempting to read content from: ${file.name}`);
              const contentResponse = await fetch(contentUrl, {
                headers: { 'Authorization': `Bearer ${tokens.access_token}` }
              });
              
              if (contentResponse.ok) {
                content = await contentResponse.text();
                console.log(`✅ Successfully read ${content.length} characters from ${file.name}`);
                console.log(`📄 Content preview: "${content.substring(0, 100)}..."`);
              } else {
                console.warn(`Failed to read content for ${file.name}: ${contentResponse.status}`);
              }
            }
          } catch (contentError) {
            console.warn(`Failed to read content for ${file.name}:`, contentError);
            content = ''; // Continue without content
          }

          // Pre-filter: Check if file name contains any keywords before processing
          const lowerName = file.name ? file.name.toLowerCase() : '';
          const hasKeywordInName = keywords && keywords.length > 0 ? keywords.some(keyword => 
            keyword && lowerName.includes(keyword.toLowerCase())
          ) : false;

          // Strict keyword filtering: File must contain at least one keyword in name OR content
          const lowerContent = content ? content.toLowerCase() : '';
          const hasKeywordInContent = keywords && keywords.length > 0 ? keywords.some(keyword => 
            keyword && lowerContent.includes(keyword.toLowerCase())
          ) : false;

          if (!hasKeywordInName && !hasKeywordInContent) {
            console.log(`❌ Skipping ${file.name} - no relevant keywords found in name or content`);
            continue; // Skip this file entirely
          }

          // Additional strict filtering for specific queries
          const queryLower = query.toLowerCase();
          if (queryLower.includes('clotguard') || queryLower.includes('clot guard')) {
            const hasClotGuard = lowerName.includes('clotguard') || 
                               lowerName.includes('clot guard') ||
                               lowerContent.includes('clotguard') ||
                               lowerContent.includes('clot guard');
            
            if (!hasClotGuard) {
              console.log(`❌ Skipping ${file.name} - no ClotGuard references found`);
              continue;
            }
          }

          // Calculate relevance score based on keyword matches
          if (keywords && keywords.length > 0) {
            keywords.forEach(keyword => {
              if (keyword) {
                const keywordLower = keyword.toLowerCase();
                // Higher score for title matches
                if (lowerName.includes(keywordLower)) {
                  relevanceScore += 3;
                }
                // Score for content matches
                const contentMatches = (lowerContent.match(new RegExp(keywordLower, 'g')) || []).length;
                relevanceScore += contentMatches;
              }
            });
          }

          const fileData = {
            id: file.id,
            name: file.name,
            content: content,
            mimeType: file.mimeType,
            platform: 'Google Drive',
            size: file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
            modifiedTime: file.modifiedTime,
            createdTime: file.createdTime,
            webViewLink: file.webViewLink,
            webContentLink: file.webContentLink,
            owners: file.owners || [],
            permissions: file.permissions || [],
            shared: file.shared || false,
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

  // Smart folder detection based on query context
  detectRelevantFolders(query) {
    const queryLower = query.toLowerCase();
    const folderHints = [];
    
    // ClotGuard project detection
    if (queryLower.includes('clotguard') || queryLower.includes('clot guard')) {
      folderHints.push({ name: 'ClotGuard', pattern: 'clotguard' });
      
      // Testimonials subfolder detection
      if (queryLower.includes('testimony') || queryLower.includes('testimonial') || queryLower.includes('review') || queryLower.includes('feedback')) {
        folderHints.push({ name: 'Testimonials', pattern: 'testimonial' });
      }
    }
    
    // Other project patterns
    if (queryLower.includes('water') && queryLower.includes('filtration')) {
      folderHints.push({ name: 'Water Filtration', pattern: 'water' });
    }
    
    if (queryLower.includes('career') || queryLower.includes('exploration')) {
      folderHints.push({ name: 'Career', pattern: 'career' });
    }
    
    return folderHints;
  }

  // Find folder IDs by name patterns with hierarchical search
  async findFoldersByPattern(patterns, tokens) {
    const folders = [];
    
    for (const pattern of patterns) {
      try {
        const searchQuery = `mimeType='application/vnd.google-apps.folder' and name contains '${pattern.pattern}'`;
        const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,parents)&pageSize=50`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.files && data.files.length > 0) {
            for (const folder of data.files) {
              folders.push({
                id: folder.id,
                name: folder.name,
                pattern: pattern.pattern
              });
              
              // If this is a ClotGuard folder, also search for subfolders
              if (pattern.pattern === 'clotguard') {
                const subfolders = await this.findSubfolders(folder.id, tokens);
                folders.push(...subfolders);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to find folders for pattern ${pattern.pattern}:`, error);
      }
    }
    
    return folders;
  }

  // Find subfolders within a parent folder
  async findSubfolders(parentFolderId, tokens) {
    const subfolders = [];
    
    try {
      const searchQuery = `mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents`;
      const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,parents)&pageSize=50`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.length > 0) {
          subfolders.push(...data.files.map(folder => ({
            id: folder.id,
            name: folder.name,
            pattern: 'subfolder',
            parent: parentFolderId
          })));
        }
      }
    } catch (error) {
      console.warn(`Failed to find subfolders for parent ${parentFolderId}:`, error);
    }
    
    return subfolders;
  }

  // Strategic search for specific files within project folders
  async findSpecificFileInProject(projectName, fileName, tokens, setProcessingStatus) {
    console.log(`🎯 Strategic search: Looking for "${fileName}" in "${projectName}" project`);
    
    if (setProcessingStatus) setProcessingStatus(`Finding ${projectName} folder...`);
    
    // First, find the main project folder
    const projectFolders = await this.findFoldersByPattern([{ pattern: projectName.toLowerCase() }], tokens);
    console.log(`📁 Found ${projectFolders.length} ${projectName} folders:`, projectFolders);
    
    if (projectFolders.length === 0) {
      console.log(`❌ No ${projectName} folder found`);
      return [];
    }
    
    const results = [];
    
    for (const folder of projectFolders) {
      if (setProcessingStatus) setProcessingStatus(`Searching in ${folder.name} folder...`);
      
      // Search for the specific file in this folder and its subfolders
      const fileSearchQuery = `name contains '${fileName}' and ('${folder.id}' in parents)`;
      const fileApiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(fileSearchQuery)}&fields=files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,webContentLink,parents,owners,permissions,shared)&pageSize=20`;
      
      try {
        const response = await fetch(fileApiUrl, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.files && data.files.length > 0) {
            console.log(`✅ Found ${data.files.length} "${fileName}" files in ${folder.name}`);
            results.push(...data.files);
          }
        }
      } catch (error) {
        console.warn(`Failed to search for ${fileName} in folder ${folder.name}:`, error);
      }
      
      // Also search in subfolders
      if (folder.pattern === 'clotguard') {
        const subfolders = await this.findSubfolders(folder.id, tokens);
        for (const subfolder of subfolders) {
          if (setProcessingStatus) setProcessingStatus(`Searching in ${subfolder.name} subfolder...`);
          
          const subFileSearchQuery = `name contains '${fileName}' and ('${subfolder.id}' in parents)`;
          const subFileApiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(subFileSearchQuery)}&fields=files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,webContentLink,parents,owners,permissions,shared)&pageSize=20`;
          
          try {
            const response = await fetch(subFileApiUrl, {
              headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.files && data.files.length > 0) {
                console.log(`✅ Found ${data.files.length} "${fileName}" files in ${subfolder.name} subfolder`);
                results.push(...data.files);
              }
            }
          } catch (error) {
            console.warn(`Failed to search for ${fileName} in subfolder ${subfolder.name}:`, error);
          }
        }
      }
    }
    
    return results;
  }
}

const driveService = new DriveService();
export default driveService;
