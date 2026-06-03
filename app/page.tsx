import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="shell">
      <section className="hero">
        <span className="pill">AasaMedChem Assignment</span>
        <h1>Inventory and quotation management for lab products.</h1>
        <p>
          Search chemicals and consumables, quote flexible units like kg or L, and let admins verify
          every conversion against stored base quantities.
        </p>
        <div className="row-actions">
          <Link className="button" href={user ? (user.role === "admin" ? "/admin" : "/products") : "/login"}>
            Open dashboard
          </Link>
          <Link className="button ghost" href="/login">
            Login
          </Link>
        </div>
      </section>
      <section className="grid three">
        <article className="card">
          <h3>Base-unit storage</h3>
          <p className="muted">Weight is stored in grams, volume in milliliters, and count in units.</p>
        </article>
        <article className="card">
          <h3>INR pricing</h3>
          <p className="muted">Rates are stored per base unit as PostgreSQL NUMERIC values.</p>
        </article>
        <article className="card">
          <h3>Role panels</h3>
          <p className="muted">Admins manage inventory and orders; sellers place quotations.</p>
        </article>
      </section>
    </main>
  );
}
