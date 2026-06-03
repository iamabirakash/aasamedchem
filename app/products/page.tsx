import { placeOrderAction } from "@/app/actions";
import { Nav } from "@/app/nav";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { formatDecimal, formatInr, unitsForDimension, type Dimension } from "@/lib/units";

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("seller");
  await ensureSchema();
  const params = await searchParams;
  const q = params.q ?? "";
  const category = params.category ?? "";

  const products: Array<Record<string, any>> = await sql`
    SELECT *
    FROM products
    WHERE is_active = true
      AND (${q} = '' OR name ILIKE ${`%${q}%`} OR sku ILIKE ${`%${q}%`} OR category ILIKE ${`%${q}%`})
      AND (${category} = '' OR category = ${category})
    ORDER BY category, name
  `;
  const categories: Array<Record<string, any>> = await sql`SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category`;

  return (
    <main className="shell">
      <Nav user={user} />
      <section className="hero">
        <span className="pill">Seller panel</span>
        <h1>Build a quotation across mixed units.</h1>
        <p>
          Select products, enter quantities in compatible units, and submit. Each line stores both requested
          units and normalized base quantities.
        </p>
      </section>

      <form className="card form-grid" action="/products">
        <label>
          Search
          <input name="q" defaultValue={q} placeholder="SKU, chemical, category..." />
        </label>
        <label>
          Category
          <select name="category" defaultValue={category}>
            <option value="">All categories</option>
            {categories.map((row) => (
              <option key={row.category} value={row.category}>
                {row.category}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filter</button>
      </form>

      <form className="stack" action={placeOrderAction} style={{ marginTop: 18 }}>
        {products.map((product) => {
          const dimension = product.dimension as Dimension;
          const units = unitsForDimension(dimension);
          return (
            <article className="card product-row" key={product.id}>
              <input name="product_id" type="checkbox" value={product.id} />
              <div>
                <span className="pill">{product.category}</span>
                <h3>{product.name}</h3>
                <p className="muted">
                  {product.sku} · Stock {formatDecimal(product.inventory_base_qty)} {product.base_unit} · Rate{" "}
                  {formatInr(product.price_per_base_unit_inr)} / {product.base_unit}
                </p>
                <p className="muted">{product.description}</p>
              </div>
              <label>
                Quantity
                <input name={`qty_${product.id}`} min="0" step="any" placeholder="0" />
              </label>
              <label>
                Unit
                <select name={`unit_${product.id}`}>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          );
        })}
        <section className="card stack">
          <label>
            Notes
            <textarea name="notes" rows={3} placeholder="Delivery preference, batch requirements, etc." />
          </label>
          <button type="submit">Place quotation</button>
        </section>
      </form>
    </main>
  );
}
