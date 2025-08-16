# Chrome Extension Price Checker

A real-time price comparison Chrome Extension that helps you find the best deals across Amazon, Flipkart, and BigBasket.

## Features

- 🔍 **Real-time Price Extraction**: Automatically detects product information from supported e-commerce sites
- 💰 **Multi-platform Comparison**: Compares prices across Amazon, Flipkart, and BigBasket
- 🎯 **Best Deal Detection**: Highlights the platform with the lowest price
- 🚀 **Fast & Lightweight**: Optimized for quick price comparisons
- 🎨 **Beautiful UI**: Clean, modern interface with smooth animations
- 📱 **Responsive Design**: Works perfectly on all screen sizes

## Supported Platforms

- Amazon India (amazon.in)
- Amazon US (amazon.com)
- Flipkart (flipkart.com)
- BigBasket (bigbasket.com)

## Installation

### Backend Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start the Server**:
   ```bash
   npm run dev
   ```

   The backend will start on `http://localhost:5000`

4. **Verify Backend**:
   Visit `http://localhost:5000/api/health` to ensure it's running

### Chrome Extension Setup

1. **Open Chrome Extensions**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

2. **Load Extension**:
   - Click "Load unpacked"
   - Select the `price-checker-extension` folder
   - The extension should appear in your extensions list

3. **Pin Extension**:
   - Click the puzzle piece icon in Chrome toolbar
   - Pin the "Real-time Price Checker" extension

## Usage

### Method 1: Automatic Detection
1. Visit any product page on supported platforms
2. Look for the "Price check available" indicator
3. Click "Compare Prices" to see instant results

### Method 2: Manual Check
1. Visit any product page
2. Click the extension icon in the toolbar
3. Click "Check Current Page"

### Method 3: Context Menu
1. Right-click on any supported product page
2. Select "Check Price Comparison"

## API Integration

### Current Status
The extension currently uses **dummy data** for demonstration. To enable real price fetching:

### Amazon API Setup
1. Get RapidAPI key from [RapidAPI Amazon Products](https://rapidapi.com/amazon-web-scraping-api/api/amazon-products1/)
2. Add to `.env`: `AMAZON_API_KEY=your_key_here`
3. Uncomment real API code in `backend/services/amazonService.js`

### Flipkart API Setup
1. Register for Flipkart Affiliate Program
2. Get API credentials
3. Add to `.env`:
   ```
   FLIPKART_AFFILIATE_ID=your_affiliate_id
   FLIPKART_API_TOKEN=your_api_token
   ```
4. Uncomment real API code in `backend/services/flipkartService.js`

### BigBasket API Setup
1. Contact BigBasket for API access
2. Add credentials to `.env`
3. Uncomment real API code in `backend/services/bigbasketService.js`

## Architecture

```
├── backend/                 # Node.js Express API
│   ├── services/           # Platform-specific price fetchers
│   ├── routes/            # API endpoints
│   ├── utils/             # Helper utilities
│   └── server.js          # Main server file
│
├── price-checker-extension/ # Chrome Extension
│   ├── manifest.json      # Extension configuration
│   ├── background.js      # Service worker
│   ├── content.js         # DOM manipulation
│   ├── popup.html         # Extension popup UI
│   ├── popup.js          # Popup logic
│   ├── styles.css        # UI styling
│   └── icons/            # Extension icons
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### Extension Development
1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click "Reload" button for your extension
4. Test changes

### Debugging
- **Backend Logs**: Check terminal where server is running
- **Extension Logs**: Open Chrome DevTools → Extensions → Your Extension
- **Content Script Logs**: Open DevTools on any product page

## Deployment

### Backend Deployment (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. From backend folder: `vercel`
3. Follow deployment prompts
4. Update extension's API URL to your Vercel URL

### Extension Distribution
1. **Zip Extension**: 
   ```bash
   cd price-checker-extension
   zip -r extension.zip * -x "*.DS_Store"
   ```

2. **Chrome Web Store**:
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Upload `extension.zip`
   - Fill in store listing details
   - Submit for review

## API Endpoints

### `POST /api/prices`
Compare prices for a product across platforms.

**Request**:
```json
{
  "productName": "iPhone 14",
  "currentPrice": "₹79,999",
  "platform": "amazon"
}
```

**Response**:
```json
{
  "productName": "iPhone 14",
  "currentPlatform": "amazon",
  "currentPrice": "₹79,999",
  "timestamp": "2025-01-10T12:00:00.000Z",
  "prices": {
    "amazon": {
      "price": "₹79,999",
      "url": "https://amazon.in/...",
      "available": true
    },
    "flipkart": {
      "price": "₹78,999",
      "url": "https://flipkart.com/...",
      "available": true
    },
    "bigbasket": {
      "price": null,
      "url": null,
      "available": false
    }
  },
  "bestDeal": {
    "platform": "flipkart",
    "price": 78999,
    "displayPrice": "₹78,999"
  }
}
```

### `GET /api/health`
Check backend server status.

## Troubleshooting

### Common Issues

1. **Extension not working**:
   - Check if backend server is running
   - Verify extension permissions in Chrome
   - Check browser console for errors

2. **No prices found**:
   - Ensure you're on a supported product page
   - Check if product name extraction is working
   - Verify backend API connectivity

3. **Backend connection failed**:
   - Check if server is running on port 5000
   - Verify CORS settings allow extension origin
   - Check network/firewall settings

### Debug Steps

1. **Check Extension Status**:
   - Click extension icon
   - Look at status indicator (connected/disconnected)

2. **Test Backend**:
   - Visit `http://localhost:5000/api/health`
   - Should return status "OK"

3. **Check Logs**:
   - Backend: Check server terminal
   - Extension: Chrome DevTools → Extensions

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Email: support@pricechecker.com

---

**Happy Price Checking! 💰**