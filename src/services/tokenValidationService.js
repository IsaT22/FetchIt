// Token Validation Service - Checks OAuth token expiration and refresh
import encryptionService from './encryptionService';

class TokenValidationService {
  constructor() {
    this.refreshInProgress = new Map();
  }

  // Check if Google Drive tokens are valid and not expired
  async validateGoogleDriveTokens() {
    try {
      const encryptedTokens = localStorage.getItem('tokens_googleDrive');
      if (!encryptedTokens) {
        return { valid: false, reason: 'No tokens found' };
      }

      const tokens = encryptionService.decrypt(encryptedTokens);
      if (!tokens || !tokens.access_token) {
        return { valid: false, reason: 'Invalid token format' };
      }

      // Check if token is expired (if we have expiry info)
      if (tokens.expires_at) {
        const now = Date.now();
        const expiresAt = new Date(tokens.expires_at).getTime();
        
        if (now >= expiresAt) {
          console.log('Google Drive token expired, attempting refresh...');
          return await this.refreshGoogleDriveToken(tokens);
        }
      }

      // Test token by making a simple API call
      const testResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (testResponse.ok) {
        const userData = await testResponse.json();
        return { 
          valid: true, 
          user: userData.user,
          tokens: tokens
        };
      } else if (testResponse.status === 401) {
        console.log('Google Drive token invalid, attempting refresh...');
        return await this.refreshGoogleDriveToken(tokens);
      } else {
        return { valid: false, reason: `API error: ${testResponse.status}` };
      }

    } catch (error) {
      console.error('Error validating Google Drive tokens:', error);
      return { valid: false, reason: error.message };
    }
  }

  // Refresh Google Drive access token using refresh token
  async refreshGoogleDriveToken(tokens) {
    if (!tokens.refresh_token) {
      return { valid: false, reason: 'No refresh token available' };
    }

    // Prevent multiple simultaneous refresh attempts
    if (this.refreshInProgress.has('googleDrive')) {
      await this.refreshInProgress.get('googleDrive');
      return await this.validateGoogleDriveTokens();
    }

    const refreshPromise = this.performTokenRefresh(tokens);
    this.refreshInProgress.set('googleDrive', refreshPromise);

    try {
      const result = await refreshPromise;
      return result;
    } finally {
      this.refreshInProgress.delete('googleDrive');
    }
  }

  // Perform the actual token refresh
  async performTokenRefresh(tokens) {
    try {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return { valid: false, reason: 'OAuth credentials not configured' };
      }

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        console.error('Token refresh failed:', errorData);
        return { valid: false, reason: 'Token refresh failed' };
      }

      const refreshData = await refreshResponse.json();
      
      // Update tokens with new access token
      const updatedTokens = {
        ...tokens,
        access_token: refreshData.access_token,
        expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString()
      };

      // If we got a new refresh token, use it
      if (refreshData.refresh_token) {
        updatedTokens.refresh_token = refreshData.refresh_token;
      }

      // Store updated tokens
      const encryptedTokens = encryptionService.encrypt(updatedTokens);
      localStorage.setItem('tokens_googleDrive', encryptedTokens);

      console.log('Google Drive tokens refreshed successfully');
      return { valid: true, tokens: updatedTokens };

    } catch (error) {
      console.error('Error refreshing Google Drive token:', error);
      return { valid: false, reason: error.message };
    }
  }

  // Check connection status for all platforms
  async checkAllConnections() {
    const connections = {
      googleDrive: await this.validateGoogleDriveTokens(),
      // Add other platforms here as needed
    };

    return connections;
  }

  // Get user info from valid tokens
  async getUserInfo(platform = 'googleDrive') {
    if (platform === 'googleDrive') {
      const validation = await this.validateGoogleDriveTokens();
      return validation.valid ? validation.user : null;
    }
    
    return null;
  }

  // Clear invalid tokens
  clearTokens(platform = 'googleDrive') {
    localStorage.removeItem(`tokens_${platform}`);
    console.log(`Cleared ${platform} tokens`);
  }

  // Validate and refresh token (compatibility method for driveService)
  async validateAndRefreshToken() {
    return await this.validateGoogleDriveTokens();
  }
}

// Create singleton instance
const tokenValidationService = new TokenValidationService();
export default tokenValidationService;
