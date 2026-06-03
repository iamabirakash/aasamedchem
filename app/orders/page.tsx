import Link from "next/link";
import { Nav } from "@/app/nav";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { formatInr } from "@/lib/units";

export default async function OrdersPage() {
  const user = await requireUser("buyer");
  await ensureSchema();
  const orders: Array<Record<string, any>> = await sql`
    SELECT id, status, total_inr, notes, created_at
    FROM orders
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
  `;

  return (
    <main className="shell">
      <Nav user={user} />
      <section className="hero">
        <span className="pill">Seller panel</span>
        <h1>Your quotations.</h1>
      </section>
      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Notes</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{new Date(order.created_at).toLocaleString("en-IN")}</td>
                <td><span className="pill">{order.status}</span></td>
                <td>{formatInr(order.total_inr)}</td>
                <td>{order.notes || "—"}</td>
                <td><Link className="button ghost" href={`/orders/${order.id}`}>Details</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
