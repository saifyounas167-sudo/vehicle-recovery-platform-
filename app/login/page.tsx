import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return <main className="auth-shell"><Suspense fallback={<section className="auth-card"><div className="eyebrow">UK Recovery account</div><h1>Welcome back.</h1><p>Loading secure sign-in…</p></section>}><LoginForm /></Suspense></main>;
}
