// Content script to extract product information from e-commerce websites

(function() {
  'use strict';

  // Configuration for different platforms
  const PLATFORM_CONFIGS = {
    'amazon.in': {
      name: 'amazon',
      selectors: {
        productName: [
          '#productTitle',
          '.product-title',
          '[data-automation-id="product-title"]',
          '.a-size-large.product-title-word-break'
        ],
        price: [
          '.a-price-current .a-offscreen',
          '.a-price .a-offscreen',
          '#priceblock_dealprice',
          '#corePrice_feature_div .a-price .a-offscreen',
          '.a-price-range .a-offscreen'
        ]
      }
    },
    'amazon.com': {
      name: 'amazon',
      selectors: {
        productName: [
          '#productTitle',
          '.product-title',
          '[data-automation-id="product-title"]'
        ],
        price: [
          '.a-price-current .a-offscreen',
          '.a-price .a-offscreen',
          '#priceblock_dealprice'
        ]
      }
    },
    'flipkart.com': {
      name: 'flipkart',
      selectors: {
        productName: [
          '.B_NuCI',
          '.yhB1nd',
          '._35KyD6',
          '.x-product-title-label',
          'h1'
        ],
        price: [
          '._30jeq3._16Jk6d',
          '._30jeq3',
          '._1_WHN1',
          '.selling-price',
          '._25b18c'
        ]
      }
    },
    'bigbasket.com': {
      name: 'bigbasket',
      selectors: {
        productName: [
          '.Description___StyledH',
          '.prod-name',
          '.product-name',
          'h1'
        ],
        price: [
          '.Label-sc-15v1nk5-0.Pricing___StyledLabel2-sc-pldi2d-9',
          '.discnt-price',
          '.price',
          '.selling-price'
        ]
      }
    }
  };

  // Determine current platform
  function getCurrentPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    for (const [domain, config] of Object.entries(PLATFORM_CONFIGS)) {
      if (hostname.includes(domain)) {
        return config;
      }
    }
    return null;
  }

  // Extract text using multiple selectors
  function extractText(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  // Clean and format price
  function cleanPrice(priceText) {
    if (!priceText) return null;
    
    // Remove extra whitespace and extract price
    const cleanText = priceText.replace(/\s+/g, ' ').trim();
    
    // Extract price patterns (₹1,999 or $19.99 etc.)
    const priceMatch = cleanText.match(/[₹$][\d,]+(?:\.\d{2})?/);
    if (priceMatch) {
      return priceMatch[0];
    }
    
    // Fallback: look for numbers with currency symbols
    const numberMatch = cleanText.match(/[\d,]+(?:\.\d{2})?/);
    if (numberMatch) {
      return `₹${numberMatch[0]}`;
    }
    
    return cleanText;
  }

  // Extract product information
  function extractProductInfo() {
    const platform = getCurrentPlatform();
    if (!platform) {
      console.log('Unsupported platform');
      return null;
    }

    const productName = extractText(platform.selectors.productName);
    const priceText = extractText(platform.selectors.price);
    const price = cleanPrice(priceText);

    if (!productName) {
      console.log('Could not extract product name');
      return null;
    }

    const productInfo = {
      productName: productName,
      currentPrice: price || 'N/A',
      platform: platform.name,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    console.log('Extracted product info:', productInfo);
    return productInfo;
  }

  // Show floating price comparison widget
  function showPriceWidget(priceData) {
    // Remove existing widget
    const existingWidget = document.getElementById('price-checker-widget');
    if (existingWidget) {
      existingWidget.remove();
    }

    // Create widget HTML
    const widget = document.createElement('div');
    widget.id = 'price-checker-widget';
    // Function to safely escape HTML
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    widget.innerHTML = `
      <div class="pc-header">
        <h3>💰 Price Comparison</h3>
        <button class="pc-close">&times;</button>
      </div>
      <div class="pc-content">
        <div class="pc-product">
          <h4>${escapeHtml(priceData.productName)}</h4>
          <small>Current: ${escapeHtml(priceData.currentPrice)}</small>
        </div>
        <div class="pc-prices">
          ${generatePriceCards(priceData.prices, priceData.bestDeal)}
        </div>
        ${priceData.bestDeal ? `
          <div class="pc-best-deal">
            🎯 Best Deal: ${escapeHtml(priceData.bestDeal.platform.toUpperCase())} - ${escapeHtml(priceData.bestDeal.displayPrice)}
          </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(widget);

    // Add close functionality
    widget.querySelector('.pc-close').addEventListener('click', () => {
      widget.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (document.getElementById('price-checker-widget')) {
        widget.remove();
      }
    }, 10000);
  }

  // Generate price cards HTML
  function generatePriceCards(prices, bestDeal) {
    const platforms = ['amazon', 'flipkart', 'bigbasket'];
    const platformNames = {
      amazon: 'Amazon',
      flipkart: 'Flipkart',
      bigbasket: 'BigBasket'
    };

    return platforms.map(platform => {
      const data = prices[platform];
      const isBestDeal = bestDeal && bestDeal.platform === platform;
      
      return `
        <div class="pc-price-card ${data.available ? 'available' : 'unavailable'} ${isBestDeal ? 'best-deal' : ''}">
          <div class="pc-platform">${platformNames[platform]}</div>
          <div class="pc-price">
            ${data.available ? data.price : 'Not Available'}
          </div>
          ${data.available && data.url ? `
            <a href="${data.url}" target="_blank" class="pc-link">View Product</a>
          ` : ''}
          ${isBestDeal ? '<div class="pc-badge">Best Deal!</div>' : ''}
        </div>
      `;
    }).join('');
  }

  // Auto-extract on page load (for product pages)
  function autoExtractOnLoad() {
    // Wait for page to fully load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoExtractOnLoad);
      return;
    }

    // Check if this looks like a product page
    const platform = getCurrentPlatform();
    if (!platform) return;

    // Simple heuristic: if we can extract both name and price, it's likely a product page
    const productInfo = extractProductInfo();
    if (productInfo && productInfo.productName) {
      console.log('Product page detected, ready for price checking');
      
      // Show a subtle indicator that price checking is available
      showPriceCheckIndicator();
    }
  }

  // Show subtle indicator that price checking is available
  function showPriceCheckIndicator() {
    if (document.getElementById('price-check-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'price-check-indicator';
    indicator.innerHTML = `
      <div class="pci-content">
        <span class="pci-icon">💰</span>
        <span class="pci-text">Price check available</span>
        <button class="pci-button">Compare Prices</button>
      </div>
    `;

    document.body.appendChild(indicator);

    // Add click handler
    indicator.querySelector('.pci-button').addEventListener('click', () => {
      handleManualPriceCheck();
      indicator.remove();
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (document.getElementById('price-check-indicator')) {
        indicator.remove();
      }
    }, 5000);
  }

  // Handle manual price check
  function handleManualPriceCheck() {
    const productInfo = extractProductInfo();
    if (!productInfo) {
      showError('Could not extract product information from this page.');
      return;
    }

    // Show loading state
    showLoading('Fetching price comparison...');

      // Send to background script
  chrome.runtime.sendMessage({
    action: 'getPriceComparison',
    data: productInfo
  }, (response) => {
    hideLoading();
    
    if (chrome.runtime.lastError) {
      showError('Extension error: ' + chrome.runtime.lastError.message);
      return;
    }
    
    if (response && response.success) {
      showPriceWidget(response.data);
    } else {
      showError('Failed to fetch price comparison: ' + (response?.error || 'Unknown error'));
    }
  });
  }

  // Show loading indicator
  function showLoading(message) {
    const loading = document.createElement('div');
    loading.id = 'price-checker-loading';
    loading.innerHTML = `
      <div class="pcl-content">
        <div class="pcl-spinner"></div>
        <div class="pcl-message">${message}</div>
      </div>
    `;
    document.body.appendChild(loading);
  }

  // Hide loading indicator
  function hideLoading() {
    const loading = document.getElementById('price-checker-loading');
    if (loading) {
      loading.remove();
    }
  }

  // Show error message
  function showError(message) {
    const error = document.createElement('div');
    error.id = 'price-checker-error';
    error.innerHTML = `
      <div class="pce-content">
        <div class="pce-icon">⚠️</div>
        <div class="pce-message">${message}</div>
        <button class="pce-close">Close</button>
      </div>
    `;
    document.body.appendChild(error);

    error.querySelector('.pce-close').addEventListener('click', () => {
      error.remove();
    });

    setTimeout(() => {
      if (document.getElementById('price-checker-error')) {
        error.remove();
      }
    }, 5000);
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractAndCompare') {
      handleManualPriceCheck();
    }
  });

  // Initialize
  autoExtractOnLoad();

})();