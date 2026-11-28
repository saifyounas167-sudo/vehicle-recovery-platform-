"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProductionAdminActivationForm() {
  const [setupToken, setSetupToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/production/admin-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupToken }),
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Activation unavailable",
        );
      }

      setDone(true);
      setSetupToken("");

      const { error } = await createClient().auth.signOut({ scope: "local" });
      if (!error) {
        window.location.assign("/login?role=admin");
        return;
      }

      setMessage(
        "Admin activated. Sign out manually, then sign in through Admin Login.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Activation unavailable. No account change was confirmed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {done ? (
        <div role="status">
          <p>{message}</p>
          <Link className="button primary" href="/login?role=admin">
            Admin Login
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="premium-login-form">
          <label htmlFor="production-admin-setup-token">
            One-time setup token
          </label>
          <input
            id="production-admin-setup-token"
            type="password"
            autoComplete="off"
            minLength={43}
            maxLength={256}
            required
            value={setupToken}
            onChange={(event) => setSetupToken(event.target.value)}
          />
          <button
            className="premium-login-submit"
            type="submit"
            disabled={busy || setupToken.length < 43}
          >
            {busy ? "Checking…" : "Activate Admin"}
          </button>
        </form>
      )}
      {message && !done && <p role="status">{message}</p>}
    </div>
  );
}
