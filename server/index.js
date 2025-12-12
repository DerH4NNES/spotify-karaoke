const { SpotifyApi } = require("@spotify/web-api-ts-sdk");

const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let sdk;

app.post('/callback', (req, res) => {
    let data = req.body;
    sdk = SpotifyApi.withAccessToken("client-id", data); // SDK now authenticated as client-side user
    res.json({ ok: true });
});

// Server-side exchange endpoint for PKCE authorization code
app.post('/exchange', async (req, res) => {
    try {
        const { code, redirectUri } = req.body;
        const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return res.status(500).json({ error: 'Server not configured with client id/secret' });
        }

        if (!code || !redirectUri) {
            return res.status(400).json({ error: 'Missing code or redirectUri' });
        }

        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', redirectUri);

        const tokenResp = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
            },
            body: params.toString()
        });

        const text = await tokenResp.text();
        if (!tokenResp.ok) {
            return res.status(tokenResp.status).send(text);
        }

        const json = JSON.parse(text);
        // Return the token to the client so it can store it in the SDK cache
        res.json(json);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: String(err) });
    }
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000!')
});