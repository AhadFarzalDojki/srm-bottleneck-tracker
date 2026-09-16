import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Solid Rocket Motor Bottleneck",
  description:
    "What public U.S. federal contract data shows about concentration in missile " +
    "propulsion procurement, FY2016-FY2025.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
