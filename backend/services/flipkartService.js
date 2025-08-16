const axios = require('axios');

class FlipkartService {
  constructor() {
    this.affiliateId = process.env.FLIPKART_AFFILIATE_ID || 'your_affiliate_id_here';
    this.apiToken = process.env.FLIPKART_API_TOKEN || 'your_api_token_here';
  }

  async getPrice(productName) {
    try {
      // For now, return dummy data
      // TODO: Replace with actual Flipkart API call when credentials are configured
      
      if (!this.affiliateId || this.affiliateId === 'your_affiliate_id_here') {
        return this.getDummyData(productName);
      }

      // Real API implementation (commented out for now)
      /*
      const options = {
        method: 'GET',
        url: 'https://affiliate-api.flipkart.net/affiliate/1.0/search.json',
        params: {
          query: productName,
          resultCount: 1
        },
        headers: {
          'Fk-Affiliate-Id': this.affiliateId,
          'Fk-Affiliate-Token': this.apiToken
        }
      };

      const response = await axios.request(options);
      const product = response.data.products[0];

      if (product) {
        return {
          price: product.productBaseInfoV1.flipkartSellingPrice.amount,
          url: product.productBaseInfoV1.productUrl,
          available: true,
          title: product.productBaseInfoV1.title
        };
      }
      */

      return this.getDummyData(productName);

    } catch (error) {
      console.error('Flipkart API Error:', error.message);
      return {
        price: null,
        url: null,
        available: false,
        error: error.message
      };
    }
  }

  getDummyData(productName) {
    // Generate realistic dummy prices (usually slightly different from Amazon)
    const basePrice = Math.floor(Math.random() * 48000) + 1200;
    const variation = Math.floor(Math.random() * 1500) - 750;
    const finalPrice = Math.max(basePrice + variation, 600);

    return {
      price: `₹${finalPrice.toLocaleString('en-IN')}`,
      url: `https://flipkart.com/search?q=${encodeURIComponent(productName)}`,
      available: true,
      title: productName,
      platform: 'flipkart'
    };
  }
}

module.exports = new FlipkartService();