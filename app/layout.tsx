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
  return <html lang="en-GB"><body><PwaRegister /><aside role="status" style={{background:"#ffcf64",color:"#151e25",padding:"12px 20px",fontSize:14,fontWeight:700,textAlign:"center"}}>CLIENT REVIEW DEMO — Requests, driver offers, subscriptions, payments and changes are paused. GBP pricing requires approved commercial rates. <a href="/demo" style={{textDecoration:"underline"}}>View demo panels</a></aside>{children}</body></html>;
}