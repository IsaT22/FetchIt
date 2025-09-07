// Simple Express server for OAuth endpoints on Render
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// GitHub OAuth endpoint
app.post('/api/oauth/github', async (req, res) => {
  try {
    const { client_id, code, grant_type, redirect_uri, client_secret } = req.body;
    
    const tokenData = {
      client_id,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      grant_type,
      redirect_uri
    };

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'FetchIt-AI-Assistant'
      },
      body: new URLSearchParams(tokenData)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      return res.status(response.status).send(responseText);
    }

    // Try to parse as JSON, fallback to URL-encoded
    let tokens;
    try {
      tokens = JSON.parse(responseText);
    } catch (jsonError) {
      if (responseText.includes('=')) {
        const params = new URLSearchParams(responseText);
        tokens = {};
        for (const [key, value] of params) {
          tokens[key] = value;
        }
      } else {
        throw new Error(`Invalid response format: ${responseText}`);
      }
    }

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`OAuth server running on port ${PORT}`);
});
