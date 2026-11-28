import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const helper = read("src/lib/production-admin-activation.ts");
const page = read("app/production/admin-activate/page.tsx");
const form = read("app/production/admin-activate/activation-form.tsx");
const route = read("app/api/production/admin-activate/route.ts");
const proxy = read("proxy.ts");
const migration = read(
  "supabase/migrations/0016_production_initial_admin_activation.sql",
);
const seed = read(
  "supabase/operations/production-initial-admin-seed.template.sql",
);

test("Production activation is disabled by default and pinned to Production main", () => {
  assert.match(helper, /VERCEL_ENV === "production"/);
  assert.match(helper, /VERCEL_GIT_COMMIT_REF === "main"/);
  assert.match(
    helper,
    /https:\/\/eosrparfgrycdnykekcn\.supabase\.co/,
  );
  assert.match(helper, /PRODUCTION_ADMIN_ACTIVATION_ENABLED === "enabled"/);
  assert.match(helper, /saifyounas112@gmail\.com/);
  assert.match(route, /PRODUCTION_ADMIN_SETUP_TOKEN_SHA256/);
});

test("page and API require the exact verified Auth email", () => {
  assert.match(helper, /user\?\.email_confirmed_at/);
  assert.match(page, /supabase\.auth\.getUser\(\)/);
  assert.match(page, /isPinnedProductionAdmin\(user\)/);
  assert.match(route, /auth\.auth\.getUser\(\)/);
  assert.match(route, /isPinnedProductionAdmin\(user\)/);
});

test("token is same-origin, high-entropy, hashed and compared in constant time", () => {
  assert.match(route, /origin !== new URL\(request\.url\)\.origin/);
  assert.match(route, /setupToken\.length < 43/);
  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /timingSafeEqual/);
  assert.match(form, /type="password"/);
  assert.doesNotMatch(form, /localStorage|sessionStorage/);
});

test("API delegates role mutation to the one-time server-side RPC only", () => {
  assert.match(route, /serverDb\(\)\.rpc\(/);
  assert.match(route, /activate_initial_production_admin/);
  assert.doesNotMatch(route, /auth\.admin\.createUser|\.from\(["']profiles["']\)\.update/);
  assert.doesNotMatch(route, /console\.(log|warn|error)/);
});

test("database RPC is service-role-only and independently pins the account", () => {
  assert.match(migration, /auth\.jwt\(\)\s*->>\s*'role'\s*<>\s*'service_role'/);
  assert.match(migration, /auth\.users/);
  assert.match(migration, /email_confirmed_at/);
  assert.match(migration, /saifyounas112@gmail\.com/);
  assert.match(migration, /target_user_id/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /consumed_at IS NULL/);
  assert.match(migration, /existing_admin\.role = 'admin'/);
  assert.match(migration, /v_profile_role IS DISTINCT FROM 'customer'/);
  assert.match(migration, /SECURITY DEFINER/);
  assert.match(migration, /SET search_path = ''/);
  assert.match(migration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.doesNotMatch(migration, /DISABLE TRIGGER|DROP TRIGGER|ALTER TABLE[\s\S]*DISABLE TRIGGER/i);
});

test("seed is a separate explicit allowlist insert and cannot create an Auth user", () => {
  assert.match(seed, /REPLACE_WITH_VERIFIED_AUTH_USER_UUID/);
  assert.match(seed, /saifyounas112@gmail\.com/);
  assert.doesNotMatch(seed, /auth\.admin\.createUser|INSERT INTO auth\.users/i);
});

test("proxy opens only the exact Production activation POST under the shared gate", () => {
  assert.match(proxy, /isProductionAdminActivationEnabled/);
  assert.match(proxy, /\/api\/production\/admin-activate/);
});

test("existing Staging activation and client invitation are not changed by this feature", () => {
  assert.doesNotMatch(route, /roadmate1@outlook\.com/i);
  assert.match(
    read("docs/production-first-admin-activation.md"),
    /PR #56 remains a separate Staging\/Preview draft/,
  );
});
