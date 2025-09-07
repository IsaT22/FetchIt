// Canva API Service - Integration for design content access
import encryptionService from './encryptionService';

class CanvaService {
  constructor() {
    this.baseUrl = 'https://api.canva.com/rest/v1';
    this.apiVersion = '1.0';
  }

  // Get stored access token
  async getAccessToken() {
    const encryptedTokens = localStorage.getItem('tokens_canva');
    if (!encryptedTokens) return null;

    try {
      const tokens = encryptionService.decrypt(encryptedTokens);
      return tokens.access_token;
    } catch (error) {
      console.error('Failed to decrypt Canva tokens:', error);
      return null;
    }
  }

  // Make authenticated request to Canva API
  async makeAuthenticatedRequest(endpoint, options = {}) {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('No Canva access token available');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`Canva API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get user profile information
  async getUserInfo() {
    try {
      const data = await this.makeAuthenticatedRequest('/me');
      return {
        id: data.id,
        name: data.display_name,
        email: data.email,
        avatar: data.avatar?.url
      };
    } catch (error) {
      console.error('Failed to get Canva user info:', error);
      throw error;
    }
  }

  // Get user's designs
  async getDesigns(limit = 20) {
    try {
      const data = await this.makeAuthenticatedRequest(`/designs?limit=${limit}`);
      return data.items || [];
    } catch (error) {
      console.error('Failed to get Canva designs:', error);
      throw error;
    }
  }

  // Get design content by ID
  async getDesignContent(designId) {
    try {
      const data = await this.makeAuthenticatedRequest(`/designs/${designId}`);
      return data;
    } catch (error) {
      console.error(`Failed to get Canva design ${designId}:`, error);
      throw error;
    }
  }

  // Search designs
  async searchDesigns(query, limit = 20) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const data = await this.makeAuthenticatedRequest(`/designs?query=${encodedQuery}&limit=${limit}`);
      return data.items || [];
    } catch (error) {
      console.error('Failed to search Canva designs:', error);
      throw error;
    }
  }

  // Get design export URLs
  async getDesignExports(designId, format = 'png') {
    try {
      const data = await this.makeAuthenticatedRequest(`/designs/${designId}/exports`, {
        method: 'POST',
        body: JSON.stringify({
          format: format,
          quality: 'high'
        })
      });
      return data;
    } catch (error) {
      console.error(`Failed to get Canva design exports for ${designId}:`, error);
      throw error;
    }
  }

  // Get folders
  async getFolders() {
    try {
      const data = await this.makeAuthenticatedRequest('/folders');
      return data.items || [];
    } catch (error) {
      console.error('Failed to get Canva folders:', error);
      throw error;
    }
  }

  // Get designs in a folder
  async getFolderDesigns(folderId, limit = 20) {
    try {
      const data = await this.makeAuthenticatedRequest(`/folders/${folderId}/items?limit=${limit}`);
      return data.items || [];
    } catch (error) {
      console.error(`Failed to get Canva folder ${folderId} designs:`, error);
      throw error;
    }
  }

  // Extract text content from design for search indexing
  async extractTextFromDesign(design) {
    try {
      let textContent = '';
      
      // Add design title and description
      if (design.title) {
        textContent += `Title: ${design.title}\n`;
      }
      
      if (design.description) {
        textContent += `Description: ${design.description}\n`;
      }

      // Add tags if available
      if (design.tags && design.tags.length > 0) {
        textContent += `Tags: ${design.tags.join(', ')}\n`;
      }

      // Add folder information if available
      if (design.folder && design.folder.name) {
        textContent += `Folder: ${design.folder.name}\n`;
      }

      // Add creation and modification dates
      if (design.created_at) {
        textContent += `Created: ${new Date(design.created_at).toLocaleDateString()}\n`;
      }

      if (design.updated_at) {
        textContent += `Updated: ${new Date(design.updated_at).toLocaleDateString()}\n`;
      }

      // Add design type and dimensions
      if (design.design_type) {
        textContent += `Type: ${design.design_type}\n`;
      }

      if (design.thumbnail && design.thumbnail.width && design.thumbnail.height) {
        textContent += `Dimensions: ${design.thumbnail.width}x${design.thumbnail.height}\n`;
      }

      return textContent.trim();
    } catch (error) {
      console.error('Failed to extract text from Canva design:', error);
      return '';
    }
  }

  // Test connection to Canva
  async testConnection() {
    try {
      const userInfo = await this.getUserInfo();
      return {
        success: true,
        user: userInfo,
        message: `Connected to Canva as ${userInfo.name}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to connect to Canva'
      };
    }
  }

  // Get all accessible content for search
  async getAllContent() {
    try {
      const [designs, folders] = await Promise.all([
        this.getDesigns(100),
        this.getFolders()
      ]);

      const content = [];

      // Add designs
      for (const design of designs) {
        const textContent = await this.extractTextFromDesign(design);
        content.push({
          id: design.id,
          title: design.title || 'Untitled Design',
          content: textContent,
          type: 'design',
          url: design.urls?.view_url,
          thumbnail: design.thumbnail?.url,
          created_at: design.created_at,
          updated_at: design.updated_at
        });
      }

      // Add folder information
      for (const folder of folders) {
        content.push({
          id: folder.id,
          title: folder.name,
          content: `Folder: ${folder.name}\nCreated: ${new Date(folder.created_at).toLocaleDateString()}`,
          type: 'folder',
          created_at: folder.created_at
        });
      }

      return content;
    } catch (error) {
      console.error('Failed to get all Canva content:', error);
      throw error;
    }
  }
}

const canvaService = new CanvaService();
export default canvaService;
