
const express = require('express');
const amazonService = require('../services/amazonService');
const flipkartService = require('../services/flipkartService');
const bigbasketService = require('../services/bigbasketService');

const router = express.Router();

// POST /api/prices - Compare prices across platforms
router.post('/', async (req, res) => {
  try {
    const { productName, currentPrice, platform } = req.body;

    if (!productName) {
      return res.status(400).json({
        error: 'Product name is required'
      });
    }

    console.log(`Price comparison request for: ${productName}`);

    // Search all platforms concurrently
    const searchPromises = [
      amazonService.searchProduct(productName),
      flipkartService.searchProduct(productName),
      bigbasketService.searchProduct(productName)
    ];

    const results = await Promise.allSettled(searchPromises);
    
    // Process results
    const prices = {};
    results.forEach((result, index) => {
      const platforms = ['amazon', 'flipkart', 'bigbasket'];
      const platformName = platforms[index];
      
      if (result.status === 'fulfilled') {
        prices[platformName] = result.value;
      } else {
        prices[platformName] = {
          price: null,
          url: null,
          available: false,
          platform: platformName,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // Find best deal
    const availablePrices = Object.values(prices).filter(p => p.available && p.price);
    let bestDeal = null;

    if (availablePrices.length > 0) {
      const priceNumbers = availablePrices.map(p => {
        const priceStr = p.price.replace(/[₹,]/g, '');
        return { ...p, numericPrice: parseInt(priceStr) };
      });
      
      const cheapest = priceNumbers.reduce((min, current) => 
        current.numericPrice < min.numericPrice ? current : min
      );
      
      bestDeal = {
        platform: cheapest.platform,
        price: cheapest.numericPrice,
        displayPrice: cheapest.price
      };
    }

    // Response
    const response = {
      productName,
      currentPlatform: platform || 'unknown',
      currentPrice: currentPrice || 'Unknown',
      timestamp: new Date().toISOString(),
      prices,
      bestDeal
    };

    res.json(response);

  } catch (error) {
    console.error('Price comparison error:', error);
    res.status(500).json({
      error: 'Failed to compare prices',
      message: error.message
    });
  }
});

module.exports = router;
