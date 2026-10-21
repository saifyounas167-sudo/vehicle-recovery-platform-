import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";const read=p=>readFileSync(p,"utf8");
test("SS8 registration follows simple account → business → coverage journey",()=>{const s=read("app/driver/register/page.tsx");for(const term of ["Full Name","Email Address","Phone Number","Vehicle Type","Company Name","Already have an account?","Recovery business details","Coverage & verification","DriverDocuments","/api/driver/apply"])assert.ok(s.includes(term),term)});
test("SS8 cannot self-approve or overwrite approved profile",()=>{const s=read("app/api/driver/apply/route.ts");assert.match(s,/current\.approval_status!=="pending"/);assert.match(s,/current\.approval_status!=="rejected"/);assert.match(s,/\.eq\("approval_status",current\.approval_status\)/);assert.match(s,/approval_status:"pending"/);assert.match(s,/!isDriverRegistrationEnabled\(\)/)});
test("SS8 keeps private documents and production guard",()=>{const d=read("app/api/driver/documents/route.ts"),g=read("src/lib/client-review.ts");assert.match(d,/driver-verification-private/);assert.match(d,/\["pending","rejected"\]/);assert.match(g,/return true/)});

test("SS8 checks client review before any client-side Auth signup",()=>{const s=read("app/driver/register/page.tsx");assert.ok(s.indexOf('fetch("/api/driver/registration-status"')<s.indexOf("supabase.auth.signUp"));assert.match(s,/review.registrationEnabled!==true/)});

test("Screenshot 8 first screen has exactly five fields, password only on step two",()=>{
 const s=read("app/driver/register/page.tsx");
 const first=s.split('{step===1?<form className="ss8-form" onSubmit={goNext}>')[1]?.split('</form>:step===2?')[0];
 const second=s.split('step===2?<form className="ss8-form" onSubmit={goNext}>')[1]?.split('</form>:step===3?')[0];
 assert.ok(first&&second,"Expected first and second steps");
 const labels=[...first.matchAll(/<label>([^<]+)</g)].map(x=>x[1]);
 assert.deepEqual(labels,["Full Name","Email Address","Phone Number","Vehicle Type","Company Name (optional)"]);
 assert.doesNotMatch(first, /Password|type="password"/);
 assert.match(second,/<label>Password<input type="password"/);
});

test("Driver application stays on document upload step before dashboard",()=>{
 const s=read("app/driver/register/page.tsx");
 assert.match(s,/setSaved\(true\);setStep\(4\)/);
 assert.doesNotMatch(s,/window\.location\.assign\("\/driver\?application=pending"\)/);
 assert.match(s,/Complete private document uploads below/);
 assert.match(s,/<DriverDocuments\/>/);
 assert.match(s,/<Link href="\/driver" className="ss8-primary">Open Driver Dashboard/);
 assert.match(s,/\[1,2,3,4\]\.map/);
});
