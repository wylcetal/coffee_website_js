const express = require('express');
const router = express.Router();
const store = require('../utils/store');
const adminAuth = require('../middleware/adminAuth');
const { validateBody, str, email } = require('../utils/validate');
const { HttpError } = require('../middleware/errorHandler');

const contactSchema = {
    name:    (v) => str(v, { min: 2, max: 100 }),
    email:   (v) => email(v),
    message: (v) => str(v, { min: 5, max: 2000 }),
};

// POST /api/contact
router.post('/', (req, res) => {
    const r = validateBody(contactSchema, req.body);
    if (!r.ok) throw new HttpError(400, 'Validation failed');

    const entry = {
        id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        ...r.value,
        createdAt: new Date().toISOString(),
    };
    store.append('messages', entry);
    res.status(201).json({ ok: true, id: entry.id });
});

// GET /api/contact  (admin)
router.get('/', adminAuth, (req, res) => {
    const messages = store.read('messages', []);
    messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ count: messages.length, messages });
});

module.exports = router;
