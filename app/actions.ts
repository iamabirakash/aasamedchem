"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { login, logout, requireUser } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { isPositive, multiplyByInteger, multiplyScaled, parseDecimalToScaled, scaledToDecimal } from "@/lib/decimal";
import { baseUnitForDimension, type Dimension, type Unit } from "@/lib/units";

const unitFactor: Record<Unit, bigint> = {
  g: 1n,
  kg: 1000n,
  mL: 1n,
  L: 1000n,
  unit: 1n
};

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await login(email, password);
  redirect(user.role === "admin" ? "/admin" : "/products");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function saveProductAction(formData: FormData) {
  await requireUser("admin");
  await ensureSchema();

  const id = String(formData.get("id") ?? "");
  const dimension = String(formData.get("dimension") ?? "count") as Dimension;
  const inventoryBaseQty = parseDecimalToScaled(formData.get("inventory_base_qty") ?? "0");
  const pricePerBase = parseDecimalToScaled(formData.get("price_per_base_unit_inr") ?? "0");

  if (!isPositive(pricePerBase)) throw new Error("Price must be greater than zero");

  const values = {
    sku: String(formData.get("sku") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    dimension,
    baseUnit: baseUnitForDimension[dimension],
    inventory: scaledToDecimal(inventoryBaseQty),
    price: scaledToDecimal(pricePerBase),
    isActive: formData.get("is_active") === "on"
  };

  if (!values.sku || !values.name || !values.category) {
    throw new Error("SKU, name, and category are required");
  }

  if (id) {
    await sql`
      UPDATE products
      SET sku = ${values.sku},
          name = ${values.name},
          category = ${values.category},
          description = ${values.description},
          dimension = ${values.dimension},
          base_unit = ${values.baseUnit},
          inventory_base_qty = ${values.inventory},
          price_per_base_unit_inr = ${values.price},
          is_active = ${values.isActive},
          updated_at = now()
      WHERE id = ${id}
    `;
  } else {
    await sql`
      INSERT INTO products (sku, name, category, description, dimension, base_unit, inventory_base_qty, price_per_base_unit_inr, is_active)
      VALUES (${values.sku}, ${values.name}, ${values.category}, ${values.description}, ${values.dimension}, ${values.baseUnit}, ${values.inventory}, ${values.price}, ${values.isActive})
    `;
  }

  revalidatePath("/admin");
  revalidatePath("/products");
  redirect("/admin");
}

export async function deleteProductAction(formData: FormData) {
  await requireUser("admin");
  await ensureSchema();
  const id = String(formData.get("id") ?? "");
  await sql`UPDATE products SET is_active = false, updated_at = now() WHERE id = ${id}`;
  revalidatePath("/admin");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireUser("admin");
  await ensureSchema();
  await sql`UPDATE orders SET status = ${String(formData.get("status"))} WHERE id = ${String(formData.get("id"))}`;
  revalidatePath("/admin/orders");
}

export async function placeOrderAction(formData: FormData) {
  const user = await requireUser("seller");
  await ensureSchema();

  const selectedIds = formData.getAll("product_id").map(String);
  if (selectedIds.length === 0) throw new Error("Select at least one product");

  let total = 0n;
  const lines = [];

  for (const productId of selectedIds) {
    const quantityInput = formData.get(`qty_${productId}`);
    const requestedUnit = String(formData.get(`unit_${productId}`)) as Unit;
    const quantity = parseDecimalToScaled(quantityInput ?? "0");
    if (!isPositive(quantity)) continue;

    const products = await sql`
      SELECT id, sku, name, dimension, base_unit, inventory_base_qty, price_per_base_unit_inr
      FROM products
      WHERE id = ${productId} AND is_active = true
      LIMIT 1
    `;
    const product = products[0];
    if (!product) continue;

    const baseUnit = product.base_unit as Unit;
    const dimension = product.dimension as Dimension;
    if (!["g", "kg", "mL", "L", "unit"].includes(requestedUnit)) {
      throw new Error("Unsupported unit");
    }
    if ((dimension === "weight" && !["g", "kg"].includes(requestedUnit)) || (dimension === "volume" && !["mL", "L"].includes(requestedUnit)) || (dimension === "count" && requestedUnit !== "unit")) {
      throw new Error(`Unit ${requestedUnit} is not valid for ${product.name}`);
    }

    const baseQty = multiplyByInteger(quantity, unitFactor[requestedUnit]);
    const pricePerBase = parseDecimalToScaled(product.price_per_base_unit_inr);
    const lineTotal = multiplyScaled(baseQty, pricePerBase);
    total += lineTotal;
    lines.push({
      product,
      requestedQty: scaledToDecimal(quantity),
      requestedUnit,
      baseQty: scaledToDecimal(baseQty),
      baseUnit,
      unitPrice: scaledToDecimal(pricePerBase),
      lineTotal: scaledToDecimal(lineTotal)
    });
  }

  if (lines.length === 0) throw new Error("Enter a quantity for at least one selected product");

  const insertedOrders = await sql`
    INSERT INTO orders (user_id, total_inr, notes)
    VALUES (${user.id}, ${scaledToDecimal(total)}, ${String(formData.get("notes") ?? "")})
    RETURNING id
  `;
  const orderId = insertedOrders[0].id;

  for (const line of lines) {
    await sql`
      INSERT INTO order_items (order_id, product_id, product_name, sku, requested_qty, requested_unit, base_qty, base_unit, unit_price_inr, line_total_inr)
      VALUES (${orderId}, ${line.product.id}, ${line.product.name}, ${line.product.sku}, ${line.requestedQty}, ${line.requestedUnit}, ${line.baseQty}, ${line.baseUnit}, ${line.unitPrice}, ${line.lineTotal})
    `;
  }

  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  redirect(`/orders/${orderId}`);
}
