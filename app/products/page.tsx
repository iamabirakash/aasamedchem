import { Nav } from "@/app/nav";
import { ProductCart } from "@/app/products/cart-client";
import { requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("buyer");
  await ensureSchema();
  const params = await searchParams;
  const q = params.q ?? "";
  const category = params.category ?? "";

  const products: Array<Record<string, any>> = await sql`
    SELECT p.*, u.name AS seller_name
    FROM products p
    LEFT JOIN users u ON u.id = p.seller_id
    WHERE p.is_active = true
      AND (${q} = '' OR p.name ILIKE ${`%${q}%`} OR p.sku ILIKE ${`%${q}%`} OR p.category ILIKE ${`%${q}%`} OR u.name ILIKE ${`%${q}%`})
      AND (${category} = '' OR p.category = ${category})
    ORDER BY p.category, p.name
  `;
  const categories: Array<Record<string, any>> = await sql`SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category`;

  return (
    <main className="shell">
      <Nav user={user} />
      <section className="hero">
        <span className="pill">Buyer panel</span>
        <h1>Search products, add to cart, then order.</h1>
        <p>No checkbox juggling. Add products to cart, set quantity and unit in one place, then submit.</p>
      </section>

      <form className="card form-grid" action="/products">
        <label>
          Search
          <input name="q" defaultValue={q} placeholder="SKU, chemical, category, seller..." />
        </label>
        <label>
          Category
          <select name="category" defaultValue={category}>
            <option value="">All categories</option>
            {categories.map((row) => (
              <option key={row.category} value={row.category}>
                {row.category}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filter</button>
      </form>

      <ProductCart products={products as any} />
    </main>
  );
}
