const scale = 12n;
const multiplier = 10n ** scale;

export function parseDecimalToScaled(input: FormDataEntryValue | string | number) {
  const text = String(input).trim();
  if (!/^\d+(\.\d+)?$/.test(text)) {
    throw new Error("Use a positive decimal number");
  }
  const [whole, fraction = ""] = text.split(".");
  const paddedFraction = fraction.padEnd(Number(scale), "0").slice(0, Number(scale));
  return BigInt(whole) * multiplier + BigInt(paddedFraction || "0");
}

export function scaledToDecimal(value: bigint, fractionDigits = 12) {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / multiplier;
  const fraction = (absolute % multiplier).toString().padStart(Number(scale), "0").slice(0, fractionDigits);
  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${sign}${whole}.${trimmed}` : `${sign}${whole}`;
}

export function multiplyScaled(left: bigint, right: bigint) {
  return (left * right) / multiplier;
}

export function multiplyByInteger(value: bigint, factor: bigint) {
  return value * factor;
}

export function isPositive(value: bigint) {
  return value > 0n;
}
