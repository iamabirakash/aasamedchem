# AasaMedChem Inventory & Quotation System

A small hackathon-style inventory and order management app built with Next.js, Neon PostgreSQL, and Vercel deployment in mind.

## Features

- Role-based authentication for `admin` and `seller`.
- Admin inventory panel for creating/deactivating products, setting stock, and configuring per-base-unit INR prices.
- Seller product search/filter page with multi-product quotation placement.
- Flexible order quantities in `g`, `kg`, `mL`, `L`, and `unit`.
- Admin order review showing requested units, normalized base quantities, per-base prices, and totals.
- Signed HTTP-only session cookie and PBKDF2 password hashes.

## Tech Stack & Design

- **Frontend/backend:** Next.js App Router with React Server Components and Server Actions.
- **Database:** Neon-hosted PostgreSQL via `@neondatabase/serverless`.
- **Auth:** Email/password login, PBKDF2 password hashes, signed cookie sessions.
- **Deployment:** Vercel, with `DATABASE_URL` and `AUTH_SECRET` configured as environment variables.

The frontend calls Server Actions for login, product management, order placement, and status updates. Those actions validate roles, normalize units, calculate prices, and persist data in PostgreSQL.

## Database Schema

Core tables are created automatically by `ensureSchema()` and can also be initialized with `npm run db:seed`.

- `users`
  - `id UUID PRIMARY KEY`
  - `name TEXT`
  - `email TEXT UNIQUE`
  - `role TEXT CHECK ('admin', 'seller')`
  - `password_hash TEXT`
- `products`
  - `id UUID PRIMARY KEY`
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
  - `user_id UUID REFERENCES users(id)`
  - `status TEXT CHECK ('pending', 'approved', 'rejected', 'fulfilled')`
  - `total_inr NUMERIC(30,12)`
  - `notes TEXT`
- `order_items`
  - `requested_qty NUMERIC(30,12)`
  - `requested_unit TEXT CHECK ('g', 'kg', 'mL', 'L', 'unit')`
  - `base_qty NUMERIC(30,12)`
  - `base_unit TEXT CHECK ('g', 'mL', 'unit')`
  - `unit_price_inr NUMERIC(30,12)`
  - `line_total_inr NUMERIC(30,12)`

`NUMERIC(30,12)` was chosen for quantities and prices because chemical inventory can require very small fractional rates as well as very large stock or quotation values. It avoids floating-point storage errors and keeps 12 decimal places for conversion-sensitive calculations.

## Unit Storage & Conversion Strategy

Internal storage uses one base unit per dimension:

- **Weight:** stored in grams (`g`)
- **Volume:** stored in milliliters (`mL`)
- **Count:** stored in items (`unit`)

Supported conversion factors:

- `1 kg = 1000 g`
- `1 L = 1000 mL`
- `1 unit = 1 unit`

Prices are stored as INR per base unit:

- Weight products store price per `g`.
- Volume products store price per `mL`.
- Count products store price per `unit`.

Conversions are applied in `app/actions.ts` before saving order items:

1. Seller enters `requested_qty` and `requested_unit`.
2. Code validates that the unit matches the product dimension.
3. Requested quantity is converted to `base_qty`.
4. `line_total_inr = base_qty * price_per_base_unit_inr`.
5. Both requested and base values are stored, so admins can audit the conversion.

Decimal parsing and multiplication use scaled `BigInt` helpers in `lib/decimal.ts` before values are written to PostgreSQL `NUMERIC` columns.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env`:

   ```bash
   cp .env.example .env
   ```

3. Add your Neon pooled or direct connection string:

   ```env
   DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
   AUTH_SECRET="a-long-random-secret"
   ```

4. Initialize schema and demo records:

   ```bash
   npm run db:seed
   ```

5. Run locally:

   ```bash
   npm run dev
   ```

## Demo Credentials

- Admin: `admin@aasamedchem.test` / `Admin@123`
- Seller: `seller@aasamedchem.test` / `Seller@123`

## Using the App

- **Seller flow:** Login as seller, open Products, search/filter, select one or more products, enter compatible quantities/units, and place a quotation.
- **Admin inventory:** Login as admin, create products with base stock and base-unit INR price, and deactivate products as needed.
- **Admin order review:** Open Admin Orders to see requested units, normalized base quantities, rates, totals, notes, and status controls.

Example: ordering `2 kg` of a weight product converts to `2000 g`; if the product rate is `₹0.85/g`, the line total is `₹1,700.00`.

## Vercel Deployment

1. Push the repository to GitHub with meaningful incremental commits.
2. Import the repository in Vercel.
3. Set environment variables in Vercel Project Settings:
   - `DATABASE_URL`
   - `AUTH_SECRET`
4. Deploy.
5. After deployment, visit the live URL once or run `npm run db:seed` locally against the same Neon database to ensure the schema and demo users exist.

## Live URL

Add your deployed Vercel URL here after deployment:

```text
https://your-project.vercel.app
```
