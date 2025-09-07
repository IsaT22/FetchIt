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
      const encryptedTokens = localStorage.getItem('tokens_notion');
      if (!encryptedTokens) {
        throw new Error('No Notion access token found');
      }
      
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
