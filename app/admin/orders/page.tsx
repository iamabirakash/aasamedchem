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
            <div className="row-actions" style={{ justifyContent: "space-between" }}>
              <div>
                <span className="pill">{order.status}</span>
                <h2>{formatInr(order.total_inr)}</h2>
                <p className="muted">
                  {order.user_name} · {order.user_email} · {new Date(order.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <Link className="button ghost" href={`/orders/${order.id}`}>Open details</Link>
            </div>
            <div className="table-wrap">
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
                      <td>{item.product_name}<br /><span className="muted">{item.sku}</span></td>
                      <td>{formatDecimal(item.requested_qty)} {item.requested_unit}</td>
                      <td>{formatDecimal(item.base_qty)} {item.base_unit}</td>
                      <td>{formatInr(item.unit_price_inr)} / {item.base_unit}</td>
                      <td>{formatInr(item.line_total_inr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form className="row-actions" action={updateOrderStatusAction}>
              <input name="id" type="hidden" value={order.id} />
              <select name="status" defaultValue={order.status} style={{ maxWidth: 180 }}>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="fulfilled">fulfilled</option>
              </select>
              <button type="submit">Update status</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
