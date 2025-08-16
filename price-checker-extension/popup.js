// Popup script for Chrome Extension

class PriceCheckerPopup {
  constructor() {
    this.currentState = 'welcome';
    this.lastResults = null;
    this.init();
  }

  async init() {
    await this.setupEventListeners();
    await this.checkInitialState();
    await this.checkBackendStatus();
  }

  async setupEventListeners() {
    // Check current page button
    document.getElementById('check-current-page').addEventListener('click', () => {
      this.handleCheckCurrentPage();
    });

    // Retry button
    document.getElementById('retry-button').addEventListener('click', () => {
      this.handleCheckCurrentPage();
    });

    // Check again button
    document.getElementById('check-again').addEventListener('click', () => {
      this.handleCheckCurrentPage();
    });

    // Backend status check
    document.getElementById('check-backend').addEventListener('click', () => {
      this.checkBackendStatus();
    });

    // Share results
    document.getElementById('share-results').addEventListener('click', () => {
      this.handleShareResults();
    });

    // Footer links
    document.getElementById('settings-button').addEventListener('click', () => {
      this.showSettings();
    });

    document.getElementById('feedback-button').addEventListener('click', () => {
      this.openFeedback();
    });
  }

  async checkInitialState() {
    try {
      // Check if we have recent results
      const result = await chrome.storage.local.get(['lastPriceCheck']);
      if (result.lastPriceCheck && result.lastPriceCheck.timestamp) {
        const timeDiff = Date.now() - result.lastPriceCheck.timestamp;
        // If results are less than 5 minutes old, show them
        if (timeDiff < 5 * 60 * 1000) {
          this.showResults(result.lastPriceCheck.data);
          return;
        }
      }

      // Check current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (this.isSupportedSite(tab.url)) {
        this.setState('welcome');
      } else {
        this.setState('not-supported');
      }
    } catch (error) {
      console.error('Error checking initial state:', error);
      this.setState('welcome');
    }
  }

  async checkBackendStatus() {
    try {
      this.updateStatusIndicator('checking', 'Checking backend...');
      
      const response = await this.sendMessageToBackground('checkHealth');
      
      if (response.success) {
        this.updateStatusIndicator('connected', 'Backend online');
      } else {
        this.updateStatusIndicator('disconnected', 'Backend offline');
      }
    } catch (error) {
      console.error('Backend status check failed:', error);
      this.updateStatusIndicator('error', 'Connection error');
    }
  }

  updateStatusIndicator(status, text) {
    const indicator = document.getElementById('status-indicator');
    const dot = indicator.querySelector('.status-dot');
    const textElement = indicator.querySelector('.status-text');
    
    // Remove all status classes
    dot.className = 'status-dot';
    // Add current status class
    dot.classList.add(`status-${status}`);
    textElement.textContent = text;
  }

  isSupportedSite(url) {
    if (!url) return false;
    
    const supportedDomains = [
      'amazon.in',
      'amazon.com',
      'flipkart.com',
      'bigbasket.com'
    ];
    
    return supportedDomains.some(domain => url.includes(domain));
  }

  async handleCheckCurrentPage() {
    try {
      this.setState('loading');
      this.updateLoadingSteps(0);

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!this.isSupportedSite(tab.url)) {
        this.setState('not-supported');
        return;
      }

      this.updateLoadingSteps(1);

      // Execute content script to extract product info
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.extractProductInfoFromPage
      });

      const productInfo = results[0]?.result;
      
      if (!productInfo) {
        throw new Error('Could not extract product information from this page');
      }

      this.updateLoadingSteps(2);

      // Send to background script for price comparison
      const response = await this.sendMessageToBackground('getPriceComparison', productInfo);

      this.updateLoadingSteps(4);

      if (response.success) {
        this.showResults(response.data);
      } else {
        throw new Error(response.error || 'Failed to get price comparison');
      }

    } catch (error) {
      console.error('Price check failed:', error);
      this.showError(error.message);
    }
  }

  // This function runs in the content script context
  extractProductInfoFromPage() {
    const PLATFORM_CONFIGS = {
      'amazon.in': {
        name: 'amazon',
        selectors: {
          productName: ['#productTitle', '.product-title'],
          price: ['.a-price-current .a-offscreen', '.a-price .a-offscreen']
        }
      },
      'amazon.com': {
        name: 'amazon',
        selectors: {
          productName: ['#productTitle', '.product-title'],
          price: ['.a-price-current .a-offscreen', '.a-price .a-offscreen']
        }
      },
      'flipkart.com': {
        name: 'flipkart',
        selectors: {
          productName: ['.B_NuCI', '.yhB1nd', '._35KyD6'],
          price: ['._30jeq3._16Jk6d', '._30jeq3', '._1_WHN1']
        }
      },
      'bigbasket.com': {
        name: 'bigbasket',
        selectors: {
          productName: ['.Description___StyledH', '.prod-name'],
          price: ['.Label-sc-15v1nk5-0.Pricing___StyledLabel2-sc-pldi2d-9', '.discnt-price']
        }
      }
    };

    function getCurrentPlatform() {
      const hostname = window.location.hostname.toLowerCase();
      for (const [domain, config] of Object.entries(PLATFORM_CONFIGS)) {
        if (hostname.includes(domain)) {
          return config;
        }
      }
      return null;
    }

    function extractText(selectors) {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          return element.textContent.trim();
        }
      }
      return null;
    }

    function cleanPrice(priceText) {
      if (!priceText) return null;
      
      const cleanText = priceText.replace(/\s+/g, ' ').trim();
      const priceMatch = cleanText.match(/[₹$][\d,]+(?:\.\d{2})?/);
      if (priceMatch) {
        return priceMatch[0];
      }
      
      const numberMatch = cleanText.match(/[\d,]+(?:\.\d{2})?/);
      if (numberMatch) {
        return `₹${numberMatch[0]}`;
      }
      
      return cleanText;
    }

    const platform = getCurrentPlatform();
    if (!platform) return null;

    const productName = extractText(platform.selectors.productName);
    const priceText = extractText(platform.selectors.price);
    const price = cleanPrice(priceText);

    if (!productName) return null;

    return {
      productName: productName,
      currentPrice: price || 'N/A',
      platform: platform.name,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }

  updateLoadingSteps(currentStep) {
    const steps = document.querySelectorAll('.loading-steps .step');
    steps.forEach((step, index) => {
      if (index < currentStep) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (index === currentStep) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
  }

  async sendMessageToBackground(action, data) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action, data }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { success: false, error: 'No response from background script' });
          }
        });
      } catch (error) {
        console.error('Send message error:', error);
        resolve({ success: false, error: error.message });
      }
    });
  }

  setState(state) {
    this.currentState = state;
    
    // Hide all states
    document.querySelectorAll('.state').forEach(el => el.classList.remove('active'));
    
    // Show current state
    const currentStateEl = document.getElementById(`${state}-state`);
    if (currentStateEl) {
      currentStateEl.classList.add('active');
    }
  }

  showResults(data) {
    this.lastResults = data;
    
    // Update product info
    document.getElementById('product-name').textContent = data.productName || 'Unknown Product';
    document.getElementById('current-platform').textContent = (data.currentPlatform || 'unknown').toUpperCase();
    document.getElementById('current-price').textContent = data.currentPrice || 'N/A';

    // Generate price cards
    this.generatePriceCards(data.prices, data.bestDeal);

    // Show best deal if available
    if (data.bestDeal) {
      this.showBestDeal(data.bestDeal);
    }

    this.setState('results');
  }

  generatePriceCards(prices, bestDeal) {
    const container = document.getElementById('price-cards');
    container.innerHTML = '';

    const platforms = [
      { key: 'amazon', name: 'Amazon', icon: '📦' },
      { key: 'flipkart', name: 'Flipkart', icon: '🛍️' },
      { key: 'bigbasket', name: 'BigBasket', icon: '🥬' }
    ];

    platforms.forEach(platform => {
      const data = prices[platform.key];
      const isBestDeal = bestDeal && bestDeal.platform === platform.key;
      
      const card = document.createElement('div');
      card.className = `price-card ${data.available ? 'available' : 'unavailable'} ${isBestDeal ? 'best-deal' : ''}`;
      
      card.innerHTML = `
        <div class="card-header">
          <span class="platform-icon">${platform.icon}</span>
          <span class="platform-name">${platform.name}</span>
          ${isBestDeal ? '<span class="best-deal-badge">Best Deal!</span>' : ''}
        </div>
        <div class="card-body">
          <div class="price ${data.available ? 'available' : 'unavailable'}">
            ${data.available ? data.price : 'Not Available'}
          </div>
          ${data.available && data.url ? `
            <a href="${data.url}" target="_blank" class="view-product">
              View Product →
            </a>
          ` : ''}
          ${data.error ? `
            <div class="error-text">${data.error}</div>
          ` : ''}
        </div>
      `;

      container.appendChild(card);
    });
  }

  showBestDeal(bestDeal) {
    const banner = document.getElementById('best-deal');
    const details = document.getElementById('best-deal-details');
    
    details.innerHTML = `
      Save with <strong>${bestDeal.platform.toUpperCase()}</strong> at ${bestDeal.displayPrice}
    `;
    
    banner.classList.remove('hidden');
  }

  showError(message) {
    document.getElementById('error-message').textContent = message;
    this.setState('error');
  }

  async handleShareResults() {
    if (!this.lastResults) return;

    const shareText = this.generateShareText(this.lastResults);
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Price Comparison Results',
          text: shareText
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        this.showToast('Results copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      this.showToast('Share failed. Please try again.');
    }
  }

  generateShareText(data) {
    let text = `💰 Price Comparison for "${data.productName}"\n\n`;
    
    const platforms = ['amazon', 'flipkart', 'bigbasket'];
    const names = { amazon: 'Amazon', flipkart: 'Flipkart', bigbasket: 'BigBasket' };
    
    platforms.forEach(platform => {
      const price = data.prices[platform];
      text += `${names[platform]}: ${price.available ? price.price : 'Not Available'}\n`;
    });
    
    if (data.bestDeal) {
      text += `\n🎯 Best Deal: ${data.bestDeal.platform.toUpperCase()} - ${data.bestDeal.displayPrice}`;
    }
    
    text += '\n\nFound using Price Checker Extension';
    return text;
  }

  showSettings() {
    // TODO: Implement settings modal/page
    this.showToast('Settings coming soon!');
  }

  openFeedback() {
    // Open feedback form or email
    const email = 'feedback@pricechecker.com';
    const subject = 'Price Checker Extension Feedback';
    const body = 'Hi! I have feedback about the Price Checker extension:\n\n';
    
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }

  showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PriceCheckerPopup();
});