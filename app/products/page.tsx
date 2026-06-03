import { Nav } from "@/app/nav";
import { SearchClient } from "@/app/products/search-client";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";

export default async function ProductsPage() {
  const user = await requireUser("buyer");
  await ensureSchema();

  const products: Array<Record<string, any>> = await sql`
    SELECT p.*, u.name AS seller_name
    FROM products p
    LEFT JOIN users u ON u.id = p.seller_id
    WHERE p.is_active = true
    ORDER BY p.category, p.name
  `;
  const categories: Array<Record<string, any>> = await sql`SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category`;

  return (
    <main className="shell">
      <Nav user={user} />
      <section className="hero">
        <span className="pill">Buyer panel</span>
        <h1>Search products, add to cart, then order.</h1>
        <p>Real-time search. Find chemicals instantly. Can't find what you need? Request it!</p>
      </section>

      <SearchClient 
        initialProducts={products as any}
        categories={categories.map(c => c.category)}
      />
    </main>
  );
}
