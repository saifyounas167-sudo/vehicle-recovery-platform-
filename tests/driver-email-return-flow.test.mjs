import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const r=p=>readFileSync(p,"utf8");
test("driver signup redirects to same-origin registration return, no passwords in persisted draft",()=>{
 const page=r("app/driver/register/page.tsx");
 assert.match(page,/emailRedirectTo:window.location.origin\+"\/driver\/register\?confirm=driver"/);
 assert.match(page,/sessionStorage\.setItem\(DRAFT_KEY,value\)/);
 assert.match(page,/localStorage\.setItem\(DRAFT_KEY,value\)/);
 assert.match(page,/details:draft/);
 assert.doesNotMatch(page,/JSON\.stringify\(\{[^}]*password/);
 assert.match(page,/localStorage\.removeItem\(DRAFT_KEY\)/);
 assert.match(page,/registrationEnabled!==true/);
 assert.match(page,/setSaved\(true\)/);
});
test("driver code and implicit fragment confirmation safely verify identity and role",()=>{
 const page=r("app/driver/register/page.tsx"),handler=r("app/recovery-fragment-handler.tsx");
 assert.match(page,/exchangeCodeForSession\(code\)/);
 assert.match(page,/verifyOtp\(\{token_hash:tokenHash,type:"email"\}\)/);
 assert.match(page,/window\.history\.replaceState/);
 assert.match(handler,/driverSignup/);
 assert.match(handler,/window\.history\.replaceState/);
 assert.match(handler,/client\.auth\.setSession/);
 assert.match(handler,/user\.email_confirmed_at/);
 assert.match(handler,/profile\.role!=="driver"/);
});
test("confirmed drivers without an application may resume and cannot access other roles",()=>{
 const login=r("app/login/login-form.tsx"),confirm=r("app/auth/confirm/route.ts");
 assert.match(login,/user\.user_metadata\?\.registration_flow==="driver_application_v1"/);
 assert.match(login,/window\.location\.assign\("\/driver\/register"\)/);
 assert.match(confirm,/profile\.role==="driver"/);
 assert.match(confirm,/kind==="signup"&&role==="driver"/);
 assert.match(confirm,/role==="driver"\?"\/driver\/register"/);
 const apply=r("app/api/driver/apply/route.ts");
 assert.match(apply,/approval_status:"pending"/);
 assert.match(apply,/availability:"offline"/);
});
