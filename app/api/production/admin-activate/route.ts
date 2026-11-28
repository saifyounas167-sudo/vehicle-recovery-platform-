import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serverDb } from "@/src/lib/guest-access";
import {
  isPinnedProductionAdmin,
  isProductionAdminActivationEnabled,
  PRODUCTION_ADMIN_EMAIL,
} from "@/src/lib/production-admin-activation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const fail = (message: string, status: number) =>
  NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function POST(request: Request) {
  if (!isProductionAdminActivationEnabled()) return fail("Unavailable", 404);

  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return fail("Invalid request origin", 403);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > 1024) return fail("Request too large", 413);

  try {
    // Verify the signed-in identity with Supabase Auth before reading the token
    // or invoking the server-only service-role client.
    const auth = await createClient();
    const {
      data: { user },
      error: authError,
    } = await auth.auth.getUser();

    if (authError || !isPinnedProductionAdmin(user)) {
      return fail("Not authorized", 403);
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 1024) {
      return fail("Request too large", 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return fail("Invalid request", 400);
    }

    const setupToken =
      body && typeof body === "object" && "setupToken" in body
        ? (body as { setupToken?: unknown }).setupToken
        : undefined;

    if (
      typeof setupToken !== "string" ||
      setupToken.length < 43 ||
      setupToken.length > 256
    ) {
      return fail("Invalid setup authorization", 403);
    }

    const expectedHex = process.env.PRODUCTION_ADMIN_SETUP_TOKEN_SHA256;
    if (!expectedHex || !/^[a-f0-9]{64}$/i.test(expectedHex)) {
      return fail("Setup not configured", 503);
    }

    const suppliedDigest = createHash("sha256")
      .update(setupToken, "utf8")
      .digest();
    const expectedDigest = Buffer.from(expectedHex, "hex");

    if (!timingSafeEqual(suppliedDigest, expectedDigest)) {
      return fail("Activation unavailable or already used", 409);
    }

    // The database independently pins the Auth UUID + email, checks email
    // confirmation and the existing Customer role, rejects any existing Admin,
    // and consumes its singleton activation row atomically with the role change.
    const { data, error } = await serverDb().rpc(
      "activate_initial_production_admin",
      {
        p_user_id: user.id,
        p_email: PRODUCTION_ADMIN_EMAIL,
      },
    );

    if (error || data !== true) {
      return fail("Activation unavailable or already used", 409);
    }

    return NextResponse.json(
      { activated: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // Never log tokens, hashes, Auth records, service keys or raw provider errors.
    return fail("Activation unavailable", 503);
  }
}
