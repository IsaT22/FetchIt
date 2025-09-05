# OAuth Setup Guide for FetchIt

This guide explains how to set up real OAuth authentication for platform connections in FetchIt.

## Overview

The app is currently configured for `http://localhost:3000/auth/callback`. You MUST configure your Google OAuth app with this exact redirect URI.

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API and Gmail API

### 2. Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: FetchIt
   - User support email: your email
   - Developer contact: your email

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. **CRITICAL**: Add these EXACT authorized redirect URIs:
   - `http://localhost:3001/auth/callback` (primary - your app runs on port 3001)
   - `http://localhost:3000/auth/callback` (backup port)
   - `http://127.0.0.1:3001/auth/callback`

### 4. Add Environment Variables
Create a `.env` file in the project root with:
```
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

## 🔧 Current Configuration

The app is hardcoded to use:
- **Redirect URI**: `http://localhost:3000/auth/callback`
- **Callback Handler**: `/public/auth/callback/index.html`

## ✅ Quick Fix Steps

1. **Go to Google Cloud Console** → Your Project → APIs & Services → Credentials
2. **Edit your OAuth 2.0 Client ID**
3. **Add to Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   ```
4. **Save changes**
5. **Add your Client ID to `.env`**:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_actual_client_id_here
   ```
6. **Restart the app**: `npm start`

## 🚀 For Production Deployment

When deploying to production, you'll need to:
1. Add your production domain to authorized redirect URIs
2. Update the OAuth service to use production URLs
3. Configure proper HTTPS certificates

## Microsoft OneDrive Setup

### 1. Register App in Azure
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Set redirect URI: `http://localhost:3000/auth/callback/microsoft`

### 2. Configure API Permissions
Add these Microsoft Graph permissions:
- Files.ReadWrite
- User.Read

### 3. Add Environment Variables
```
REACT_APP_MICROSOFT_CLIENT_ID=your_client_id_here
REACT_APP_MICROSOFT_CLIENT_SECRET=your_client_secret_here
```

## Dropbox Setup

### 1. Create Dropbox App
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create new app with full Dropbox access
3. Set redirect URI: `http://localhost:3000/auth/callback/dropbox`

### 2. Add Environment Variables
```
REACT_APP_DROPBOX_CLIENT_ID=your_app_key_here
REACT_APP_DROPBOX_CLIENT_SECRET=your_app_secret_here
```

## Testing OAuth Setup

1. Copy `.env.example` to `.env`
2. Add your client IDs and secrets
3. Start the development server: `npm start`
4. Go to Connections and test each platform

## Troubleshooting

### Common Issues
- **redirect_uri_mismatch**: Ensure redirect URIs match exactly in your OAuth app settings
- **invalid_client**: Check that client ID is correct and app is published
- **access_denied**: User declined permissions or app needs verification

### Security Notes
- Never commit `.env` file to version control
- Use HTTPS in production
- Regularly rotate client secrets
- Implement proper token refresh logic

### State Verification
- CSRF protection using secure random state parameters
- State verification on OAuth callback
- 10-minute expiration for OAuth states

### Popup-based Flow
- OAuth flows open in secure popup windows
- No redirect of main application
- Automatic popup closure after auth

## Privacy & Legal Compliance

### Data Handling
- All authentication uses industry-standard OAuth 2.0
- No credentials stored by FetchIt application
- Users can revoke access anytime through platform settings
- Local data encryption with user-controlled keys

### Permissions Disclosure
Each platform shows detailed permissions including:
- Exact data access scope
- Data retention policies
- Third-party sharing policies
- Security notices

### Terms Compliance
- Users must agree to platform-specific terms
- Clear disclosure of data usage
- Revocation instructions provided
- Privacy policy compliance

## Testing Connections

The OAuth service includes connection testing:
- Validates tokens after authentication
- Tests API connectivity
- Provides clear error messages
- Automatic token refresh when needed

## Error Handling

Comprehensive error handling for:
- Network failures
- Invalid credentials
- Expired tokens
- User cancellation
- Platform-specific errors

## Development vs Production

### Development
- Use localhost redirect URIs
- Test with development credentials
- Enable detailed logging

### Production
- Use HTTPS redirect URIs
- Production OAuth credentials
- Disable debug logging
- Monitor token usage

## Supported Platforms

Currently implemented OAuth flows:
- ✅ Google Drive
- ✅ Microsoft OneDrive
- ✅ Dropbox
- ✅ GitHub
- ✅ Slack
- ✅ Gmail
- ✅ Figma
- ✅ Trello

API Key authentication:
- ✅ Notion

Local path authentication:
- ✅ Obsidian
- ✅ Local Files

## Next Steps

1. Set up OAuth credentials for desired platforms
2. Test authentication flows in development
3. Configure production redirect URIs
4. Deploy with proper environment variables
5. Monitor connection success rates

For issues or questions, check the OAuth service logs and platform-specific documentation.
