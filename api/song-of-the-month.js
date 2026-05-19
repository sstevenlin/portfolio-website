import fetch from 'node-fetch';
import b64 from 'base-64';

let appToken = null;

async function getAppToken() {
  const now = Date.now();
  if (appToken && now < appToken.expires_at - 60_000) {
    return appToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + b64.encode(`${clientId}:${clientSecret}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  appToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return appToken.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const token = await getAppToken();
    const searchUrl = new URL('https://api.spotify.com/v1/search');
    searchUrl.searchParams.set('q', 'track:"One of These Nights" artist:Eagles');
    searchUrl.searchParams.set('type', 'track');
    searchUrl.searchParams.set('limit', '15');

    const response = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const tracks = data.tracks?.items || [];
    const track =
      tracks.find((t) => /remaster/i.test(t.name) && /2013/i.test(t.name)) ||
      tracks.find((t) => /remaster/i.test(t.name)) ||
      tracks.find((t) => t.name.toLowerCase().includes('one of these nights')) ||
      tracks[0];

    if (!track) {
      return res.status(404).json({ error: 'track_not_found' });
    }

    const artist = track.artists.map((a) => a.name).join(', ');

    return res.status(200).json({
      name: track.name,
      artist,
      displayTitle: `${track.name} by ${artist}`,
      preview_url: track.preview_url,
      spotify_url: track.external_urls?.spotify,
      spotify_uri: track.uri,
      image: track.album?.images?.[0]?.url,
    });
  } catch (error) {
    console.error('song-of-the-month error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: error.message,
    });
  }
}
