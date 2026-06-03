import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AasaMedChem Inventory",
  description: "Inventory, quotation, and order management with unit conversion."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
