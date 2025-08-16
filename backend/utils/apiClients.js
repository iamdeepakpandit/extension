
const axios = require('axios');

// Create configured axios instances for different services
const createApiClient = (baseURL, timeout = 10000) => {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Price-Checker-Extension/1.0'
    }
  });
};

// API clients for different platforms
const apiClients = {
  amazon: createApiClient('https://api.amazon.com'),
  flipkart: createApiClient('https://api.flipkart.com'),
  bigbasket: createApiClient('https://api.bigbasket.com')
};

// Response interceptors for error handling
Object.values(apiClients).forEach(client => {
  client.interceptors.response.use(
    response => response,
    error => {
      console.error('API Error:', error.message);
      return Promise.reject(error);
    }
  );
});

module.exports = apiClients;
