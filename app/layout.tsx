import type { Metadata } from "next";
import "./globals.css";
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

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
