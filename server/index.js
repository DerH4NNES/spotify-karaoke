const { SpotifyApi } = require("@spotify/web-api-ts-sdk");

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let sdk;

app.post('/callback', (req, res) => {
    let data = req.body;
    sdk = SpotifyApi.withAccessToken("client-id", data); // SDK now authenticated as client-side user
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000!')
});