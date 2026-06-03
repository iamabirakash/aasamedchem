import { deleteProductAction, saveProductAction } from "@/app/actions";
import { Nav } from "@/app/nav";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { formatDecimal, formatInr, unitsForDimension, type Dimension } from "@/lib/units";

export default async function AdminPage() {
  const user = await requireUser("admin");
  await ensureSchema();
  const products: Array<Record<string, any>> = await sql`SELECT * FROM products ORDER BY is_active DESC, category, name`;
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
        <h1>Inventory control with explicit base units.</h1>
        <p>
          Product quantities are stored in g, mL, or unit. Sellers can quote compatible display units while
          admins see the normalized math.
        </p>
      </section>

      <section className="grid three">
        <article className="card">
          <h3>{summary[0].active_products}</h3>
          <p className="muted">Active products</p>
        </article>
        <article className="card">
          <h3>{summary[0].products}</h3>
          <p className="muted">Total product records</p>
        </article>
        <article className="card">
          <h3>{formatInr(summary[0].stock_value)}</h3>
          <p className="muted">Estimated inventory value</p>
        </article>
      </section>

      <section className="card stack" style={{ marginTop: 18 }}>
        <h2>Create product</h2>
        <ProductForm />
      </section>

      <section className="card table-wrap" style={{ marginTop: 18 }}>
        <h2>Products</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Dimension</th>
              <th>Inventory</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Deactivate</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  <br />
                  <span className="muted">{product.sku} · {product.category}</span>
                </td>
                <td>
                  {product.dimension}
                  <br />
                  <span className="muted">Allowed: {unitsForDimension(product.dimension as Dimension).join(", ")}</span>
                </td>
                <td>{formatDecimal(product.inventory_base_qty)} {product.base_unit}</td>
                <td>{formatInr(product.price_per_base_unit_inr)} / {product.base_unit}</td>
                <td><span className="pill">{product.is_active ? "active" : "inactive"}</span></td>
                <td>
                  <form action={deleteProductAction}>
                    <input name="id" type="hidden" value={product.id} />
                    <button className="danger" type="submit">Deactivate</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function ProductForm() {
  return (
    <form className="form-grid" action={saveProductAction}>
      <label>
        SKU
        <input name="sku" placeholder="CHEM-ABC-001" required />
      </label>
      <label>
        Name
        <input name="name" placeholder="Product name" required />
      </label>
      <label>
        Category
        <input name="category" placeholder="Reagents" required />
      </label>
      <label>
        Dimension
        <select name="dimension" defaultValue="weight">
          <option value="weight">Weight (base g)</option>
          <option value="volume">Volume (base mL)</option>
          <option value="count">Count (base unit)</option>
        </select>
      </label>
      <label>
        Inventory in base unit
        <input name="inventory_base_qty" type="number" min="0" step="any" placeholder="1000.000000000001" required />
      </label>
      <label>
        Price / base unit INR
        <input name="price_per_base_unit_inr" type="number" min="0" step="any" placeholder="1.25" required />
      </label>
      <label>
        Description
        <textarea name="description" rows={2} placeholder="Short product details" />
      </label>
      <label>
        Active
        <input name="is_active" type="checkbox" defaultChecked />
      </label>
      <button type="submit">Save product</button>
    </form>
  );
}
