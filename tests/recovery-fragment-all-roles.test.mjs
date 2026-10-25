import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("dashboard recovery fragment is removed before session work",()=>{
 const s=read("app/recovery-fragment-handler.tsx");
 assert.match(s,/window\.history\.replaceState/);
 assert.ok(s.indexOf("window.history.replaceState")<s.indexOf("client.auth.setSession"));
 assert.match(s,/values\.get\("type"\)==="recovery"/);
 assert.match(s,/values\.get\("access_token"\)/);
 assert.match(s,/values\.get\("refresh_token"\)/);
 assert.doesNotMatch(s,/console\.|localStorage|sessionStorage/);
});
test("reset landing works from homepage with role from verified profile only",()=>{
 const layout=read("app/layout.tsx"),s=read("app/recovery-fragment-handler.tsx");
 assert.match(layout,/<RecoveryFragmentHandler\/>/);
 assert.match(s,/client\.auth\.getUser\(\)/);
 assert.match(s,/from\("profiles"\)\.select\("role"\)/);
 assert.match(s,/\["customer","driver","admin"\]/);
 assert.match(s,/window\.location\.replace\("\/login\?role="\+profile\.role\+"&mode=recovery"\)/);
 assert.doesNotMatch(s,/searchParams\.get\("role"\)/);
});
test("invalid or expired reset links have recovery retry and no privilege escalation",()=>{
 const s=read("app/recovery-fragment-handler.tsx"),confirm=read("app/auth/confirm/route.ts"),login=read("app/login/login-form.tsx");
 assert.match(s,/reason=expired_link/);
 assert.match(confirm,/verifyOtp\(/);
 assert.match(confirm,/exchangeCodeForSession\(/);
 assert.match(login,/Request a fresh password reset email/);
 assert.match(login,/auth\.updateUser\(\{password\}\)/);
});
