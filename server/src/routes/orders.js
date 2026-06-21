const express = require('express');
const router = express.Router();
const store = require('../utils/store');
const adminAuth = require('../middleware/adminAuth');
const { validateBody, int, str, enumOf } = require('../utils/validate');
const { env } = require('../config');
const { HttpError } = require('../middleware/errorHandler');

const ALLOWED_STATUS = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
const ALLOWED_TYPES  = ['pickup', 'delivery'];

function genId(prefix) {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

/**
 * POST /api/orders
 * Body: { items: [{id, qty}], customer?: {name, phone, address}, type?: 'pickup'|'delivery' }
 */
router.post('/', (req, res) => {
    const menu = store.read('menu', []);

    const itemSchema = {
        id:  (v) => int(v, { min: 1 }),
        qty: (v) => int(v, { min: 1, max: 99 }),
    };

    const rawItems = Array.isArray(req.body?.items) ? req.body.items : null;
    if (!rawItems || rawItems.length === 0) {
        throw new HttpError(400, 'Order must include at least one item.');
    }

    const seen = new Set();
    const items = [];
    const errors = [];
    rawItems.forEach((line, idx) => {
        const r = validateBody(itemSchema, line);
        if (!r.ok) {
            errors.push({ index: idx, errors: r.errors });
            return;
        }
        if (seen.has(r.value.id)) {
            errors.push({ index: idx, errors: { id: 'Duplicate item' } });
            return;
        }
        seen.add(r.value.id);
        const menuItem = menu.find(m => m.id === r.value.id);
        if (!menuItem) {
            errors.push({ index: idx, errors: { id: 'Unknown menu item' } });
            return;
        }
        items.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price, qty: r.value.qty });
    });

    if (errors.length) throw new HttpError(400, 'Invalid order items');

    const customer = {};
    if (req.body.customer) {
        const c = req.body.customer;
        if (c.name)    customer.name    = String(c.name).trim().slice(0, 100);
        if (c.phone)   customer.phone   = String(c.phone).trim().slice(0, 40);
        if (c.address) customer.address = String(c.address).trim().slice(0, 200);
    }

    const type = req.body.type || 'pickup';
    if (!ALLOWED_TYPES.includes(type)) throw new HttpError(400, `type must be one of: ${ALLOWED_TYPES.join(', ')}`);

    const subtotal = round2(items.reduce((s, it) => s + it.price * it.qty, 0));
    const tax      = round2(subtotal * env.TAX_RATE);
    const total    = round2(subtotal + tax);

    const order = {
        id: genId('ord'),
        items,
        customer,
        type,
        status: 'pending',
        currency: env.CURRENCY,
        subtotal, tax, total,
        createdAt: new Date().toISOString(),
    };

    store.append('orders', order);
    res.status(201).json(order);
});

// GET /api/orders  (admin)
router.get('/', adminAuth, (req, res) => {
    const orders = store.read('orders', []);
    const { status } = req.query;
    const filtered = status ? orders.filter(o => o.status === status) : orders;
    // Newest first
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ count: filtered.length, orders: filtered });
});

// GET /api/orders/:id  (admin)
router.get('/:id', adminAuth, (req, res) => {
    const order = store.read('orders', []).find(o => o.id === req.params.id);
    if (!order) throw new HttpError(404, 'Order not found');
    res.json(order);
});

// PATCH /api/orders/:id  (admin) — update status
router.patch('/:id', adminAuth, (req, res) => {
    const r = validateBody({ status: (v) => enumOf(v, ALLOWED_STATUS) }, req.body);
    if (!r.ok) throw new HttpError(400, `Invalid status. Allowed: ${ALLOWED_STATUS.join(', ')}`);

    const updated = store.update('orders', o => o.id === req.params.id, () => ({
        status: r.value.status,
        updatedAt: new Date().toISOString(),
    }));
    if (!updated) throw new HttpError(404, 'Order not found');
    res.json(updated);
});

// DELETE /api/orders/:id  (admin)
router.delete('/:id', adminAuth, (req, res) => {
    const ok = store.remove('orders', o => o.id === req.params.id);
    if (!ok) throw new HttpError(404, 'Order not found');
    res.status(204).end();
});

module.exports = router;
