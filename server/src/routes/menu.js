const express = require('express');
const router = express.Router();
const store = require('../utils/store');

// GET /api/menu  (optional ?category=hot)
router.get('/', (req, res) => {
    const items = store.read('menu', []);
    const { category } = req.query;
    const filtered = category ? items.filter(i => i.cat === category) : items;
    res.json({ count: filtered.length, items: filtered });
});

// GET /api/menu/:id
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const item = store.read('menu', []).find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'NotFound', message: `Menu item ${id} not found` });
    res.json(item);
});

module.exports = router;
