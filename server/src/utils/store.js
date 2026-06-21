/**
 * Tiny JSON-file store. Reads once into memory, writes back on each mutation.
 * Good enough for low-traffic, single-process use. Not safe for concurrent writes.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function filePath(name) {
    return path.join(DATA_DIR, `${name}.json`);
}

function read(name, fallback = []) {
    ensureDir();
    const file = filePath(name);
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
        return fallback;
    }
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
        console.error(`[store] Failed to parse ${name}.json, resetting.`, err.message);
        fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
        return fallback;
    }
}

function write(name, data) {
    ensureDir();
    fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
    return data;
}

function append(name, entry) {
    const list = read(name, []);
    list.push(entry);
    write(name, list);
    return entry;
}

function update(name, predicate, updater) {
    const list = read(name, []);
    const idx = list.findIndex(predicate);
    if (idx === -1) return null;
    const updated = { ...list[idx], ...updater(list[idx]) };
    list[idx] = updated;
    write(name, list);
    return updated;
}

function remove(name, predicate) {
    const list = read(name, []);
    const next = list.filter(item => !predicate(item));
    if (next.length === list.length) return null;
    write(name, next);
    return true;
}

module.exports = { read, write, append, update, remove };
