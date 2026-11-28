import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isPinnedProductionAdmin,
  isProductionAdminActivationEnabled,
} from "@/src/lib/production-admin-activation";
import ProductionAdminActivationForm from "./activation-form";

export const dynamic = "force-dynamic";

export default async function ProductionAdminActivationPage() {
  if (!isProductionAdminActivationEnabled()) notFound();

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">UK Recovery · Production account setup</p>
          <h1>Sign in first</h1>
          <p>
            Sign in with the existing customer account, verify its email, then
            return to this page. This page does not create an account.
          </p>
          <Link className="button primary" href="/login?role=customer">
            Customer Login
          </Link>
        </section>
      </main>
    );
  }

  if (!isPinnedProductionAdmin(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">UK Recovery · Production account setup</p>
          <h1>Activation not available</h1>
          <p>
            This one-time setup is restricted to the pre-authorized,
            email-verified Production account.
          </p>
          <Link href="/login?role=customer">Return to Customer Login</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">UK Recovery · Production only</p>
        <h1>One-time Admin activation</h1>
        <p>
          This setup can only activate the pre-authorized account, and only
          while the database confirms that no Admin account already exists.
          It cannot create users or activate another email address.
        </p>
        <ProductionAdminActivationForm />
        <p className="premium-login-safety">
          Never share the one-time setup token. It is not stored in this
          browser.
        </p>
      </section>
    </main>
  );
}
