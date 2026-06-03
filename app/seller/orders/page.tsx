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
            <div className="row-actions" style={{ justifyContent: "space-between" }}>
              <div>
                <span className="pill">{order.status}</span>
                <h2>{formatInr(order.total_inr)}</h2>
                <p className="muted">
                  {order.buyer_name} · {order.buyer_email}
                  {order.delivery_estimate_date ? ` · Delivery by ${new Date(order.delivery_estimate_date).toLocaleDateString("en-IN")}` : ""}
                </p>
              </div>
              <Link className="button ghost" href={`/orders/${order.id}`}>Open</Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Product</th><th>Requested</th><th>Base</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {items.filter((item) => item.order_id === order.id).map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{formatDecimal(item.requested_qty)} {item.requested_unit}</td>
                      <td>{formatDecimal(item.base_qty)} {item.base_unit}</td>
                      <td>{formatInr(item.line_total_inr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form className="form-grid" action={updateOrderStatusAction}>
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
                <input name="delivery_estimate_date" type="date" defaultValue={order.delivery_estimate_date ? new Date(order.delivery_estimate_date).toISOString().slice(0, 10) : ""} />
              </label>
              <button type="submit">Update order</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
