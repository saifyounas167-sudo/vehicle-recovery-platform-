import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";const read=p=>readFileSync(p,"utf8");
test("SS8 follows four premium stages with password in Account",()=>{const s=read("app/driver/register/page.tsx");for(const term of ["Full Name","Email Address","UK Phone Number","Password","Business & recovery vehicle","Coverage area","Review & submit","DriverDocuments","/api/driver/apply"])assert.ok(s.includes(term),term);assert.match(s,/step===1&&!saved/);assert.match(s,/step===4\?/);});
test("SS8 cannot self-approve or overwrite approved profile",()=>{const s=read("app/api/driver/apply/route.ts");assert.match(s,/current\.approval_status!=="pending"/);assert.match(s,/current\.approval_status!=="rejected"/);assert.match(s,/\.eq\("approval_status",current\.approval_status\)/);assert.match(s,/approval_status:"pending"/);assert.match(s,/!\(await isDriverRegistrationEnabled\(\)\)/)});
test("SS8 keeps private documents and production guard",()=>{const d=read("app/api/driver/documents/route.ts"),g=read("src/lib/client-review.ts");assert.match(d,/driver-verification-private/);assert.match(d,/\["pending","rejected"\]/);assert.match(g,/return true/)});

test("SS8 checks client review before any client-side Auth signup",()=>{const s=read("app/driver/register/page.tsx");assert.ok(s.indexOf('fetch("/api/driver/registration-status"')<s.indexOf("supabase.auth.signUp"));assert.match(s,/review.registrationEnabled!==true/)});

test("Four-step form has show-hide password, small checkboxes and safe pending flow",()=>{
 const s=read("app/driver/register/page.tsx"),css=read("app/driver/register/registration.css");
 assert.match(s,/showPassword\?"text":"password"/);assert.match(s,/ss8-options/);
 assert.match(css,/appearance:auto!important/);assert.match(css,/max-width:430px/);
 assert.match(s,/setSaved\(true\)/);assert.match(s,/Application Submitted Successfully/);
 assert.match(s,/<DriverDocuments\/>/);assert.match(s,/href="\/driver"/);
 assert.doesNotMatch(s,/window\.location\.assign\("\/driver\?application=pending"\)/);
});
