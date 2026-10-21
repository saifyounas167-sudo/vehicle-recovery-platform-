import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const menu=read("app/components/public-mobile-menu.tsx"),header=read("app/components/public-header.tsx"),auth=read("lib/auth.ts");
test("approved mobile menu order and no duplicated Business Login",()=>{
 const items=['label:"Home"','label:"Get Recovery Quote"','label:"Services"','label:"How It Works"','<span>For Drivers</span>','link("About"','ACCOUNT ACCESS','link("Customer Login"','link("Driver Login"','link("Admin Login"','Dashboard Preview Mode','Create Customer Account'];
 let previous=-1;for(const label of items){const at=menu.indexOf(label);assert.ok(at>previous,label);previous=at;}
 assert.doesNotMatch(menu,/Business Login|Login \/ Sign Up/);
 assert.doesNotMatch(header,/>Business Login</);
});
test("role-specific links, public pricing, protected membership",()=>{
 for(const role of ["customer","driver","admin"])assert.ok(menu.includes('/login?role='+role));
 assert.match(menu,/Driver Registration/);assert.match(menu,/\/driver\/pricing/);
 assert.match(read("app/driver/pricing/page.tsx"),/Billing and subscriptions are currently disabled/);
 assert.match(read("app/driver/membership/page.tsx"),/requireRole\("driver"\)/);
 assert.match(auth,/reason=auth&role=/);assert.match(auth,/redirect\("\/403"\)/);
});
test("PWA, customer signup, preview isolation, mobile accessibility",()=>{
 assert.match(header,/InstallAppButton/);
 assert.match(menu,/\/login\?role=customer&mode=signup/);
 assert.match(menu,/isDashboardPreviewEnabled/);
 assert.doesNotMatch(menu,/AccountNavigation/);
 assert.match(menu,/Escape/);assert.match(menu,/e.key==="Tab"/);
 assert.match(menu,/previous.current\?\.focus/);
 assert.match(read("app/preview/layout.tsx"),/notFound/);
});
