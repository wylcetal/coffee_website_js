// Load .env from server/ folder regardless of where node was started
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const env = {
    PORT: parseInt(process.env.PORT, 10) || 3000,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'change-me-in-production',
    TAX_RATE: parseFloat(process.env.TAX_RATE) || 0.08,
    CURRENCY: process.env.CURRENCY || 'USD',
    NODE_ENV: process.env.NODE_ENV || 'development',
};

module.exports = { env };
