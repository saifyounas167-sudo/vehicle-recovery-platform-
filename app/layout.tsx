import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UK Vehicle Recovery",
  description: "Vehicle recovery and transport marketplace across the UK.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}