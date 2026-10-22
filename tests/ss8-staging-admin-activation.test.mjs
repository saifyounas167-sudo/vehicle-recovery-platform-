import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const api=readFileSync("app/api/staging/admin-activate/route.ts","utf8");
test("Admin activation pinned to Preview, Staging project and verified user UUID",()=>{
 for(const x of ["VERCEL_ENV","VERCEL_GIT_COMMIT_REF","STAGING_ADMIN_ACTIVATION_ENABLED","STAGING_ADMIN_USER_ID","STAGING_ADMIN_SETUP_TOKEN_SHA256","ozphvosiqbzvkthlppkd","eosrparfgrycdnykekcn","user.email_confirmed_at","user.id!==pinnedId","profile?.role!==\"customer\""])assert.ok(api.includes(x),x);
});
test("Admin activation is password-authorized, service-side, atomic RPC-only and no trigger bypass",()=>{
 assert.match(api,/timingSafeEqual/);assert.match(api,/createHash/);
 assert.match(api,/origin!==new URL\(req.url\).origin/);
 assert.match(api,/serverDb\(\)\.rpc\("activate_single_staging_admin"/);
 assert.doesNotMatch(api,/\.from\("profiles"\)\.update\(|\.auth\.admin\.updateUserById|disable trigger|ALTER TABLE|DROP TRIGGER/i);
 const form=readFileSync("app/staging/admin-activate/page.tsx","utf8");
 assert.match(form,/type="password"/);
 assert.doesNotMatch(form,/localStorage|sessionStorage/);
});
