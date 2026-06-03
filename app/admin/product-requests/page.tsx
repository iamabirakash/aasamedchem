import { Nav } from "@/app/nav";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";

export default async function AdminProductRequestsPage() {
  const user = await requireUser("admin");
  await ensureSchema();

  const requests: Array<Record<string, any>> = await sql`
    SELECT 
      pr.id,
      pr.product_name,
      pr.category,
      pr.description,
      pr.status,
      pr.created_at,
      u.name AS buyer_name,
      u.email AS buyer_email
    FROM product_requests pr
    JOIN users u ON u.id = pr.buyer_id
    ORDER BY pr.status ASC, pr.created_at DESC
  `;

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acknowledgedCount = requests.filter((r) => r.status === "acknowledged").length;

  return (
    <main className="shell">
      <Nav user={user} />
      <section className="hero">
        <span className="pill">Admin Panel</span>
        <h1>Product Requests</h1>
        <p>Buyers are requesting products that are not currently available in the catalog.</p>
      </section>

      <div className="grid" style={{ marginBottom: "24px" }}>
        <div className="card">
          <p className="muted">Pending Requests</p>
          <p style={{ fontSize: "2rem", fontWeight: 700 }}>{pendingCount}</p>
        </div>
        <div className="card">
          <p className="muted">Acknowledged</p>
          <p style={{ fontSize: "2rem", fontWeight: 700 }}>{acknowledgedCount}</p>
        </div>
        <div className="card">
          <p className="muted">Total Requests</p>
          <p style={{ fontSize: "2rem", fontWeight: 700 }}>{requests.length}</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p className="muted">No product requests yet. Buyers are happy with current inventory!</p>
        </div>
      ) : (
        <div className="card stack">
          <h2>All Requests</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Buyer</th>
                  <th>Requested</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} style={{ opacity: request.status === "rejected" ? 0.6 : 1 }}>
                    <td>
                      <span
                        className="pill"
                        data-status={request.status}
                        style={{ textTransform: "capitalize" }}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{request.product_name}</td>
                    <td>{request.category || "—"}</td>
                    <td>
                      <div>
                        <strong>{request.buyer_name}</strong>
                        <div className="muted" style={{ fontSize: "0.85rem" }}>
                          {request.buyer_email}
                        </div>
                      </div>
                    </td>
                    <td className="muted" style={{ fontSize: "0.85rem" }}>
                      {new Date(request.created_at).toLocaleDateString("en-IN")}
                      <br />
                      {new Date(request.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td>
                      {request.description && (
                        <small className="muted">{request.description.substring(0, 50)}...</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "var(--surface-2)", borderRadius: "var(--radius-sm)" }}>
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "8px" }}>
              💡 Tip: Use this data to identify which products are in high demand and should be added to your catalog.
            </p>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              Contact sellers to supply these products or reach out to buyers with estimated availability dates.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
