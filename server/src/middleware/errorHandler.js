// 404 handler
function notFound(req, res, next) {
    res.status(404).json({ error: 'NotFound', message: `No route for ${req.method} ${req.path}` });
}

// Global error handler
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    const status = err.status || 500;
    if (status >= 500) console.error('[error]', err);
    res.status(status).json({
        error: err.name || 'Error',
        message: err.expose ? err.message : (status >= 500 ? 'Internal server error' : err.message),
    });
}

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.expose = true;
    }
}

module.exports = { notFound, errorHandler, HttpError };
