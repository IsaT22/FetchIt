// Netlify function to handle GitHub OAuth token exchange
// This avoids CORS issues and code expiration problems

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const tokenData = JSON.parse(event.body);
    
    // Make request to GitHub token endpoint
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
      return {
        statusCode: response.status,
        body: responseText
      };
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(tokens)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
