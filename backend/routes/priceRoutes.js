const express = require('express');
const amazonService = require('../services/amazonService');
const flipkartService = require('../services/flipkartService');
const bigbasketService = require('../services/bigbasketService');

const router = express.Router();

// POST /api/prices - Compare prices across platforms
router.post('/', async (req, res) => {
  try {
    const { productName, currentPrice, platform } = req.body;

    if (!productName || typeof productName !== 'string' || productName.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Valid product name is required' 
      });
    }

    console.log(`🔍 Fetching prices for: ${productName}`);

    // Fetch prices from all platforms concurrently
    const [amazonData, flipkartData, bigbasketData] = await Promise.allSettled([
      amazonService.getPrice(productName),
      flipkartService.getPrice(productName),
      bigbasketService.getPrice(productName)
    ]);

    // Process results
    const prices = {
      amazon: amazonData.status === 'fulfilled' ? amazonData.value : null,
      flipkart: flipkartData.status === 'fulfilled' ? flipkartData.value : null,
      bigbasket: bigbasketData.status === 'fulfilled' ? bigbasketData.value : null
    };

    // Find best deal
    const availablePrices = Object.entries(prices)
      .filter(([_, data]) => data && data.available && data.price)
      .map(([platform, data]) => {
        // Improved price parsing to handle various formats
        const priceString = data.price.toString();
        const cleanedPrice = priceString.replace(/[₹$,\s]/g, '');
        const numericPrice = parseFloat(cleanedPrice);
        
        return {
          platform,
          price: isNaN(numericPrice) ? 0 : numericPrice,
          displayPrice: data.price
        };
      })
      .filter(item => item.price > 0); // Filter out invalid prices

    const bestDeal = availablePrices.length > 0 
      ? availablePrices.reduce((min, current) => 
          current.price < min.price ? current : min
        )
      : null;

    const response = {
      productName,
      currentPlatform: platform,
      currentPrice,
      timestamp: new Date().toISOString(),
      prices,
      bestDeal
    };

    console.log(`✅ Price comparison completed for: ${productName}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error in price comparison:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch price comparison',
      message: error.message 
    });
  }
});

module.exports = router;