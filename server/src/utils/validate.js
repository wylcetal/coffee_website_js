/**
 * Tiny validation helpers. Returns { ok, value, errors }.
 */

function str(value, { min = 1, max = 1000, required = true } = {}) {
    if (value === undefined || value === null || value === '') {
        return required ? { ok: false, error: 'Required' } : { ok: true, value: '' };
    }
    const s = String(value).trim();
    if (s.length < min) return { ok: false, error: `Must be at least ${min} characters` };
    if (s.length > max) return { ok: false, error: `Must be at most ${max} characters` };
    return { ok: true, value: s };
}

function email(value, { required = true } = {}) {
    if (!value) return required ? { ok: false, error: 'Email is required' } : { ok: true, value: '' };
    const s = String(value).trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(s)) return { ok: false, error: 'Invalid email' };
    return { ok: true, value: s };
}

function int(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
    const n = Number(value);
    if (!Number.isInteger(n)) return { ok: false, error: 'Must be an integer' };
    if (n < min) return { ok: false, error: `Must be >= ${min}` };
    if (n > max) return { ok: false, error: `Must be <= ${max}` };
    return { ok: true, value: n };
}

function enumOf(value, allowed) {
    if (!allowed.includes(value)) return { ok: false, error: `Must be one of: ${allowed.join(', ')}` };
    return { ok: true, value };
}

function validateBody(schema, body) {
    const errors = {};
    const out = {};
    for (const key of Object.keys(schema)) {
        const result = schema[key](body?.[key]);
        if (!result.ok) errors[key] = result.error;
        else if (result.value !== undefined) out[key] = result.value;
    }
    return { ok: Object.keys(errors).length === 0, errors, value: out };
}

module.exports = { str, email, int, enumOf, validateBody };
