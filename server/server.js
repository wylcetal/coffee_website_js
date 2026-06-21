/**
 * Coffee House — Express server
 * Serves the static frontend at / and the JSON API at /api/*
 */

const path = require('path');
const express = require('express');
const { env } = require('./src/config');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const menuRoutes    = require('./src/routes/menu');
const orderRoutes   = require('./src/routes/orders');
const contactRoutes = require('./src/routes/contact');
const galleryRoutes = require('./src/routes/gallery');

const app = express();

// --- Middleware -----------------------------------------------------------
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

// Request logger (compact)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`${req.method} ${req.path} -> ${res.statusCode} (${ms}ms)`);
    });
    next();
});

// --- API ------------------------------------------------------------------
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        name: 'coffee-house-api',
        version: require('./package.json').version,
        time: new Date().toISOString(),
    });
});

app.use('/api/menu',    menuRoutes);
app.use('/api/orders',  orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/gallery', galleryRoutes);

// --- Static frontend ------------------------------------------------------
const ROOT = path.join(__dirname, '..');
app.use(express.static(ROOT, { extensions: ['html'] }));

// SPA-style fallback: any non-API GET that doesn't match a file -> index.html
app.get(/^\/(?!api\/).*/, (req, res, next) => {
    res.sendFile(path.join(ROOT, 'index.html'), err => err && next(err));
});

// --- Errors ---------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// --- Boot -----------------------------------------------------------------
app.listen(env.PORT, () => {
    const lines = [
        `☕  Coffee House API`,
        `    listening on  http://localhost:${env.PORT}`,
        `    admin token:  ${env.ADMIN_TOKEN === 'change-me-in-production' ? '(default — change me!)' : 'configured'}`,
        `    tax rate:     ${(env.TAX_RATE * 100).toFixed(1)}%`,
        `    env:          ${env.NODE_ENV}`,
    ];
    console.log(lines.join('\n'));
});
