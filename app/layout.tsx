import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "./pwa-register";

export const metadata: Metadata = {
  title: "UK Vehicle Recovery",
  description: "Vehicle recovery and transport marketplace across the UK.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "UK Recovery",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#07131d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><body><PwaRegister />{children}</body></html>;
}