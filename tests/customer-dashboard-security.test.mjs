import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(p,"utf8");
test("customer dashboard and account remain protected with server-side role guard",()=>{
 for(const file of ["app/customer/page.tsx","app/customer/account/page.tsx"]){
  const s=source(file);
  assert.match(s,/await requireRole\("customer"\)/);
  assert.match(s,/await createClient\(\)/);
 }
});
test("customer-only data queries and no fake items",()=>{
 const s=source("app/customer/page.tsx");
 assert.match(s,/\.eq\("customer_id",user\.id\)/);
 assert.match(s,/\.in\("job_id",ids\)/);
 assert.match(s,/jobsError/);
 assert.match(s,/offersError/);
 assert.doesNotMatch(s,/fake|mockJobs|demoJobs|sampleOffers/);
});
test("read-only statuses and features disabled",()=>{
 const s=source("app/customer/page.tsx");
 assert.match(s,/Offers temporarily paused/);
 assert.match(s,/Live tracking unavailable/);
 assert.match(s,/Active Bookings/);
 assert.match(s,/Booking History/);
 assert.doesNotMatch(s,/accept-offer|signInWithOAuth|stripe/);
});
test("new customer routes do not weaken other dashboards, signup, or marketplace",()=>{
 const shell=source("app/customer/customer-frame.tsx");
 assert.match(shell,/CustomerLogout/);
 assert.match(shell,/Get Recovery Quote/);
 for(const role of ["driver","admin"]){
  assert.match(source("app/"+role+"/page.tsx"),new RegExp('requireRole\\("'+role+'"\\)'));
 }
 assert.match(source("proxy.ts"),/if\(!allowedGet&&!allowedEstimate\)/);
 assert.match(source("app/login/customer-signup.tsx"),/auth\.signUp/);
 assert.match(source("src/lib/google-oauth-gate.ts"),/ENABLE_GOOGLE_OAUTH_PRODUCTION/);
});
test("mobile shell includes app navigation and original public header unchanged",()=>{
 const css=source("app/customer/customer-dashboard.css");
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/customer-mobile-bottom/);
 assert.match(source("app/customer/customer-frame.tsx"),/aria-label="Customer mobile menu"/);
});
