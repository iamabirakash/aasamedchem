import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="shell" style={{ fontFamily: "'DM Sans', sans-serif", padding: "2.5rem 0" }}>
      <section style={{ maxWidth: "640px", marginBottom: "3.5rem" }}>
        <span style={{
          display: "inline-block",
          fontFamily: "'DM Mono', monospace",
          fontSize: "11px",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "#185FA5",
          background: "#E6F1FB",
          border: "0.5px solid #B5D4F4",
          padding: "5px 14px",
          borderRadius: "2px",
          marginBottom: "1.5rem",
        }}>
          AasaMedChem Assignment
        </span>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2rem, 5vw, 2.8rem)",
          fontWeight: 700,
          lineHeight: 1.15,
          margin: "0 0 1.25rem",
        }}>
          Inventory and quotation management for lab products.
        </h1>

        <p style={{
          fontSize: "15px",
          fontWeight: 300,
          lineHeight: 1.75,
          color: "#5F5E5A",
          margin: "0 0 2rem",
          maxWidth: "520px",
        }}>
          Search chemicals and consumables, quote flexible units like kg or L, and let admins
          verify every conversion against stored base quantities.
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            href={user ? (user.role === "admin" ? "/admin" : user.role === "seller" ? "/seller" : "/products") : "/login"}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "12px",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              padding: "12px 28px",
              background: "#1a1a1a",
              color: "#fff",
              borderRadius: "2px",
              textDecoration: "none",
            }}
          >
            Open dashboard
          </Link>
          <Link
            href="/login"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "12px",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              padding: "12px 28px",
              background: "transparent",
              color: "#1a1a1a",
              border: "0.5px solid #888780",
              borderRadius: "2px",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
          <Link
            href="/signup"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "12px",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              padding: "12px 28px",
              background: "transparent",
              color: "#1a1a1a",
              border: "0.5px solid #888780",
              borderRadius: "2px",
              textDecoration: "none",
            }}
          >
            Signup
          </Link>
        </div>
      </section>

      <hr style={{ height: "0.5px", background: "#D3D1C7", border: "none", margin: "0 0 2.5rem" }} />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { num: "01 /", title: "Base-unit storage", body: "Weight is stored in grams, volume in milliliters, and count in units." },
          { num: "02 /", title: "INR pricing", body: "Rates are stored per base unit as PostgreSQL NUMERIC values." },
          { num: "03 /", title: "Role panels", body: "Admins manage inventory and orders; sellers place quotations." },
        ].map((card, i) => (
          <article
            key={i}
            style={{
              padding: "1.5rem",
              border: "0.5px solid #D3D1C7",
              borderRight: i < 2 ? "0.5px solid #D3D1C7" : undefined,
            }}
          >
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#B4B2A9", marginBottom: ".75rem", letterSpacing: ".05em" }}>
              {card.num}
            </p>
            <h3 style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 .6rem" }}>{card.title}</h3>
            <p style={{ fontSize: "13px", fontWeight: 300, lineHeight: 1.6, color: "#5F5E5A", margin: 0 }}>{card.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}