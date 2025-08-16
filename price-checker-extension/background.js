// Background service worker for Chrome Extension

const API_BASE_URL = 'http://localhost:5000/api';

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.action === 'getPriceComparison') {
    handlePriceComparison(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }

  if (request.action === 'checkHealth') {
    checkBackendHealth()
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Handle price comparison request
async function handlePriceComparison(productData) {
  try {
    console.log('Fetching price comparison for:', productData);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${API_BASE_URL}/prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName: productData.productName,
        currentPrice: productData.currentPrice,
        platform: productData.platform
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Price comparison result:', data);

    // Store the result for popup access
    await chrome.storage.local.set({
      lastPriceCheck: {
        data: data,
        timestamp: Date.now()
      }
    });

    return data;
  } catch (error) {
    console.error('Price comparison error:', error);
    throw error;
  }
}

// Check if backend is healthy
async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Backend health check failed:', error);
    throw error;
  }
}

// Context menu for quick price check
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'checkPrice',
    title: 'Check Price Comparison',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://www.amazon.in/*',
      'https://www.amazon.com/*',
      'https://www.flipkart.com/*',
      'https://www.bigbasket.com/*'
    ]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'checkPrice') {
    chrome.tabs.sendMessage(tab.id, { action: 'extractAndCompare' });
  }
});

// Badge update based on price comparison results
function updateBadge(tabId, priceData) {
  if (priceData && priceData.bestDeal) {
    chrome.action.setBadgeText({
      text: '✓',
      tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#28a745',
      tabId: tabId
    });
  } else {
    chrome.action.setBadgeText({
      text: '',
      tabId: tabId
    });
  }
}