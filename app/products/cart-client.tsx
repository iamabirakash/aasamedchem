"use client";

import { useMemo, useState } from "react";
import { placeOrderAction } from "@/app/actions";
import { formatDecimal, formatInr, unitsForDimension, toBaseQuantity, fromBaseQuantity, type Dimension, type Unit } from "@/lib/units";

export type Product = {
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

function calculatePrice(quantity: string, unit: Unit, product: Product): string {
  const qty = parseFloat(quantity);
  if (!qty || qty <= 0) return "0";
  
  const baseQuantity = toBaseQuantity(qty, unit, product.dimension);
  const pricePerBaseUnit = parseFloat(product.price_per_base_unit_inr);
  const totalPrice = (baseQuantity * pricePerBaseUnit).toString();
  return totalPrice;
}

function getAvailableInUnit(inventoryBaseQty: string, unit: Unit, dimension: Dimension): string {
  const baseQty = parseFloat(inventoryBaseQty);
  const availableInUnit = fromBaseQuantity(baseQty, unit, dimension);
  return availableInUnit.toString();
}

export function ProductCart({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      
      const updated = {
        ...existing,
        ...patch
      };

      // Validation: check if quantity exceeds available inventory
      const newQuantity = patch.quantity ?? existing.quantity;
      const newUnit = patch.unit ?? existing.unit;
      const qtyNum = parseFloat(newQuantity);

      // Only validate if quantity is a valid positive number (skip validation while user is typing)
      if (qtyNum > 0 && Number.isFinite(qtyNum)) {
        try {
          const baseQuantity = toBaseQuantity(qtyNum, newUnit, updated.product.dimension);
          const availableBaseQty = parseFloat(updated.product.inventory_base_qty);

          if (baseQuantity > availableBaseQty) {
            const available = getAvailableInUnit(updated.product.inventory_base_qty, newUnit, updated.product.dimension);
            setErrors((current) => ({
              ...current,
              [productId]: `Only ${formatDecimal(available)} ${newUnit} available`
            }));
          } else {
            setErrors((current) => {
              const next = { ...current };
              delete next[productId];
              return next;
            });
          }
        } catch (err) {
          // If validation fails, clear the error to allow user to continue typing
          setErrors((current) => {
            const next = { ...current };
            delete next[productId];
            return next;
          });
        }
      } else {
        // For invalid/partial inputs, clear errors to allow typing
        setErrors((current) => {
          const next = { ...current };
          delete next[productId];
          return next;
        });
      }

      return {
        ...current,
        [productId]: updated
      };
    });
  }

  function removeLine(productId: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setErrors((current) => {
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
              const price = calculatePrice(line.quantity, line.unit, line.product);
              const error = errors[line.product.id];
              const availableInUnit = getAvailableInUnit(line.product.inventory_base_qty, line.unit, line.product.dimension);
              return (
                <article className="card stack" key={line.product.id} style={{ boxShadow: "none", borderColor: error ? "var(--danger)" : undefined }}>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p className="muted" style={{ margin: "4px 0" }}>
                        Available: {formatDecimal(availableInUnit)} {line.unit}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "1rem", fontWeight: 600 }}>
                        Total: {formatInr(price)}
                      </p>
                      {error && <p style={{ margin: "4px 0", color: "var(--danger)", fontSize: "0.9rem" }}>⚠️ {error}</p>}
                    </div>
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
            <button 
              type="submit" 
              disabled={Object.keys(errors).length > 0}
              style={{ opacity: Object.keys(errors).length > 0 ? 0.5 : 1, cursor: Object.keys(errors).length > 0 ? "not-allowed" : "pointer" }}
            >
              {Object.keys(errors).length > 0 ? "Fix quantity errors to proceed" : "Place order"}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
