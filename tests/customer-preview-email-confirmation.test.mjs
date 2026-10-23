import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("signup links point to same-origin confirmation route, not OAuth callback",()=>{
 const signup=read("app/login/customer-signup.tsx");
 const login=read("app/login/login-form.tsx");
 assert.match(signup,/emailRedirectTo:window.location.origin\+"\/auth\/confirm\?type=signup"/);
 assert.match(login,/emailRedirectTo:window.location.origin\+"\/auth\/confirm\?type=signup"/);
 assert.doesNotMatch(signup,/redirectTo:[^\n]*https:\/\//);
});
test("email confirmation consumes single-use code and never redirects to user-provided URL",()=>{
 const src=read("app/auth/confirm/route.ts");
 assert.match(src,/exchangeCodeForSession\(code\)/);
 assert.match(src,/verifyOtp\(/);
 assert.match(src,/profile\?\.role!==\"customer\"/);
 assert.match(src,/new URL\(\"\/customer\",origin\)/);
 assert.doesNotMatch(src,/searchParams\.get\(\"next\"\)|searchParams\.get\(\"redirect\"\)/);
 assert.match(src,/Referrer-Policy/);
});
test("Preview access protection remains separate from application Auth",()=>{
 const signup=read("app/login/customer-signup.tsx");
 assert.match(signup,/protected Preview/);
 assert.doesNotMatch(read("proxy.ts"),/VERCEL_AUTOMATION_BYPASS_SECRET|x-vercel-protection-bypass/);
});

test("driver password reset preserves role and never trusts arbitrary redirect URLs",()=>{
 const login=read("app/login/login-form.tsx");
 const confirm=read("app/auth/confirm/route.ts");
 assert.match(login,/resetPasswordForEmail\(email/);
 assert.match(login,/type=recovery&role=/);
 assert.match(confirm,/requestedRole==="driver"/);
 assert.match(confirm,/kind==="recovery"/);
 assert.match(confirm,/exchangeCodeForSession\(code\)/);
 assert.match(confirm,/verifyOtp\(/);
 assert.match(confirm,/profile\?\.role!==/);
 assert.match(confirm,/Referrer-Policy/);
 assert.doesNotMatch(confirm,/searchParams\.get\("next"\)|searchParams\.get\("redirectTo"\)/);
 assert.match(login,/Request a fresh password reset email/);
});
