// OAuth Service - Real authentication flows for platform connections
import encryptionService from './encryptionService';

class OAuthService {
  constructor() {
    this.clientConfigs = {
      googleDrive: {
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        redirectUri: 'http://localhost:3000/auth/callback.html',
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
      },
      oneDrive: {
        clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID,
        redirectUri: `${window.location.origin}/auth/callback/microsoft`,
        scope: 'https://graph.microsoft.com/Files.ReadWrite https://graph.microsoft.com/User.Read',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
      },
      dropbox: {
        clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID,
        redirectUri: `${window.location.origin}/auth/callback/dropbox`,
        scope: 'files.content.read files.content.write account_info.read',
        authUrl: 'https://www.dropbox.com/oauth2/authorize'
      },
      github: {
        clientId: process.env.REACT_APP_GITHUB_CLIENT_ID,
        redirectUri: `${window.location.origin}/auth/callback/github`,
        scope: 'repo user:email',
        authUrl: 'https://github.com/login/oauth/authorize'
      },
      slack: {
        clientId: process.env.REACT_APP_SLACK_CLIENT_ID,
        redirectUri: `${window.location.origin}/auth/callback/slack`,
        scope: 'channels:read files:read groups:read im:read mpim:read users:read',
        authUrl: 'https://slack.com/oauth/v2/authorize'
      },
      gmail: {
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        redirectUri: `${window.location.origin}/auth/callback/gmail`,
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
      },
      figma: {
        clientId: process.env.REACT_APP_FIGMA_CLIENT_ID,
        redirectUri: `${window.location.origin}/auth/callback/figma`,
        scope: 'file_read',
        authUrl: 'https://www.figma.com/oauth'
      },
      trello: {
        clientId: process.env.REACT_APP_TRELLO_CLIENT_ID,
        redirectUri: `${window.location.origin}/auth/callback/trello`,
        scope: 'read',
        authUrl: 'https://trello.com/1/authorize'
      }
    };
  }

  // Generate secure state parameter for OAuth flow
  generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Store state securely for verification
  storeState(platformId, state) {
    const stateData = {
      platformId,
      state,
      timestamp: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
    };
    localStorage.setItem(`oauth_state_${platformId}`, JSON.stringify(stateData));
  }

  // Verify state parameter
  verifyState(platformId, receivedState) {
    const storedData = localStorage.getItem(`oauth_state_${platformId}`);
    if (!storedData) return false;

    try {
      const { state, expiresAt } = JSON.parse(storedData);
      if (Date.now() > expiresAt) {
        localStorage.removeItem(`oauth_state_${platformId}`);
        return false;
      }
      return state === receivedState;
    } catch {
      return false;
    }
  }

