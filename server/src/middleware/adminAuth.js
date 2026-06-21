const { env } = require('../config');

function adminAuth(req, res, next) {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.get('x-admin-token');
    if (!token || token !== env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid admin token.' });
    }
    next();
}

module.exports = adminAuth;
