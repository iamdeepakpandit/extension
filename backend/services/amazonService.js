const axios = require('axios');

class AmazonService {
  constructor() {
    this.apiKey = process.env.AMAZON_API_KEY || 'your_rapidapi_key_here';
    this.apiHost = process.env.AMAZON_API_HOST || 'amazon-products1.p.rapidapi.com';
  }

  async getPrice(productName) {
    try {
      // For now, return dummy data
      // TODO: Replace with actual Amazon API call when API key is configured
      
      if (!this.apiKey || this.apiKey === 'your_rapidapi_key_here') {
        return this.getDummyData(productName);
      }

      // Real API implementation (commented out for now)
      /*
      const options = {
        method: 'GET',
        url: `https://${this.apiHost}/search`,
        params: {
          query: productName,
          country: 'IN'
        },
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.apiHost
        }
      };

      const response = await axios.request(options);
      const product = response.data.results[0];

      if (product) {
        return {
          price: product.price,
          url: product.url,
          available: true,
          title: product.title
        };
      }
      */

      return this.getDummyData(productName);

    } catch (error) {
      console.error('Amazon API Error:', error.message);
      return {
        price: null,
        url: null,
        available: false,
        error: error.message
      };
    }
  }

  getDummyData(productName) {
    // Validate input
    if (!productName || typeof productName !== 'string') {
      return {
        price: null,
        url: null,
        available: false,
        error: 'Invalid product name'
      };
    }

    // Generate realistic dummy prices based on product name
    const basePrice = Math.floor(Math.random() * 50000) + 1000;
    const variation = Math.floor(Math.random() * 2000) - 1000;
    const finalPrice = Math.max(basePrice + variation, 500);

    return {
      price: `₹${finalPrice.toLocaleString('en-IN')}`,
      url: `https://amazon.in/s?k=${encodeURIComponent(productName)}`,
      available: true,
      title: productName,
      platform: 'amazon'
    };
  }
}

module.exports = new AmazonService();