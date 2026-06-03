export type Dimension = "weight" | "volume" | "count";
export type Unit = "g" | "kg" | "mL" | "L" | "unit";

export const unitLabels: Record<Unit, string> = {
  g: "grams",
  kg: "kilograms",
  mL: "milliliters",
  L: "liters",
  unit: "items"
};

export const baseUnitForDimension: Record<Dimension, Unit> = {
  weight: "g",
  volume: "mL",
  count: "unit"
};

const unitDimension: Record<Unit, Dimension> = {
  g: "weight",
  kg: "weight",
  mL: "volume",
  L: "volume",
  unit: "count"
};

const toBaseFactor: Record<Unit, number> = {
  g: 1,
  kg: 1000,
  mL: 1,
  L: 1000,
  unit: 1
};

export function unitsForDimension(dimension: Dimension): Unit[] {
  return Object.keys(unitDimension).filter((unit) => unitDimension[unit as Unit] === dimension) as Unit[];
}

export function assertCompatibleUnit(dimension: Dimension, unit: Unit) {
  if (unitDimension[unit] !== dimension) {
    throw new Error(`${unit} cannot be used for ${dimension} products`);
  }
}

export function toBaseQuantity(quantity: number, unit: Unit, dimension: Dimension) {
  assertCompatibleUnit(dimension, unit);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }
  return quantity * toBaseFactor[unit];
}

export function fromBaseQuantity(baseQuantity: number, unit: Unit, dimension: Dimension) {
  assertCompatibleUnit(dimension, unit);
  return baseQuantity / toBaseFactor[unit];
}

export function formatDecimal(value: string | number, maximumFractionDigits = 6) {
  const numericValue = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits
  }).format(numericValue);
}

export function formatInr(value: string | number) {
  const numericValue = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(numericValue);
}
