import Link from "next/link";
import { updateOrderStatusAction } from "@/app/actions";
import { Nav } from "@/app/nav";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { formatDecimal, formatInr } from "@/lib/units";

export default async function AdminOrdersPage() {
  const user = await requireUser("admin");
  await ensureSchema();
  const orders: Array<Record<string, any>> = await sql`
    SELECT o.*, u.name AS user_name, u.email AS user_email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
  `;
  const items: Array<Record<string, any>> = await sql`
    SELECT oi.*, o.id AS parent_order_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    ORDER BY oi.product_name
  `;

  return (
    <main className="shell">
      <Nav user={user} />

      <section className="hero">
        <span className="pill">Admin panel</span>
        <h1>Incoming quotations and conversion audit.</h1>
        <p>Each line shows seller-entered units, normalized base quantities, per-base INR rates, and totals.</p>
      </section>

      <section className="grid">
        {orders.map((order) => (
          <article className="card stack" key={order.id}>

            {/* Order header */}
            <div className="row-actions" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <span className="pill" data-status={order.status}>{order.status}</span>
                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                  margin: 0,
                  color: "var(--accent)",
                  letterSpacing: "-0.02em",
                }}>
                  {formatInr(order.total_inr)}
                </p>
                <p className="muted" style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem" }}>
                  {order.user_name} · {order.user_email} · {new Date(order.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <Link className="button ghost" href={`/orders/${order.id}`}>Open details ↗</Link>
            </div>

            {/* Line items table */}
            <div className="table-wrap" style={{
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Requested</th>
                    <th>Base</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter((item) => item.parent_order_id === order.id).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span style={{ fontWeight: 500 }}>{item.product_name}</span>
                        <br />
                        <span className="muted" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem" }}>{item.sku}</span>
                      </td>
                      <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem" }}>
                        {formatDecimal(item.requested_qty)}{" "}
                        <span style={{ color: "var(--ink-3)" }}>{item.requested_unit}</span>
                      </td>
                      <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem" }}>
                        {formatDecimal(item.base_qty)}{" "}
                        <span style={{ color: "var(--ink-3)" }}>{item.base_unit}</span>
                      </td>
                      <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem" }}>
                        <span style={{ color: "var(--accent)" }}>{formatInr(item.unit_price_inr)}</span>
                        <span style={{ color: "var(--ink-3)" }}> / {item.base_unit}</span>
                      </td>
                      <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem", color: "var(--accent)" }}>
                        {formatInr(item.line_total_inr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Status update form */}
            <form className="row-actions" action={updateOrderStatusAction} style={{
              paddingTop: 14,
              borderTop: "1px solid var(--line)",
              alignItems: "end",
            }}>
              <input name="id" type="hidden" value={order.id} />
              <label style={{ flex: 1, maxWidth: 200 }}>
                Status
                <select name="status" defaultValue={order.status}>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                  <option value="fulfilled">fulfilled</option>
                </select>
              </label>
              <button type="submit">Update status</button>
            </form>

          </article>
        ))}
      </section>
    </main>
  );
}