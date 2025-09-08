// OAuth Service - Real authentication flows for platform connections
import encryptionService from './encryptionService';

class OAuthService {
  constructor() {
    this.clientConfigs = {
      googleDrive: {
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/auth/callback/index.html`,
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
      gmail: {
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/auth/callback/gmail`,
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
      },
      notion: {
        clientId: process.env.REACT_APP_NOTION_CLIENT_ID,
        clientSecret: process.env.REACT_APP_NOTION_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/auth/callback/index.html`,
        scope: '',
        authUrl: 'https://api.notion.com/v1/oauth/authorize'
      },
      github: {
        clientId: process.env.REACT_APP_GITHUB_CLIENT_ID,
        clientSecret: process.env.REACT_APP_GITHUB_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/auth/callback/index.html`,
        scope: 'repo user',
        authUrl: 'https://github.com/login/oauth/authorize'
      },
      canva: {
        clientId: process.env.REACT_APP_CANVA_CLIENT_ID,
        clientSecret: process.env.REACT_APP_CANVA_CLIENT_SECRET,
        appId: process.env.REACT_APP_CANVA_APP_ID,
        appOrigin: process.env.REACT_APP_CANVA_APP_ORIGIN,
        redirectUri: `${window.location.origin}/auth/callback/index.html`,
        scope: 'design:read design:content:read',
        authUrl: 'https://www.canva.com/api/oauth/authorize'
      },
      notion: {
        clientId: process.env.REACT_APP_NOTION_CLIENT_ID,
        clientSecret: process.env.REACT_APP_NOTION_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/auth/callback/index.html`,
        scope: 'read',
        authUrl: 'https://api.notion.com/v1/oauth/authorize'
      }
    };
  }

  // Generate secure state parameter for OAuth flow
  generateState(platformId) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const randomString = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${platformId}_${randomString}`;
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

  // Generate PKCE code verifier and challenge
  generatePKCE() {
    // Generate code verifier (43-128 characters)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, 43);
    
    // Generate code challenge (SHA256 hash of verifier)
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      const codeChallenge = btoa(String.fromCharCode.apply(null, new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      return { codeVerifier, codeChallenge };
    });
  }

  // Initiate OAuth flow
  async initiateOAuth(platformId) {
    const config = this.clientConfigs[platformId];
    if (!config) {
      throw new Error(`OAuth configuration not found for platform: ${platformId}`);
    }

    if (!config.clientId) {
      const platformName = platformId.charAt(0).toUpperCase() + platformId.slice(1);
      console.error(`❌ OAuth Error: Missing ${platformName} Client ID`);
      console.error(`📋 To fix this:`);
      console.error(`1. Configure OAuth credentials for ${platformName}`);
      console.error(`2. Add redirect URI: ${config.redirectUri}`);
      console.error(`3. Add to .env file: REACT_APP_${platformId.toUpperCase()}_CLIENT_ID=your_client_id`);
      throw new Error(`${platformName} OAuth not configured. Check console for setup instructions.`);
    }

    const state = this.generateState(platformId);
    this.storeState(platformId, state);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state: state
    });

    // Add PKCE parameters for Canva BEFORE setting other parameters
    if (config.usePKCE && platformId === 'canva') {
      console.log('🔐 Generating PKCE parameters for Canva...');
      const pkce = await this.generatePKCE();
      // Store code verifier for later use
      localStorage.setItem(`pkce_verifier_${platformId}`, pkce.codeVerifier);
      params.set('code_challenge', pkce.codeChallenge);
      params.set('code_challenge_method', 'S256');
      console.log('✅ PKCE parameters added:', {
        code_challenge: pkce.codeChallenge.substring(0, 10) + '...',
        code_challenge_method: 'S256'
      });
    }

    // Add platform-specific parameters
    if (platformId === 'googleDrive' || platformId === 'gmail') {
      params.set('access_type', 'offline');
      params.set('prompt', 'consent');
    } else if (platformId === 'notion') {
      params.set('owner', 'user');
    } else if (platformId === 'github') {
      params.set('allow_signup', 'true');
    } else if (platformId === 'canva') {
      // Remove response_mode as it's not needed with PKCE
      console.log('🎨 Canva OAuth parameters configured');
    }

    const authUrl = `${config.authUrl}?${params.toString()}`;
    
    console.log(`🔗 Opening OAuth popup for ${platformId}:`, authUrl);
    
    // Open OAuth flow in popup window with immediate focus
    const popup = window.open(
      authUrl,
      `oauth_${platformId}`,
      'width=600,height=700,scrollbars=yes,resizable=yes,location=yes,status=yes'
    );
    
    // Ensure popup has focus to prevent blocking
    if (popup) {
      popup.focus();
    }

    if (!popup) {
      throw new Error('Popup blocked by browser. Please allow popups for this site and try again.');
    }

    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('OAuth popup was closed by user'));
        }
      }, 1000);

      // Listen for messages from the popup (OAuth callback)
      const messageHandler = (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          
          console.log(`🚀 Processing OAuth success for ${platformId} immediately...`);
          
          // Process the authorization code immediately to prevent expiration
          // Use setTimeout to ensure popup closes first, then process immediately
          setTimeout(() => {
            this.exchangeCodeForToken(platformId, event.data.code, event.data.state)
              .then(tokens => {
                // Return the tokens directly for immediate use
                resolve(tokens);
              })
              .catch(reject);
          }, 100);
        } else if (event.data.type === 'OAUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          reject(new Error(event.data.error || 'OAuth authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);
    }).catch(error => {
      console.warn('OAuth flow failed:', error.message);
      throw error;
    });
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(platformId, code, state) {
    if (!this.verifyState(platformId, state)) {
      throw new Error('Invalid or expired OAuth state');
    }

    const config = this.clientConfigs[platformId];
    if (!config) {
      throw new Error(`OAuth configuration not found for platform: ${platformId}`);
    }
    const tokenEndpoints = {
      googleDrive: 'https://oauth2.googleapis.com/token',
      oneDrive: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      dropbox: 'https://api.dropboxapi.com/oauth2/token',
      gmail: 'https://oauth2.googleapis.com/token',
      notion: 'https://api.notion.com/v1/oauth/token',
      github: 'https://github.com/login/oauth/access_token',
      canva: 'https://api.canva.com/rest/v1/oauth/token'
    };

    const clientSecretKey = platformId === 'googleDrive' ? 'REACT_APP_GOOGLE_CLIENT_SECRET' : `REACT_APP_${platformId.toUpperCase()}_CLIENT_SECRET`;
    const clientSecret = process.env[clientSecretKey];
    
    // Debug: Log all environment variables for troubleshooting
    console.log('🔍 Environment variables debug:', {
      platformId,
      clientSecretKey,
      envValue: process.env[clientSecretKey] ? 'SET' : 'NOT_SET',
      allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')),
      googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
      googleClientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT_SET'
    });

    // For Notion, we'll handle OAuth without client secret (PKCE flow)
    // Google Drive, GitHub and Canva require client secret for token exchange
    if (!clientSecret && platformId !== 'notion') {
      console.error(`Missing client secret for ${platformId}:`, {
        platformId,
        clientSecretKey,
        envValue: process.env[clientSecretKey] ? 'SET' : 'NOT_SET'
      });
      throw new Error(`Client secret not configured for ${platformId}. Please set ${clientSecretKey} in your .env file.`);
    }

    const tokenData = {
      client_id: config.clientId,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri
    };

    // Add client secret for platforms that require it
    if (clientSecret) {
      tokenData.client_secret = clientSecret;
    }

    try {
      let response;
      
      if (platformId === 'github') {
        // GitHub token exchange - use server-side proxy to avoid CORS and timing issues
        console.log('Attempting GitHub token exchange via server proxy...');
        console.log('Token data:', { ...tokenData, client_secret: '[HIDDEN]' });
        
        // Use Netlify function for GitHub OAuth to avoid CORS and timing issues
        try {
          response = await fetch('/.netlify/functions/github-oauth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(tokenData)
          });
          
          console.log('GitHub function response status:', response.status);
        } catch (functionError) {
          console.log('Netlify function failed, trying direct approach...');
          
          // Fallback to direct request with immediate processing
          response = await fetch(tokenEndpoints[platformId], {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'FetchIt-AI-Assistant'
            },
            body: new URLSearchParams(tokenData)
          });
        }
      } else if (platformId === 'canva') {
        // Canva token exchange with PKCE
        console.log('Attempting Canva token exchange with PKCE...');
        
        // Get stored code verifier
        const codeVerifier = localStorage.getItem(`pkce_verifier_${platformId}`);
        if (!codeVerifier) {
          throw new Error('PKCE code verifier not found for Canva OAuth');
        }
        
        // Add code verifier to token data (replace client_secret with code_verifier for PKCE)
        const canvaTokenData = {
          client_id: config.clientId,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: config.redirectUri,
          code_verifier: codeVerifier
        };
        
        console.log('Canva token data:', { ...canvaTokenData, code_verifier: '[HIDDEN]' });
        
        response = await fetch(tokenEndpoints[platformId], {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: new URLSearchParams(canvaTokenData)
        });
      } else if (platformId === 'notion') {
        // Notion token exchange with special handling
        console.log('Attempting Notion token exchange...');
        
        response = await fetch(tokenEndpoints[platformId], {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${config.clientId}:${clientSecret}`)}`
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: config.redirectUri
          })
        });
      } else {
        // Standard OAuth flow for other platforms
        response = await fetch(tokenEndpoints[platformId], {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams(tokenData)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`${platformId} token exchange failed:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log(`${platformId} response:`, responseText.substring(0, 200));
      
      let tokens;
      try {
        // Try parsing as JSON first
        tokens = JSON.parse(responseText);
      } catch (jsonError) {
        // If JSON parsing fails, try parsing as URL-encoded
        if (responseText.includes('=')) {
          const params = new URLSearchParams(responseText);
          tokens = {};
          for (const [key, value] of params) {
            tokens[key] = value;
          }
          
          // Check for GitHub error responses
          if (tokens.error) {
            throw new Error(`GitHub OAuth error: ${tokens.error} - ${tokens.error_description || 'Unknown error'}`);
          }
        } else {
          throw new Error(`Invalid response format: ${responseText.substring(0, 100)}`);
        }
      }
      
      // Encrypt and store tokens securely
      const encryptedTokens = encryptionService.encrypt(tokens);
      localStorage.setItem(`tokens_${platformId}`, encryptedTokens);
      
      // For GitHub, also store in the expected location for githubService
      if (platformId === 'github' && tokens.access_token) {
        const encryptedAccessToken = await encryptionService.encrypt(tokens.access_token);
        localStorage.setItem('github_access_token', encryptedAccessToken);
        console.log('✅ GitHub access token stored for githubService compatibility');
      }
      
      // Store in connection-based storage for multi-platform service
      encryptionService.storeCredentials(platformId, {
        connected: true,
        tokens: tokens,
        connectedAt: new Date().toISOString()
      });
      
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

const oauthService = new OAuthService();
export default oauthService;
