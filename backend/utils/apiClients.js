const axios = require('axios');

// Create configured axios instances for different APIs
const createApiClient = (baseURL, defaultHeaders = {}) => {
  return axios.create({
    baseURL,
    timeout: 10000, // 10 seconds timeout
    headers: {
      'Content-Type': 'application/json',
      ...defaultHeaders
    }
  });
};

// Amazon API client (via RapidAPI)
const amazonClient = createApiClient('https://amazon-products1.p.rapidapi.com', {
  'X-RapidAPI-Key': process.env.AMAZON_API_KEY,
  'X-RapidAPI-Host': process.env.AMAZON_API_HOST
});

// Flipkart API client
const flipkartClient = createApiClient('https://affiliate-api.flipkart.net/affiliate/1.0', {
  'Fk-Affiliate-Id': process.env.FLIPKART_AFFILIATE_ID,
  'Fk-Affiliate-Token': process.env.FLIPKART_API_TOKEN
});

// BigBasket API client (when available)
const bigbasketClient = createApiClient('https://api.bigbasket.com', {
  'Authorization': `Bearer ${process.env.BIGBASKET_API_KEY}`
});

// Add request/response interceptors for logging
const addInterceptors = (client, serviceName) => {
  client.interceptors.request.use(
    (config) => {
      console.log(`📤 ${serviceName} API Request:`, {
        url: config.url,
        method: config.method,
        params: config.params
      });
      return config;
    },
    (error) => {
      console.error(`❌ ${serviceName} Request Error:`, error.message);
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response) => {
      console.log(`📥 ${serviceName} API Response:`, {
        status: response.status,
        dataLength: JSON.stringify(response.data).length
      });
      return response;
    },
    (error) => {
      console.error(`❌ ${serviceName} Response Error:`, {
        status: error.response?.status,
        message: error.message
      });
      return Promise.reject(error);
    }
  );
};

// Add interceptors to all clients
addInterceptors(amazonClient, 'Amazon');
addInterceptors(flipkartClient, 'Flipkart');
addInterceptors(bigbasketClient, 'BigBasket');

module.exports = {
  amazonClient,
  flipkartClient,
  bigbasketClient
};