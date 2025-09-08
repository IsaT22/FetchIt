// Notion Service - API integration for Notion workspace access
import encryptionService from './encryptionService';

class NotionService {
  constructor() {
    this.baseUrl = 'https://api.notion.com/v1';
    this.version = '2022-06-28';
  }

  // Get stored access token
  getAccessToken() {
    try {
      console.log('🔍 NotionService: Attempting to retrieve access token...');
      
      // First try the standard storage location
      let encryptedTokens = localStorage.getItem('tokens_notion');
      console.log('🔍 NotionService: tokens_notion in localStorage:', encryptedTokens ? 'FOUND' : 'NOT_FOUND');
      
      // If not found, try the connection-based storage
      if (!encryptedTokens) {
        console.log('🔍 NotionService: Checking connection-based storage...');
        const connectionData = encryptionService.getCredentials('notion');
        console.log('🔍 NotionService: Connection data:', connectionData ? 'FOUND' : 'NOT_FOUND');
        
        if (connectionData && connectionData.tokens && connectionData.tokens.access_token) {
          console.log('🔑 Found Notion token in connection storage');
          return connectionData.tokens.access_token;
        }
      }
      
      if (!encryptedTokens) {
        console.error('❌ No Notion access token found in any storage location');
        throw new Error('No Notion access token found');
      }
      
      console.log('🔑 Found Notion token in localStorage, decrypting...');
      const tokens = encryptionService.decrypt(encryptedTokens);
      return tokens.access_token;
    } catch (error) {
      console.error('Error retrieving Notion access token:', error);
      throw new Error('Failed to retrieve Notion access token');
    }
  }

