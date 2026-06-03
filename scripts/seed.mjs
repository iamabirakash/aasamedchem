import { existsSync, readFileSync } from "fs";
import { pbkdf2Sync, randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";

function loadDotEnv() {
  if (!existsSync(".env")) {
    return;
  }

  const content = readFileSync(".env", "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function hashPassword(password) {
  const iterations = 120_000;
  const keyLength = 32;
  const digest = "sha256";
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

async function main() {
  loadDotEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env and add your Neon connection string.");
  }

  const sql = neon(process.env.DATABASE_URL);

  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'seller', 'buyer')),
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`;
  await sql`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'seller', 'buyer'))`;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_id UUID REFERENCES users(id),
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      dimension TEXT NOT NULL CHECK (dimension IN ('weight', 'volume', 'count')),
      base_unit TEXT NOT NULL CHECK (base_unit IN ('g', 'mL', 'unit')),
      inventory_base_qty NUMERIC(30,12) NOT NULL CHECK (inventory_base_qty >= 0),
      price_per_base_unit_inr NUMERIC(30,12) NOT NULL CHECK (price_per_base_unit_inr >= 0),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
      total_inr NUMERIC(30,12) NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      requested_qty NUMERIC(30,12) NOT NULL CHECK (requested_qty > 0),
      requested_unit TEXT NOT NULL CHECK (requested_unit IN ('g', 'kg', 'mL', 'L', 'unit')),
      base_qty NUMERIC(30,12) NOT NULL CHECK (base_qty > 0),
      base_unit TEXT NOT NULL CHECK (base_unit IN ('g', 'mL', 'unit')),
      unit_price_inr NUMERIC(30,12) NOT NULL CHECK (unit_price_inr >= 0),
      line_total_inr NUMERIC(30,12) NOT NULL CHECK (line_total_inr >= 0)
    )
  `;

  const users = await sql`SELECT COUNT(*)::int AS count FROM users`;
  if (users[0].count === 0) {
    await sql`
      INSERT INTO users (name, email, role, password_hash)
      VALUES
      ('Aasa Admin', 'admin@aasamedchem.test', 'admin', ${hashPassword("Admin@123")}),
      ('Seller Demo', 'seller@aasamedchem.test', 'seller', ${hashPassword("Seller@123")}),
      ('Buyer Demo', 'buyer@aasamedchem.test', 'buyer', ${hashPassword("Buyer@123")})
    `;
  }

  await sql`
    INSERT INTO users (name, email, role, password_hash)
    VALUES ('Buyer Demo', 'buyer@aasamedchem.test', 'buyer', ${hashPassword("Buyer@123")})
    ON CONFLICT (email) DO NOTHING
  `;

  const sellers = await sql`SELECT id FROM users WHERE role = 'seller' ORDER BY created_at LIMIT 1`;
  const sellerId = sellers[0]?.id;

  const products = await sql`SELECT COUNT(*)::int AS count FROM products`;
  if (products[0].count === 0 && sellerId) {
    await sql`
      INSERT INTO products (seller_id, sku, name, category, description, dimension, base_unit, inventory_base_qty, price_per_base_unit_inr)
      VALUES
      (${sellerId}, 'CHEM-NA-001', 'Sodium Chloride AR', 'Reagents', 'Analytical reagent grade sodium chloride.', 'weight', 'g', 250000.000000000000, 0.850000000000),
      (${sellerId}, 'SOL-ETH-001', 'Ethanol 99.9%', 'Solvents', 'High purity ethanol for lab usage.', 'volume', 'mL', 500000.000000000000, 1.250000000000),
      (${sellerId}, 'KIT-PIP-010', 'Sterile Pipette Tips', 'Consumables', 'Box of sterile universal pipette tips.', 'count', 'unit', 10000.000000000000, 2.750000000000),
      (${sellerId}, 'CHEM-KI-001', 'Potassium Iodide', 'Reagents', 'Pharma-grade potassium iodide powder.', 'weight', 'g', 75000.000000000000, 4.650000000000)
    `;
  }

  if (sellerId) {
    await sql`UPDATE products SET seller_id = ${sellerId} WHERE seller_id IS NULL`;
  }

  console.log("Database schema and demo data are ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