  // Initiate OAuth flow
  async initiateOAuth(platformId) {
    const config = this.clientConfigs[platformId];
    if (!config) {
      throw new Error(`OAuth configuration not found for platform: ${platformId}`);
    }

    console.log('🔍 Google Client ID check:', {
      clientId: config.clientId,
      hasClientId: !!config.clientId,
      envVar: process.env.REACT_APP_GOOGLE_CLIENT_ID
    });

    if (!config.clientId) {
      console.error(`❌ OAuth Error: Missing Google Client ID`);
      console.error(`📋 To fix this:`);
      console.error(`1. Go to Google Cloud Console: https://console.cloud.google.com/`);
      console.error(`2. Create OAuth 2.0 credentials`);
      console.error(`3. Add redirect URI: http://localhost:3000/auth/callback.html`);
      console.error(`4. Create .env file with: REACT_APP_GOOGLE_CLIENT_ID=your_client_id`);
      throw new Error(`Google OAuth not configured. Check console for setup instructions.`);
    }

    const state = this.generateState();
    this.storeState(platformId, state);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state: state,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent' // Force consent screen
    });

    const authUrl = `${config.authUrl}?${params.toString()}`;
    console.log('🚀 Opening OAuth popup with URL:', authUrl);
    console.log('🔍 Redirect URI being used:', config.redirectUri);
    console.log('🔍 Redirect URI length:', config.redirectUri.length);
    console.log('🔍 Redirect URI bytes:', [...config.redirectUri].map(c => c.charCodeAt(0)));
    
    // Open OAuth flow in popup window
    const popup = window.open(
      authUrl,
      `oauth_${platformId}`,
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );
    
    console.log('🔍 Popup window object:', popup);
    
    if (!popup) {
      throw new Error('Popup was blocked by browser. Please allow popups for this site and try again.');
    }
    
    if (popup.closed) {
      throw new Error('Popup window failed to open. Check if popups are blocked.');
    }

    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('OAuth popup was closed by user'));
        }
      }, 1000);

      // Listen for messages from popup
      const messageHandler = (event) => {
        console.log('Received message from popup:', event.data);
        
        if (event.origin !== window.location.origin) {
          console.warn('Message from wrong origin:', event.origin);
          return;
        }
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          console.log('OAuth success received:', event.data);
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve(event.data);
        } else if (event.data.type === 'OAUTH_ERROR') {
          console.error('OAuth error received:', event.data);
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          const errorMsg = event.data.error_description || event.data.error || 'Unknown OAuth error';
          reject(new Error(errorMsg));
        }
      };

      window.addEventListener('message', messageHandler);
    }).catch(error => {
      console.error('OAuth flow failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    });
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(platformId, code, state) {
    if (!this.verifyState(platformId, state)) {
      throw new Error('Invalid or expired OAuth state');
    }

    const config = this.clientConfigs[platformId];
    const tokenEndpoints = {
      googleDrive: 'https://oauth2.googleapis.com/token',
      oneDrive: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      dropbox: 'https://api.dropboxapi.com/oauth2/token',
      github: 'https://github.com/login/oauth/access_token',
      slack: 'https://slack.com/api/oauth.v2.access',
      gmail: 'https://oauth2.googleapis.com/token',
      figma: 'https://www.figma.com/api/oauth/token',
      trello: 'https://trello.com/1/OAuthGetAccessToken'
    };

    const clientSecretKey = platformId === 'googleDrive' ? 'REACT_APP_GOOGLE_CLIENT_SECRET' : `REACT_APP_${platformId.toUpperCase()}_CLIENT_SECRET`;
    const clientSecret = process.env[clientSecretKey];
    
    if (!clientSecret) {
      throw new Error(`Client secret not configured for ${platformId}. Please set ${clientSecretKey} in your .env file.`);
    }

    const tokenData = {
      client_id: config.clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri
    };

    try {
      const response = await fetch(tokenEndpoints[platformId], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(tokenData)
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      
      // Encrypt and store tokens securely
      const encryptedTokens = encryptionService.encrypt(tokens);
      localStorage.setItem(`tokens_${platformId}`, encryptedTokens);
      
      // Clean up OAuth state
      localStorage.removeItem(`oauth_state_${platformId}`);
      
      return tokens;
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error.message}`);
    }
  }

  // Get stored access token
  async getAccessToken(platformId) {
    const encryptedTokens = localStorage.getItem(`tokens_${platformId}`);
    if (!encryptedTokens) return null;

    try {
      const tokens = encryptionService.decrypt(encryptedTokens);
      
      // Check if token needs refresh
      if (tokens.expires_at && Date.now() > tokens.expires_at) {
        return await this.refreshToken(platformId, tokens.refresh_token);
      }
      
      return tokens.access_token;
    } catch (error) {
      console.error('Failed to decrypt tokens:', error);
      return null;
    }
  }

  // Refresh access token
  async refreshToken(platformId, refreshToken) {
    const config = this.clientConfigs[platformId];
    const refreshEndpoints = {
      googleDrive: 'https://oauth2.googleapis.com/token',
      oneDrive: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      gmail: 'https://oauth2.googleapis.com/token'
    };

    if (!refreshEndpoints[platformId]) {
      throw new Error(`Token refresh not supported for ${platformId}`);
    }

    const refreshData = {
      client_id: config.clientId,
      client_secret: process.env[`REACT_APP_${platformId.toUpperCase()}_CLIENT_SECRET`],
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };

    try {
      const response = await fetch(refreshEndpoints[platformId], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(refreshData)
      });

      const newTokens = await response.json();
      
      // Update stored tokens
      const encryptedTokens = encryptionService.encrypt(newTokens);
      localStorage.setItem(`tokens_${platformId}`, encryptedTokens);
      
      return newTokens.access_token;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Revoke access token and disconnect
  async revokeAccess(platformId) {
    const accessToken = await this.getAccessToken(platformId);
    if (!accessToken) return;

    const revokeEndpoints = {
      googleDrive: `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      gmail: `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      github: 'https://api.github.com/applications/{client_id}/token',
      slack: 'https://slack.com/api/auth.revoke'
    };

    try {
      if (revokeEndpoints[platformId]) {
        await fetch(revokeEndpoints[platformId], { method: 'POST' });
      }
    } catch (error) {
      console.warn(`Failed to revoke token for ${platformId}:`, error);
    } finally {
      // Always remove local tokens
      localStorage.removeItem(`tokens_${platformId}`);
    }
  }

  // Test API connection
  async testConnection(platformId) {
    const accessToken = await this.getAccessToken(platformId);
    if (!accessToken) return false;

    const testEndpoints = {
      googleDrive: 'https://www.googleapis.com/drive/v3/about?fields=user',
      oneDrive: 'https://graph.microsoft.com/v1.0/me',
      dropbox: 'https://api.dropboxapi.com/2/users/get_current_account',
      github: 'https://api.github.com/user',
      slack: 'https://slack.com/api/auth.test',
      gmail: 'https://www.googleapis.com/gmail/v1/users/me/profile',
      figma: 'https://api.figma.com/v1/me'
    };

    try {
      const response = await fetch(testEndpoints[platformId], {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new OAuthService();
