// server.js - Simple Spotify token proxy server
import express from "express";
import fetch from "node-fetch";
import b64 from "base-64";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Your Spotify credentials (set these as environment variables)
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'e624f9886d144dd8a530550a812d49d3';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '5adc9b7f280f4a90abfc85a39a2520d1';

let appToken = null; // { access_token, expires_at }

async function getAppToken() {
  const now = Date.now();
  // Refresh token 1 minute before expiry
  if (appToken && now < appToken.expires_at - 60_000) {
    return appToken.access_token;
  }

  console.log('Refreshing Spotify app token...');
  
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + b64.encode(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ 
        grant_type: "client_credentials" 
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Spotify token error: ${data.error_description}`);
    }
    
    appToken = { 
      access_token: data.access_token, 
      expires_at: Date.now() + data.expires_in * 1000 
    };
    
    console.log('✅ New Spotify token obtained');
    return appToken.access_token;
  } catch (error) {
    console.error('❌ Failed to get Spotify token:', error);
    throw error;
  }
}

// Auto-generating token system for public data
let userAccessToken = null; // For personal data (optional)

// Proxy endpoint for top tracks
app.get("/api/top-tracks", async (req, res) => {
  try {
    // Try user token first (for personal data)
    if (userAccessToken) {
      const timeRange = req.query.time_range || 'short_term';
      const limit = req.query.limit || '5';
      
      const response = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
        {
          headers: { 
            Authorization: `Bearer ${userAccessToken}` 
          }
        }
      );
      
      if (response.status === 401) {
        // Token expired, try app token for public data
        console.log('User token expired, falling back to public data...');
      } else {
        const data = await response.json();
        return res.status(response.status).json(data);
      }
    }
    
    // Fallback: Use app token for public data (popular tracks)
    const token = await getAppToken();
    const limit = req.query.limit || '5';
    
    // Get popular tracks instead of personal top tracks
    const response = await fetch(
      `https://api.spotify.com/v1/browse/new-releases?limit=${limit}`,
      {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      // Transform the data to match expected format
      const tracks = data.albums?.items?.map(album => ({
        name: album.name,
        artist: album.artists.map(artist => artist.name).join(', '),
        uri: album.uri,
        album: album.name,
        image: album.images[0]?.url
      })) || [];
      
      return res.json({ items: tracks });
    }
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: "server_error", 
      message: error.message 
    });
  }
});

// Endpoint to set user access token
app.post("/api/set-token", (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "token_required" });
  }
  
  userAccessToken = token;
  console.log('✅ User access token updated');
  res.json({ message: "Token updated successfully" });
});

// Simple token input endpoint (no OAuth setup required)
app.get("/api/auth/spotify", (req, res) => {
  res.json({ 
    authUrl: "https://developer.spotify.com/console/get-current-user-top-artists-and-tracks/",
    message: "Get your token from Spotify Console, then use the 'Set Token' button below",
    instructions: [
      "1. Click the Spotify Console link above",
      "2. Click 'Get Token' and authorize",
      "3. Copy the token and use it below"
    ]
  });
});

app.get("/callback", async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: "No authorization code received" });
  }
  
  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + b64.encode(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://localhost:8888/callback'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.access_token) {
      userAccessToken = tokenData.access_token;
      console.log('✅ Personal access token obtained via OAuth');
      
      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>✅ Spotify Authorization Successful!</h2>
            <p>Your personal Spotify data is now connected.</p>
            <p>You can close this window and return to your portfolio.</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </body>
        </html>
      `);
    } else {
      throw new Error('Failed to get access token');
    }
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('Authorization failed. Please try again.');
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    token_expires: appToken ? new Date(appToken.expires_at).toISOString() : "no_token" 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Spotify proxy server running on port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET /api/top-tracks?time_range=short_term&limit=5`);
  console.log(`   GET /api/health`);
});

export default app;
