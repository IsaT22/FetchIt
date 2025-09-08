import encryptionService from './encryptionService';

class GitHubService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.apiVersion = '2022-11-28';
  }

  // Get access token from encrypted storage
  async getAccessToken() {
    try {
      console.log('🔍 GitHubService: Attempting to retrieve access token...');
      
      // First try the standard storage location
      let encryptedToken = localStorage.getItem('github_access_token');
      console.log('🔍 GitHubService: github_access_token in localStorage:', encryptedToken ? 'FOUND' : 'NOT_FOUND');
      
      // If not found, try the connection-based storage
      if (!encryptedToken) {
        console.log('🔍 GitHubService: Checking connection-based storage...');
        const connectionData = encryptionService.getStoredCredentials('github');
        console.log('🔍 GitHubService: Connection data:', connectionData ? 'FOUND' : 'NOT_FOUND');
        
        if (connectionData && connectionData.tokens && connectionData.tokens.access_token) {
          console.log('🔑 Found GitHub token in connection storage');
          return connectionData.tokens.access_token;
        }
      }
      
      // Try the tokens_github location used by oauthService
      if (!encryptedToken) {
        console.log('🔍 GitHubService: Checking tokens_github storage...');
        const tokensGithub = localStorage.getItem('tokens_github');
        console.log('🔍 GitHubService: tokens_github in localStorage:', tokensGithub ? 'FOUND' : 'NOT_FOUND');
        
        if (tokensGithub) {
          try {
            const tokens = encryptionService.decrypt(tokensGithub);
            if (tokens && tokens.access_token) {
              console.log('🔑 Found GitHub token in tokens_github storage');
              return tokens.access_token;
            }
          } catch (decryptError) {
            console.warn('Failed to decrypt tokens_github:', decryptError);
          }
        }
      }
      
      if (!encryptedToken) {
        console.error('❌ No GitHub access token found in any storage location');
        console.log('🔍 Available localStorage keys:', Object.keys(localStorage).filter(k => k.includes('github') || k.includes('token')));
        throw new Error('No GitHub access token found');
      }
      
      console.log('🔑 Found GitHub token in localStorage, decrypting...');
      return await encryptionService.decrypt(encryptedToken);
    } catch (error) {
      console.error('Error retrieving GitHub access token:', error);
      throw new Error('Failed to retrieve GitHub access token');
    }
  }

  // Make authenticated request to GitHub API
  async makeAuthenticatedRequest(endpoint, options = {}) {
    try {
      const accessToken = await this.getAccessToken();
      
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': this.apiVersion,
        'Content-Type': 'application/json',
        ...options.headers
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GitHub API request failed:', error);
      throw error;
    }
  }

  // Get user information
  async getUserInfo() {
    try {
      return await this.makeAuthenticatedRequest('/user');
    } catch (error) {
      console.error('Error fetching GitHub user info:', error);
      throw error;
    }
  }

  // Get user repositories
  async getRepositories(options = {}) {
    try {
      const {
        type = 'all', // all, owner, public, private, member
        sort = 'updated', // created, updated, pushed, full_name
        direction = 'desc', // asc, desc
        per_page = 30,
        page = 1
      } = options;

      const params = new URLSearchParams({
        type,
        sort,
        direction,
        per_page: per_page.toString(),
        page: page.toString()
      });

      return await this.makeAuthenticatedRequest(`/user/repos?${params}`);
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      throw error;
    }
  }

  // Get repository contents
  async getRepositoryContents(owner, repo, path = '') {
    try {
      const endpoint = `/repos/${owner}/${repo}/contents/${path}`;
      return await this.makeAuthenticatedRequest(endpoint);
    } catch (error) {
      console.error('Error fetching repository contents:', error);
      throw error;
    }
  }

  // Get file content
  async getFileContent(owner, repo, path) {
    try {
      const response = await this.getRepositoryContents(owner, repo, path);
      
      if (response.type === 'file' && response.content) {
        // Decode base64 content
        const content = atob(response.content.replace(/\n/g, ''));
        return {
          ...response,
          decodedContent: content
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw error;
    }
  }

  // Search repositories
  async searchRepositories(query, options = {}) {
    try {
      const {
        sort = 'updated', // stars, forks, help-wanted-issues, updated
        order = 'desc', // asc, desc
        per_page = 30,
        page = 1
      } = options;

      const params = new URLSearchParams({
        q: query,
        sort,
        order,
        per_page: per_page.toString(),
        page: page.toString()
      });

      return await this.makeAuthenticatedRequest(`/search/repositories?${params}`);
    } catch (error) {
      console.error('Error searching repositories:', error);
      throw error;
    }
  }

  // Search code within repositories
  async searchCode(query, options = {}) {
    try {
      const {
        sort = 'indexed', // indexed, best-match
        order = 'desc', // asc, desc
        per_page = 30,
        page = 1
      } = options;

      const params = new URLSearchParams({
        q: query,
        sort,
        order,
        per_page: per_page.toString(),
        page: page.toString()
      });

      return await this.makeAuthenticatedRequest(`/search/code?${params}`);
    } catch (error) {
      console.error('Error searching code:', error);
      throw error;
    }
  }

  // Get user's gists
  async getGists(options = {}) {
    try {
      const {
        since = null, // ISO 8601 timestamp
        per_page = 30,
        page = 1
      } = options;

      const params = new URLSearchParams({
        per_page: per_page.toString(),
        page: page.toString()
      });

      if (since) {
        params.set('since', since);
      }

      return await this.makeAuthenticatedRequest(`/gists?${params}`);
    } catch (error) {
      console.error('Error fetching gists:', error);
      throw error;
    }
  }

  // Get gist content
  async getGist(gistId) {
    try {
      return await this.makeAuthenticatedRequest(`/gists/${gistId}`);
    } catch (error) {
      console.error('Error fetching gist:', error);
      throw error;
    }
  }

  // Get repository issues
  async getIssues(owner, repo, options = {}) {
    try {
      const {
        state = 'open', // open, closed, all
        sort = 'created', // created, updated, comments
        direction = 'desc', // asc, desc
        per_page = 30,
        page = 1
      } = options;

      const params = new URLSearchParams({
        state,
        sort,
        direction,
        per_page: per_page.toString(),
        page: page.toString()
      });

      return await this.makeAuthenticatedRequest(`/repos/${owner}/${repo}/issues?${params}`);
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  }

  // Get repository pull requests
  async getPullRequests(owner, repo, options = {}) {
    try {
      const {
        state = 'open', // open, closed, all
        sort = 'created', // created, updated, popularity, long-running
        direction = 'desc', // asc, desc
        per_page = 30,
        page = 1
      } = options;

      const params = new URLSearchParams({
        state,
        sort,
        direction,
        per_page: per_page.toString(),
        page: page.toString()
      });

      return await this.makeAuthenticatedRequest(`/repos/${owner}/${repo}/pulls?${params}`);
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      throw error;
    }
  }

  // Extract text content from various GitHub resources
  extractTextContent(data, type = 'auto') {
    try {
      let text = '';

      if (type === 'auto') {
        // Auto-detect type based on data structure
        if (data.content && data.type === 'file') {
          type = 'file';
        } else if (data.body !== undefined) {
          type = 'issue_or_pr';
        } else if (data.description !== undefined) {
          type = 'repository';
        } else if (data.files) {
          type = 'gist';
        }
      }

      switch (type) {
        case 'file':
          if (data.decodedContent) {
            text = data.decodedContent;
          } else if (data.content) {
            text = atob(data.content.replace(/\n/g, ''));
          }
          break;

        case 'repository':
          text = `Repository: ${data.name}\n`;
          if (data.description) text += `Description: ${data.description}\n`;
          if (data.readme) text += `README: ${data.readme}\n`;
          break;

        case 'issue_or_pr':
          text = `Title: ${data.title}\n`;
          if (data.body) text += `Body: ${data.body}\n`;
          break;

        case 'gist':
          text = `Gist: ${data.description || 'Untitled'}\n`;
          if (data.files) {
            Object.values(data.files).forEach(file => {
              text += `File: ${file.filename}\n${file.content}\n\n`;
            });
          }
          break;

        default:
          text = JSON.stringify(data, null, 2);
      }

      return text.trim();
    } catch (error) {
      console.error('Error extracting text content:', error);
      return JSON.stringify(data, null, 2);
    }
  }

  // Test connection
  async testConnection() {
    try {
      const userInfo = await this.getUserInfo();
      return {
        success: true,
        user: userInfo.login,
        message: `Connected to GitHub as ${userInfo.login}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get comprehensive user data for search and analysis
  async getComprehensiveData(options = {}) {
    try {
      const {
        includeRepos = true,
        includeGists = true,
        maxRepos = 50,
        maxGists = 20
      } = options;

      const results = {
        user: await this.getUserInfo(),
        repositories: [],
        gists: []
      };

      if (includeRepos) {
        const repos = await this.getRepositories({ per_page: maxRepos });
        results.repositories = repos;
      }

      if (includeGists) {
        const gists = await this.getGists({ per_page: maxGists });
        results.gists = gists;
      }

      return results;
    } catch (error) {
      console.error('Error fetching comprehensive GitHub data:', error);
      throw error;
    }
  }
}

export const githubService = new GitHubService();
export default githubService;
