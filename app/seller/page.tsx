import { saveProductAction, toggleProductActiveAction } from "@/app/actions";
import { Nav } from "@/app/nav";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { formatDecimal, formatInr, unitsForDimension, type Dimension } from "@/lib/units";

export default async function SellerPage() {
  const user = await requireUser("seller");
  await ensureSchema();
  const products: Array<Record<string, any>> = await sql`
    SELECT *
    FROM products
    WHERE seller_id = ${user.id}
    ORDER BY is_active DESC, category, name
  `;

  return (
    <main className="shell">
      <Nav user={user} />

      <section className="hero">
        <span className="pill">Seller panel</span>
        <h1>List products and manage stock.</h1>
        <p>Create sellable products with quantity, unit dimension, inventory, and INR rate per base unit.</p>
      </section>

      <section className="card stack">
        <h2>Add product listing</h2>
        <ProductForm />
      </section>

      <section className="card table-wrap" style={{ marginTop: 16 }}>
        <h2>Your listings</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Units</th>
              <th>Inventory</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong style={{ fontWeight: 500, color: "var(--ink)" }}>{product.name}</strong>
                  <br />
                  <span className="muted" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem" }}>
                    {product.sku} · {product.category}
                  </span>
                </td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "var(--ink-2)" }}>
                  {unitsForDimension(product.dimension as Dimension).join(", ")}
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
                  <span
                    className="pill"
                    data-status={product.is_active ? "active" : "inactive"}
                  >
                    {product.is_active ? "active" : "inactive"}
                  </span>
                </td>
                <td>
                  <form action={toggleProductActiveAction}>
                    <input name="id" type="hidden" value={product.id} />
                    <input name="is_active" type="hidden" value={product.is_active ? "false" : "true"} />
                    <button className={product.is_active ? "danger" : ""} type="submit">
                      {product.is_active ? "Deactivate" : "Activate"}
                    </button>
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
        <input name="inventory_base_qty" type="number" min="0" step="any" required />
      </label>
      <label>
        Price / base unit INR
        <input name="price_per_base_unit_inr" type="number" min="0" step="any" required />
      </label>
      <label>
        Description
        <textarea name="description" rows={2} />
      </label>
      <label>
        Active
        <input name="is_active" type="checkbox" defaultChecked />
      </label>
      <button type="submit">Save listing</button>
    </form>
  );
}