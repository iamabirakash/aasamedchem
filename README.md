# AasaMedChem Inventory & Quotation System

A small inventory, seller listing, buyer ordering, and admin oversight app built with Next.js, Neon PostgreSQL, and Vercel deployment in mind.

## Features

- Role-based authentication for `buyer`, `seller`, and `admin`.
- Buyer panel to search/filter products and place quotations/orders from sellers.
- Seller panel to list products with name, SKU, quantity, unit dimension, stock, and INR pricing.
- Seller sales panel to view buyer requests for their own products.
- Admin panel to search all products/sellers, create listings for any seller, edit/deactivate listings, and view all orders.
- Flexible quantities in `g`, `kg`, `mL`, `L`, and `unit`.
- Signed HTTP-only session cookie and PBKDF2 password hashes.

## Tech Stack & Design

- **Frontend/backend:** Next.js App Router with React Server Components and Server Actions.
- **Database:** Neon-hosted PostgreSQL via `@neondatabase/serverless`.
- **Auth:** Email/password login, PBKDF2 password hashes, signed cookie sessions.
- **Deployment:** Vercel with `DATABASE_URL` and `AUTH_SECRET` environment variables.

Server Actions validate roles, normalize units, calculate prices, and persist orders/listings in PostgreSQL.

## Directory Structure

- `app/` - Next.js App Router components and pages:
  - `actions.ts` - Centralized Server Actions handling authentication, product storage, status updates, and order placement.
  - `admin/` - Admin dashboard (catalog statistics, listings management, quotation audit logs, and buyer product requests).
  - `seller/` - Seller panel for managing listings, stock active state, and updating order fulfillment statuses.
  - `products/` - Buyer product page featuring real-time client-side search and cart management.
  - `orders/` - Buyer quotation list and detailed conversion audit page.
  - `login/` & `signup/` - User registration and authentication views.
- `lib/` - Core business logic utilities:
  - `auth.ts` - Session tokens, cookie management, and authorization routing gates.
  - `passwords.ts` - Secure PBKDF2 password hashing and verification algorithms.
  - `db.ts` - Neon database connection initialization and automatic schema generation.
  - `decimal.ts` - High-precision math utility using BigInt scaled to 12 decimal places.
  - `units.ts` - Conversion coefficients for weight (g, kg), volume (mL, L), and count (unit).
- `scripts/` - Database seed tools:
  - `seed.mjs` - Standalone command-line script to migrate the database schema and populate demo credentials.

## Database Schema

- `users`
  - `id UUID PRIMARY KEY`
  - `name TEXT`
  - `email TEXT UNIQUE`
  - `role TEXT CHECK ('admin', 'seller', 'buyer')`
  - `password_hash TEXT`
- `products`
  - `id UUID PRIMARY KEY`
  - `seller_id UUID REFERENCES users(id)`
  - `sku TEXT UNIQUE`
  - `name TEXT`
  - `category TEXT`
  - `description TEXT`
  - `dimension TEXT CHECK ('weight', 'volume', 'count')`
  - `base_unit TEXT CHECK ('g', 'mL', 'unit')`
  - `inventory_base_qty NUMERIC(30,12)`
  - `price_per_base_unit_inr NUMERIC(30,12)`
  - `is_active BOOLEAN`
- `orders`
  - `id UUID PRIMARY KEY`
  - `user_id UUID REFERENCES users(id)` as the buyer
  - `status TEXT CHECK ('pending', 'approved', 'rejected', 'fulfilled')`
  - `total_inr NUMERIC(30,12)`
  - `notes TEXT`
- `order_items`
  - `product_id UUID REFERENCES products(id)`
  - `requested_qty NUMERIC(30,12)`
  - `requested_unit TEXT CHECK ('g', 'kg', 'mL', 'L', 'unit')`
  - `base_qty NUMERIC(30,12)`
  - `base_unit TEXT CHECK ('g', 'mL', 'unit')`
  - `unit_price_inr NUMERIC(30,12)`
  - `line_total_inr NUMERIC(30,12)`

`NUMERIC(30,12)` is used for quantities and prices to support large values and high decimal precision without floating-point storage errors.

## Unit Storage & Conversion Strategy

Internal storage uses one base unit per dimension:

- **Weight:** grams (`g`)
- **Volume:** milliliters (`mL`)
- **Count:** items (`unit`)

Conversion factors:

- `1 kg = 1000 g`
- `1 L = 1000 mL`
- `1 unit = 1 unit`

Prices are stored as INR per base unit:

- Weight products: price per `g`
- Volume products: price per `mL`
- Count products: price per `unit`

Conversions happen in `app/actions.ts` during order placement:

1. Buyer enters `requested_qty` and `requested_unit`.
2. The action validates the unit against the product dimension.
3. Quantity converts to `base_qty`.
4. `line_total_inr = base_qty * price_per_base_unit_inr`.
5. Requested and base values are both stored for seller/admin audit.

## Local Setup

```bash
npm install
copy .env.example .env
npm run db:seed
npm run dev
```

Before `npm run db:seed`, put your Neon connection string and secret in `.env`:

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
AUTH_SECRET="a-long-random-secret"
```

Open `http://localhost:3000`.

## Demo Credentials

- Admin: `admin@aasamedchem.test` / `Admin@123`
- Seller: `seller@aasamedchem.test` / `Seller@123`
- Buyer: `buyer@aasamedchem.test` / `Buyer@123`

## Role Flows

- **Buyer:** Login, open Products, search/filter products, choose quantities/units, and place a quotation/order.
- **Seller:** Login, open My Listings, create product listings, manage active stock, and view sales requests.
- **Admin:** Login, search all products/sellers, create or edit any seller listing, deactivate listings, and review all orders/statuses.

Example: ordering `2 kg` of a weight product converts to `2000 g`; if the product rate is `₹0.85/g`, the line total is `₹1,700.00`.

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Add environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
4. Deploy.
5. Run `npm run db:seed` locally against the same Neon database, or visit the deployed app once to let schema initialization run.

## Live URL

Add your deployed Vercel URL here:

```text
https://your-project.vercel.app
```