  // Make authenticated API request to Notion
  async makeRequest(endpoint, options = {}) {
    const token = this.getAccessToken();
    
    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': this.version,
      'Content-Type': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Notion API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  // Get user information
  async getUserInfo() {
    try {
      return await this.makeRequest('/users/me');
    } catch (error) {
      console.error('Error fetching Notion user info:', error);
      throw error;
    }
  }

  // Search for pages and databases
  async search(query = '', options = {}) {
    try {
      const searchBody = {
        query,
        ...options
      };

      return await this.makeRequest('/search', {
        method: 'POST',
        body: JSON.stringify(searchBody)
      });
    } catch (error) {
      console.error('Error searching Notion:', error);
      throw error;
    }
  }

  // Get page content
  async getPage(pageId) {
    try {
      return await this.makeRequest(`/pages/${pageId}`);
    } catch (error) {
      console.error('Error fetching Notion page:', error);
      throw error;
    }
  }

  // Get page blocks (content)
  async getPageBlocks(pageId) {
    try {
      return await this.makeRequest(`/blocks/${pageId}/children`);
    } catch (error) {
      console.error('Error fetching Notion page blocks:', error);
      throw error;
    }
  }

  // Get database
  async getDatabase(databaseId) {
    try {
      return await this.makeRequest(`/databases/${databaseId}`);
    } catch (error) {
      console.error('Error fetching Notion database:', error);
      throw error;
    }
  }

  // Query database
  async queryDatabase(databaseId, query = {}) {
    try {
      return await this.makeRequest(`/databases/${databaseId}/query`, {
        method: 'POST',
        body: JSON.stringify(query)
      });
    } catch (error) {
      console.error('Error querying Notion database:', error);
      throw error;
    }
  }

  // Search pages for multi-platform search service
  async searchPages(query) {
    try {
      console.log('🔍 Searching Notion pages with query:', query);
      
      const searchResults = await this.search(query, {
        filter: {
          value: 'page',
          property: 'object'
        }
      });

      // Format results for multi-platform search
      const formattedResults = searchResults.results.map(page => ({
        id: page.id,
        name: this.getPageTitle(page),
        content: this.getPagePreview(page),
        webViewLink: page.url,
        type: 'page',
        lastEditedTime: page.last_edited_time,
        createdTime: page.created_time
      }));

      console.log(`✅ Found ${formattedResults.length} Notion pages`);
      return formattedResults;
    } catch (error) {
      console.error('Error searching Notion pages:', error);
      throw error;
    }
  }

  // Helper to extract page title
  getPageTitle(page) {
    if (page.properties && page.properties.title) {
      const titleProperty = page.properties.title;
      if (titleProperty.title && titleProperty.title.length > 0) {
        return titleProperty.title[0].plain_text;
      }
    }
    
    // Try other common title properties
    for (const [key, property] of Object.entries(page.properties || {})) {
      if (property.type === 'title' && property.title && property.title.length > 0) {
        return property.title[0].plain_text;
      }
    }
    
    return 'Untitled Page';
  }

  // Helper to get page preview content
  getPagePreview(page) {
    // Try to get preview from properties
    const properties = page.properties || {};
    const previewText = [];
    
    for (const [key, property] of Object.entries(properties)) {
      if (property.type === 'rich_text' && property.rich_text && property.rich_text.length > 0) {
        previewText.push(property.rich_text[0].plain_text);
      }
    }
    
    return previewText.join(' ').substring(0, 200) || 'No preview available';
  }

  // Extract text content from blocks
  extractTextFromBlocks(blocks) {
    let text = '';
    
    for (const block of blocks) {
      switch (block.type) {
        case 'paragraph':
          text += this.extractRichText(block.paragraph.rich_text) + '\n';
          break;
        case 'heading_1':
          text += '# ' + this.extractRichText(block.heading_1.rich_text) + '\n';
          break;
        case 'heading_2':
          text += '## ' + this.extractRichText(block.heading_2.rich_text) + '\n';
          break;
        case 'heading_3':
          text += '### ' + this.extractRichText(block.heading_3.rich_text) + '\n';
          break;
        case 'bulleted_list_item':
          text += '• ' + this.extractRichText(block.bulleted_list_item.rich_text) + '\n';
          break;
        case 'numbered_list_item':
          text += '1. ' + this.extractRichText(block.numbered_list_item.rich_text) + '\n';
          break;
        case 'to_do':
          const checked = block.to_do.checked ? '[x]' : '[ ]';
          text += `${checked} ${this.extractRichText(block.to_do.rich_text)}\n`;
          break;
        case 'code':
          text += '```\n' + this.extractRichText(block.code.rich_text) + '\n```\n';
          break;
        case 'quote':
          text += '> ' + this.extractRichText(block.quote.rich_text) + '\n';
          break;
        default:
          // Handle other block types as plain text
          if (block[block.type] && block[block.type].rich_text) {
            text += this.extractRichText(block[block.type].rich_text) + '\n';
          }
      }
    }
    
    return text.trim();
  }

  // Extract plain text from rich text array
  extractRichText(richTextArray) {
    return richTextArray.map(item => item.plain_text).join('');
  }

  // Get page content with text extraction
  async getPageContent(pageId) {
    try {
      const [page, blocks] = await Promise.all([
        this.getPage(pageId),
        this.getPageBlocks(pageId)
      ]);

      const title = this.extractPageTitle(page);
      const content = this.extractTextFromBlocks(blocks.results);

      return {
        id: pageId,
        title,
        content,
        url: page.url,
        lastEditedTime: page.last_edited_time,
        createdTime: page.created_time
      };
    } catch (error) {
      console.error('Error getting Notion page content:', error);
      throw error;
    }
  }

  // Extract page title from page object
  extractPageTitle(page) {
    if (page.properties && page.properties.title) {
      return this.extractRichText(page.properties.title.title);
    } else if (page.properties) {
      // Find the first title property
      for (const [key, value] of Object.entries(page.properties)) {
        if (value.type === 'title') {
          return this.extractRichText(value.title);
        }
      }
    }
    return 'Untitled';
  }

  // Test connection
  async testConnection() {
    try {
      const user = await this.getUserInfo();
      return {
        success: true,
        user: {
          name: user.name,
          email: user.person?.email || 'N/A',
          id: user.id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new NotionService();
