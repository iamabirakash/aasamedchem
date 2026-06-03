import Link from "next/link";
import { updateOrderStatusAction } from "@/app/actions";
import { Nav } from "@/app/nav";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { formatDecimal, formatInr } from "@/lib/units";

export default async function SellerOrdersPage() {
  const user = await requireUser("seller");
  await ensureSchema();
  const orders: Array<Record<string, any>> = await sql`
    SELECT DISTINCT o.*, u.name AS buyer_name, u.email AS buyer_email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE p.seller_id = ${user.id}
    ORDER BY o.created_at DESC
  `;
  const items: Array<Record<string, any>> = await sql`
    SELECT oi.*
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE p.seller_id = ${user.id}
    ORDER BY oi.product_name
  `;

  return (
    <main className="shell">
      <Nav user={user} />

      <section className="hero">
        <span className="pill">Seller panel</span>
        <h1>Sales requests for your products.</h1>
        <p>Update order status, set delivery estimates, and audit requested/base quantities.</p>
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
                  {order.buyer_name} · {order.buyer_email}
                  {order.delivery_estimate_date
                    ? ` · Delivery ${new Date(order.delivery_estimate_date).toLocaleDateString("en-IN")}`
                    : ""}
                </p>
              </div>
              <Link className="button ghost" href={`/orders/${order.id}`}>Open ↗</Link>
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
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter((item) => item.order_id === order.id).map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                      <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem" }}>
                        {formatDecimal(item.requested_qty)}{" "}
                        <span style={{ color: "var(--ink-3)" }}>{item.requested_unit}</span>
                      </td>
                      <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem" }}>
                        {formatDecimal(item.base_qty)}{" "}
                        <span style={{ color: "var(--ink-3)" }}>{item.base_unit}</span>
                      </td>
                      <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem", color: "var(--accent)" }}>
                        {formatInr(item.line_total_inr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Update form */}
            <form className="form-grid" action={updateOrderStatusAction} style={{
              paddingTop: 8,
              borderTop: "1px solid var(--line)",
            }}>
              <input name="id" type="hidden" value={order.id} />
              <label>
                Status
                <select name="status" defaultValue={order.status}>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                  <option value="fulfilled">fulfilled</option>
                </select>
              </label>
              <label>
                Delivery estimate
                <input
                  name="delivery_estimate_date"
                  type="date"
                  defaultValue={
                    order.delivery_estimate_date
                      ? new Date(order.delivery_estimate_date).toISOString().slice(0, 10)
                      : ""
                  }
                />
              </label>
              <button type="submit">Update order</button>
            </form>

          </article>
        ))}
      </section>
    </main>
  );
}