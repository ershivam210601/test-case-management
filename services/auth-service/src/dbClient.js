const axios = require('axios');

const dbClient = axios.create({
  baseURL: process.env.DB_SERVICE_URL,
  headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY },
});

module.exports = dbClient;
