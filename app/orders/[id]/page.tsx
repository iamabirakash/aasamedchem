import { Nav } from "@/app/nav";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { formatDecimal, formatInr } from "@/lib/units";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  await ensureSchema();
  const { id } = await params;
  const orders: Array<Record<string, any>> = await sql`
    SELECT o.*, u.name AS user_name, u.email AS user_email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.id = ${id}
      AND (${user.role} = 'admin' OR o.user_id = ${user.id})
    LIMIT 1
  `;
  const order = orders[0];
  const items: Array<Record<string, any>> = await sql`SELECT * FROM order_items WHERE order_id = ${id} ORDER BY product_name`;

  return (
    <main className="shell">
      <Nav user={user} />
      <section className="hero">
        <span className="pill">{order?.status ?? "Not found"}</span>
        <h1>Quotation details.</h1>
        {order && (
          <p>
            Requested by {order.user_name} ({order.user_email}) · Total {formatInr(order.total_inr)}
          </p>
        )}
      </section>
      {!order ? (
        <section className="card">Order not found.</section>
      ) : (
        <section className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Requested</th>
                <th>Base quantity</th>
                <th>Rate</th>
                <th>Line total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
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
        </section>
      )}
    </main>
  );
}
