# ☕ Coffee House — Website + API

A small, full-stack demo project: a static coffee shop landing page served by a tiny Express backend that powers the menu, order placement, and contact form.

## What's inside

```
coffee_website_js/
├── index.html              # Static frontend
├── style.css
├── script.js               # Frontend logic (cart, UI, API calls)
├── images/                 # Product and gallery images
└── server/                 # Express backend
    ├── server.js           # Entry point
    ├── package.json
    ├── .env.example
    ├── data/
    │   └── menu.json       # Seed menu (orders & messages auto-created)
    └── src/
        ├── config.js
        ├── middleware/     # errorHandler, adminAuth
        ├── routes/         # menu, orders, contact, gallery
        └── utils/          # JSON store, validators
```

## Features

### Frontend
- Responsive landing page (hero, about, menu categories, testimonials, gallery, contact)
- **Order Online** section with category filters, prices, and live cart
- 🛒 Cart stored in `localStorage`; orders are POSTed to the backend
- 🌗 Light/dark mode toggle (persists)
- 📷 Gallery lightbox
- 📊 Scroll progress, scroll-spy nav, back-to-top
- Form validation with server-side confirmation

### Backend
- `GET  /api/health` — health check
- `GET  /api/menu[?category=hot]` — list menu items
- `GET  /api/menu/:id` — single item
- `POST /api/orders` — place an order
- `GET  /api/orders[?status=pending]` — list orders *(admin)*
- `GET  /api/orders/:id` — get order *(admin)*
- `PATCH /api/orders/:id` — update status *(admin)*
- `DELETE /api/orders/:id` — delete order *(admin)*
- `POST /api/contact` — submit a contact message
- `GET  /api/contact` — list contact messages *(admin)*
- `GET  /api/gallery[?tag=craft]` — gallery metadata
- Serves the static frontend at `/`

Admin endpoints require the `ADMIN_TOKEN` (header `Authorization: Bearer <token>` or `X-Admin-Token`).

## Quick start

```bash
cd server
cp .env.example .env       # then edit ADMIN_TOKEN, PORT, etc.
npm install
npm start
```

Open <http://localhost:3000>.

The first request hits `GET /api/menu` and renders the orderable items. Adding items to the cart and clicking **Place Order** creates a real order in `server/data/orders.json`.

## Configuration

| Variable      | Default                   | Notes                                     |
|---------------|---------------------------|-------------------------------------------|
| `PORT`        | `3000`                    | HTTP listen port                          |
| `ADMIN_TOKEN` | `change-me-in-production` | **Required** for admin endpoints          |
| `TAX_RATE`    | `0.08`                    | Applied to order subtotals (e.g. 0.08 = 8%) |
| `CURRENCY`    | `USD`                     | Currency code stored on orders            |

> Generate a strong admin token: `openssl rand -hex 32`

## Admin examples

```bash
# List all orders
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/api/orders

# Mark an order as ready
curl -X PATCH \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ready"}' \
  http://localhost:3000/api/orders/ord_xxx

# View contact messages
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/api/contact
```

## Data storage

For simplicity this project uses flat JSON files under `server/data/`:

- `menu.json` — seeded, read-only at runtime
- `orders.json` — auto-created on first order
- `messages.json` — auto-created on first contact submission

The store is single-process and not safe for concurrent writes — fine for demos and small projects, but swap in SQLite/Postgres before going to production.

## Development

```bash
cd server
npm run dev    # uses node --watch to auto-reload on file changes
```

## License

MIT
