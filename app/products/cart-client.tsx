"use client";

import { useMemo, useState } from "react";
import { placeOrderAction } from "@/app/actions";
import { formatDecimal, formatInr, unitsForDimension, type Dimension, type Unit } from "@/lib/units";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  dimension: Dimension;
  base_unit: Unit;
  inventory_base_qty: string;
  price_per_base_unit_inr: string;
  seller_name?: string;
};

type CartLine = {
  product: Product;
  quantity: string;
  unit: Unit;
};

export function ProductCart({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Record<string, CartLine>>({});

  const lines = useMemo(() => Object.values(cart), [cart]);

  function addToCart(product: Product) {
    const defaultUnit = unitsForDimension(product.dimension)[0];
    setCart((current) => ({
      ...current,
      [product.id]: current[product.id] ?? {
        product,
        quantity: "1",
        unit: defaultUnit
      }
    }));
  }

  function updateLine(productId: string, patch: Partial<CartLine>) {
    setCart((current) => {
      const existing = current[productId];
      if (!existing) return current;
      return {
        ...current,
        [productId]: {
          ...existing,
          ...patch
        }
      };
    });
  }

  function removeLine(productId: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  return (
    <div className="grid two" style={{ marginTop: 18, alignItems: "start" }}>
      <section className="stack">
        {products.map((product) => (
          <article className="card" key={product.id}>
            <span className="pill">{product.category}</span>
            <h3>{product.name}</h3>
            <p className="muted">
              Seller {product.seller_name ?? "Unassigned"} · {product.sku} · Stock {formatDecimal(product.inventory_base_qty)} {product.base_unit} · Rate{" "}
              {formatInr(product.price_per_base_unit_inr)} / {product.base_unit}
            </p>
            <p className="muted">{product.description}</p>
            <button type="button" onClick={() => addToCart(product)}>
              {cart[product.id] ? "Added to cart" : "Add to cart"}
            </button>
          </article>
        ))}
      </section>

      <aside className="card stack" style={{ position: "sticky", top: 16 }}>
        <div>
          <span className="pill">{lines.length} item{lines.length === 1 ? "" : "s"}</span>
          <h2>Cart</h2>
          <p className="muted">Add products first, then set quantity/unit here before placing the order.</p>
        </div>

        {lines.length === 0 ? (
          <p className="muted">Your cart is empty.</p>
        ) : (
          <form className="stack" action={placeOrderAction}>
            {lines.map((line) => {
              const units = unitsForDimension(line.product.dimension);
              return (
                <article className="card stack" key={line.product.id} style={{ boxShadow: "none" }}>
                  <input name="product_id" type="hidden" value={line.product.id} />
                  <strong>{line.product.name}</strong>
                  <span className="muted">{formatInr(line.product.price_per_base_unit_inr)} / {line.product.base_unit}</span>
                  <div className="form-grid">
                    <label>
                      Quantity
                      <input
                        name={`qty_${line.product.id}`}
                        min="0"
                        step="any"
                        value={line.quantity}
                        onChange={(event) => updateLine(line.product.id, { quantity: event.target.value })}
                      />
                    </label>
                    <label>
                      Unit
                      <select
                        name={`unit_${line.product.id}`}
                        value={line.unit}
                        onChange={(event) => updateLine(line.product.id, { unit: event.target.value as Unit })}
                      >
                        {units.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button className="ghost" type="button" onClick={() => removeLine(line.product.id)}>
                    Remove
                  </button>
                </article>
              );
            })}
            <label>
              Notes
              <textarea name="notes" rows={3} placeholder="Delivery preference, batch requirements, etc." />
            </label>
            <button type="submit">Place order</button>
          </form>
        )}
      </aside>
    </div>
  );
}
