
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const priceRoutes = require('./routes/priceRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow chrome-extension origins, localhost, Replit domains, and no origin (for mobile apps)
    if (!origin || 
        origin.startsWith('chrome-extension://') || 
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://localhost') ||
        origin.includes('replit.dev') ||
        origin.includes('replit.co') ||
        origin.includes('replit.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/prices', priceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Price Checker API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Price Checker Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
});
