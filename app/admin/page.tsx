import { saveProductAction, toggleProductActiveAction } from "@/app/actions";
import { Nav } from "@/app/nav";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { formatDecimal, formatInr, unitsForDimension, type Dimension } from "@/lib/units";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("admin");
  await ensureSchema();
  const params = await searchParams;
  const q = params.q ?? "";
  const products: Array<Record<string, any>> = await sql`
    SELECT p.*, u.name AS seller_name, u.email AS seller_email
    FROM products p
    LEFT JOIN users u ON u.id = p.seller_id
    WHERE ${q} = ''
      OR p.name ILIKE ${`%${q}%`}
      OR p.sku ILIKE ${`%${q}%`}
      OR p.category ILIKE ${`%${q}%`}
      OR u.name ILIKE ${`%${q}%`}
      OR u.email ILIKE ${`%${q}%`}
    ORDER BY p.is_active DESC, p.category, p.name
  `;
  const sellers: Array<Record<string, any>> = await sql`
    SELECT id, name, email
    FROM users
    WHERE role = 'seller'
    ORDER BY name
  `;
  const summary: Array<Record<string, any>> = await sql`
    SELECT
      COUNT(*)::int AS products,
      COUNT(*) FILTER (WHERE is_active)::int AS active_products,
      COALESCE(SUM(inventory_base_qty * price_per_base_unit_inr), 0)::text AS stock_value
    FROM products
  `;

  return (
    <main className="shell">
      <Nav user={user} />

      <section className="hero">
        <span className="pill">Admin panel</span>
        <h1>Search, inspect, and edit everything.</h1>
        <p>Admins can see all sellers, all product listings, all stock/rate data, and all buyer orders.</p>
      </section>

      {/* Summary stats */}
      <section className="grid three">
        <article className="card">
          <p className="muted" style={{ margin: "0 0 6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active products</p>
          <h3 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>{summary[0].active_products}</h3>
        </article>
        <article className="card">
          <p className="muted" style={{ margin: "0 0 6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total product records</p>
          <h3 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>{summary[0].products}</h3>
        </article>
        <article className="card">
          <p className="muted" style={{ margin: "0 0 6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Estimated inventory value</p>
          <h3 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--accent)" }}>{formatInr(summary[0].stock_value)}</h3>
        </article>
      </section>

      {/* Create product */}
      <section className="card stack" style={{ marginTop: 16 }}>
        <h2>Create product for any seller</h2>
        <ProductForm sellers={sellers} />
      </section>

      {/* Search */}
      <form className="card form-grid" action="/admin" style={{ marginTop: 16 }}>
        <label>
          Admin search
          <input name="q" defaultValue={q} placeholder="Product, SKU, category, seller..." />
        </label>
        <button type="submit">Search anything</button>
      </form>

      {/* All products table */}
      <section className="card table-wrap" style={{ marginTop: 16 }}>
        <h2>All products</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Dimension</th>
              <th>Inventory</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Edit / Deactivate</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong style={{ fontWeight: 500 }}>{product.name}</strong>
                  <br />
                  <span className="muted" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem" }}>
                    {product.sku} · {product.category}
                  </span>
                  <br />
                  <span className="muted" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem" }}>
                    Seller: {product.seller_name ?? "Unassigned"} ({product.seller_email ?? "—"})
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem" }}>{product.dimension}</span>
                  <br />
                  <span className="muted" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem" }}>
                    {unitsForDimension(product.dimension as Dimension).join(", ")}
                  </span>
                </td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.85rem" }}>
                  {formatDecimal(product.inventory_base_qty)}{" "}
                  <span style={{ color: "var(--ink-3)" }}>{product.base_unit}</span>
                </td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--accent)" }}>{formatInr(product.price_per_base_unit_inr)}</span>
                  <span style={{ color: "var(--ink-3)" }}> / {product.base_unit}</span>
                </td>
                <td>
                  <span className="pill" data-status={product.is_active ? "active" : "inactive"}>
                    {product.is_active ? "active" : "inactive"}
                  </span>
                </td>
                <td style={{ verticalAlign: "top" }}>
                  <form action={toggleProductActiveAction}>
                    <input name="id" type="hidden" value={product.id} />
                    <input name="is_active" type="hidden" value={product.is_active ? "false" : "true"} />
                    <button className={product.is_active ? "danger" : ""} type="submit">
                      {product.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                  <details style={{ marginTop: 10 }}>
                    <summary className="button ghost">Edit product</summary>
                    <div style={{ marginTop: 12 }}>
                      <ProductForm sellers={sellers} product={product} />
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function ProductForm({ sellers, product }: { sellers: Array<Record<string, any>>; product?: Record<string, any> }) {
  return (
    <form className="form-grid" action={saveProductAction}>
      {product && <input name="id" type="hidden" value={product.id} />}
      <label>
        Seller
        <select name="seller_id" defaultValue={product?.seller_id ?? sellers[0]?.id ?? ""} required>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.name} ({seller.email})
            </option>
          ))}
        </select>
      </label>
      <label>SKU<input name="sku" defaultValue={product?.sku ?? ""} placeholder="CHEM-ABC-001" required /></label>
      <label>Name<input name="name" defaultValue={product?.name ?? ""} placeholder="Product name" required /></label>
      <label>Category<input name="category" defaultValue={product?.category ?? ""} placeholder="Reagents" required /></label>
      <label>
        Dimension
        <select name="dimension" defaultValue={product?.dimension ?? "weight"}>
          <option value="weight">Weight (base g)</option>
          <option value="volume">Volume (base mL)</option>
          <option value="count">Count (base unit)</option>
        </select>
      </label>
      <label>Inventory in base unit<input name="inventory_base_qty" defaultValue={product?.inventory_base_qty ?? ""} type="number" min="0" step="any" required /></label>
      <label>Price / base unit INR<input name="price_per_base_unit_inr" defaultValue={product?.price_per_base_unit_inr ?? ""} type="number" min="0" step="any" required /></label>
      <label>Description<textarea name="description" defaultValue={product?.description ?? ""} rows={2} /></label>
      <label>Active<input name="is_active" type="checkbox" defaultChecked={product?.is_active ?? true} /></label>
      <button type="submit">Save product</button>
    </form>
  );
}