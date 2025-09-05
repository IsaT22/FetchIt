# 🔧 Google Drive OAuth Setup - Quick Fix

## Step 1: Create Google Cloud Project & OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: Create new project or select existing
3. **Enable APIs**:
   - Go to "APIs & Services" → "Library"
   - Enable "Google Drive API"
   - Enable "Google Picker API" (optional but recommended)

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose **External** user type
3. Fill required fields:
   - **App name**: FetchIt AI Assistant
   - **User support email**: your email
   - **Developer contact**: your email
4. **Add scopes**:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/userinfo.email`

## Step 3: Create OAuth 2.0 Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. Choose **"Web application"**
4. **CRITICAL - Add this EXACT redirect URI**:
   ```
   http://localhost:3000/auth/callback.html
   ```
5. **Click "Create"**
6. **Copy both Client ID and Client Secret** from the popup

## Step 4: Add to Your .env File

1. **Open your .env file** in the FetchIt project
2. **Add these lines** (replace with your actual credentials):
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
   REACT_APP_GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
   ```

## Step 5: Restart the App

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

## ✅ Test the Connection

1. Open the app at http://localhost:3000
2. Click the sidebar menu → **Connections**
3. Click **"Connect Google Drive"**
4. You should see a Google OAuth popup

## 🚨 Common Issues & Solutions

**"redirect_uri_mismatch" error**:
- Make sure you added `http://localhost:3000/auth/callback` EXACTLY as shown
- No trailing slash, no extra characters

**"invalid_client" error**:
- Double-check your Client ID in the .env file
- Make sure there are no extra spaces or quotes

**Popup blocked**:
- Allow popups for localhost:3000 in your browser
- Try using Chrome or Firefox

**Still not working?**:
- Check browser console for errors
- Verify the .env file is in the project root
- Restart the development server after adding environment variables

---

**Need the Client ID?** I can walk you through getting it from Google Cloud Console step by step.
