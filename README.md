# Website Backend Integration Plan

This project now contains a static frontend for an e-commerce experience **and a scaffolded Node.js/Express backend with Prisma and SQLite**. Use the sections below to run the API locally, wire it to the existing frontend, and extend it with new features (payments, etc.).

## Backend layout
- Location: `backend/`
- Runtime: Node.js 18+
- Framework: Express with JSON body parsing and CORS enabled for the frontend origin.
- ORM: Prisma with the SQLite provider during development; you can later swap to Postgres/MySQL by changing the datasource in `schema.prisma` and running migrations.

### How to run locally (backend + bundled frontend)
1. **Create your environment file**
   ```bash
   cd backend
   cp .env.example .env
   ```
   The defaults target SQLite (`prisma/dev.db`) and allow the static frontend at `http://localhost:5500`. Set `PORT` if you want to override the dev server port (the `npm run dev` script uses `4000` by default; `npm start` falls back to the value in `.env`).

2. **Install dependencies** (requires access to the npm registry):
   ```bash
   npm install
   ```
   > If you see an error like `npm ERR! 403` while installing, it means the current environment can't reach the public npm registry. The repo already contains `package.json`/`package-lock.json`; rerun `npm install` when you have network access (no extra packages are needed beyond what's declared).

3. **Apply database migrations and seed data** (creates `prisma/dev.db` with sample users/products/categories/orders):
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
   If you are iterating on the schema and want Prisma to create a new migration locally, use `npx prisma migrate dev --name <change>` instead.

4. **Start the API and serve the bundled frontend**
   ```bash
   npm run dev
   ```
   This runs Nodemon with Prisma client generation and serves both the API and the static frontend from the same Express server. Open `http://localhost:4000` (or whatever `PORT` you set) to see the storefront; the API is available under the same origin (e.g., `http://localhost:4000/products`).

5. **Alternative: serve the frontend separately**
   If you prefer to host the static files with a simple server instead of Express, you can still run the backend with `npm start` (uses `.env` config) and serve the frontend from the repo root:
   ```bash
   npm install -g http-server
   http-server ./ecommerce-frontend -p 5500
   ```
   In this mode, ensure `CORS_ORIGIN` in `backend/.env` includes the frontend origin (e.g., `http://localhost:5500`).

## Core API surface (implemented)
- **Health:** `GET /health`
- **Auth:** `POST /auth/register`, `POST /auth/login`, `GET /me` (JWT bearer tokens)
- **Products:** `GET /products`, `GET /products/:id`
- **Cart:** `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`
- **Orders:**
  - `POST /orders` (checkout from the authenticated user’s cart, clears the cart)
  - `GET /orders/:id` (customer can view own orders; admins can view all)
  - `GET /orders` (admin)
  - `PATCH /orders/:id/status` (admin fulfill/cancel/update)

Data model lives in `backend/prisma/schema.prisma` with seed data in `backend/prisma/seed.js` (admin user + sample products). See `backend/prisma/ERD.md` for a rendered ER diagram (Mermaid).

## Frontend integration steps
1. Create a small `js/api.js` helper that wraps `fetch` with the API base URL and auth headers.
2. Replace `DataStore` reads/writes in `js/data.js`, `js/main.js`, `js/cart.js`, `js/order.js`, `js/login.js`, and `js/admin.js` with calls to the API helper.
3. Add loading/error UI states around network requests and gate admin views using the role from `/me`.
4. Remove the local seeding once API-backed data is in place to avoid diverging sources of truth.

### Should you integrate the API before the backend is fully done?
- **Do both in a thin vertical slice.** Scaffold the minimal backend surface for a single flow (e.g., `GET /products` backed by SQLite), then immediately point the corresponding frontend code at it. This keeps integration issues small and visible early.
- **Sequence recommendation:**
  1. Stand up the Express server, Prisma schema, and one read-only endpoint (`GET /products`).
  2. Switch the home/catalog pages to use that endpoint via `js/api.js`.
  3. Add auth (`/auth/login`) and gate admin/customer views.
  4. Implement cart and checkout endpoints next; wire the cart/checkout pages.
  5. Finish with admin inventory/order status endpoints.
- **Why not wait?** Integrating the frontend as you add each endpoint catches CORS, auth header, and data-shape issues early, instead of discovering them after the entire backend is built.

## Adding payments later
- Start with a payment-intent style endpoint: `POST /payments/create-intent` that receives order totals and returns a provider client secret (e.g., Stripe). After confirmation, complete the order by calling `PATCH /orders/:id/status` or `POST /orders` with a payment confirmation token.
- For other providers (PayPal, etc.), create provider-specific endpoints (e.g., `POST /payments/paypal/order`). Keep payment routes separate from core order creation so you can swap providers without touching cart/order logic.
- Secure payment webhooks (e.g., `POST /payments/webhook`) to mark orders as paid or failed based on provider callbacks.

## Environment configuration
- Use `.env` for `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and payment provider secrets.
- Serve the API on `http://localhost:3000` and the static frontend (e.g., `http://localhost:5500`); allow CORS for the frontend origin during development.

## Next steps checklist
- [x] Scaffold Express server (`src/index.js`) with health check and CORS.
- [x] Add Prisma models and migrations.
- [x] Seed products and an admin user.
- [x] Implement auth, product, cart, and order routes.
- [x] Swap frontend data access to the API helper and test flows end-to-end.
- [ ] Swap frontend data access to the API helper and test flows end-to-end.
- [ ] Add payment endpoints when you are ready to integrate a provider.

Ito na basahin mo pre


may mga functionalities na bago pre, yung account, di na pwede yung kahit ano lang, kailangan  mo na magsign up. Tsaka sa admin pre local palang ung accoutn nyan, 'admin@example.com' tapos password ay 'admin123'

Pwede ka na mag add ng mga products pre, tapos mga varianst, tapos kada variant pwede ka maglagay ng stocks sa mga sizes na available then yung price. 

eto pre, kunwari wlaa kang stocks ng xxl size, iwan mo lang na blank, automatic na yun na stock 0 yun.

Tapos kung gusto mo mag sale pre, punta ks sa edit product, piliin mo ung gusto mo iedit pre, tapos andun na yun gmga pwede mmong iedit. 
Tapos ung sa sale, i check molang ynu pre, tapos lagay mo kung ilng percent yung sale mo. Automatic na calculate yun.

sa taas din pala pre, pwede ka mag add ng categories. wag nalang muna mag delete lalo na pag may nakalagay na "1 products" mahigit, kasi diko alam kung anomangyayari dun.

gumagana naman na ynug manage orders tsaka cancellations pre. Pag binago mo ung status, malilipat ng tab yun, based sa status nya.

!!!!
sa pag run pala pre

eto
cd backend
npm run dev

pag may error pre, kahit i-gemini nalang muna, kasi di ako sure kung paano maayos pag nag error sa pag run