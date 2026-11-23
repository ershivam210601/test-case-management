const axios = require('axios');

// Render's service-to-service env vars (fromService: hostport) come back as
// "host:port" with no scheme, unlike the "http://host:port" used locally.
const rawUrl = process.env.DB_SERVICE_URL || '';
const baseURL = /^https?:\/\//.test(rawUrl) ? rawUrl : `http://${rawUrl}`;

const dbClient = axios.create({
  baseURL,
  headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY },
});

module.exports = dbClient;
