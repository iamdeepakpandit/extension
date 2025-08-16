const axios = require('axios');

class BigBasketService {
  constructor() {
    this.apiKey = process.env.BIGBASKET_API_KEY || 'your_bigbasket_key_here';
  }

  async getPrice(productName) {
    try {
      // BigBasket typically has groceries and household items
      // Check if product might be available on BigBasket
      const groceryKeywords = [
        'rice', 'dal', 'oil', 'flour', 'sugar', 'salt', 'spices', 'tea', 'coffee',
        'milk', 'bread', 'eggs', 'vegetables', 'fruits', 'snacks', 'biscuits',
        'soap', 'shampoo', 'detergent', 'toothpaste', 'tissue', 'cleaning'
      ];

      const isGroceryItem = groceryKeywords.some(keyword => 
        productName.toLowerCase().includes(keyword)
      );

      if (!isGroceryItem) {
        return {
          price: null,
          url: null,
          available: false,
          message: 'Product not available on BigBasket'
        };
      }

      // For now, return dummy data for grocery items
      // TODO: Replace with actual BigBasket API call when API is available
      
      if (!this.apiKey || this.apiKey === 'your_bigbasket_key_here') {
        return this.getDummyData(productName);
      }

      // Real API implementation would go here
      return this.getDummyData(productName);

    } catch (error) {
      console.error('BigBasket API Error:', error.message);
      return {
        price: null,
        url: null,
        available: false,
        error: error.message
      };
    }
  }

  getDummyData(productName) {
    // Generate realistic grocery prices (usually lower than electronics)
    const basePrice = Math.floor(Math.random() * 2000) + 50;
    const variation = Math.floor(Math.random() * 200) - 100;
    const finalPrice = Math.max(basePrice + variation, 25);

    return {
      price: `₹${finalPrice.toLocaleString('en-IN')}`,
      url: `https://bigbasket.com/ps/?q=${encodeURIComponent(productName)}`,
      available: true,
      title: productName,
      platform: 'bigbasket'
    };
  }
}

module.exports = new BigBasketService();