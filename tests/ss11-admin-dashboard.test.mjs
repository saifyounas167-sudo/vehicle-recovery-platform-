import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";const s=readFileSync("app/admin/page.tsx","utf8"),css=readFileSync("app/admin/admin-dashboard.css","utf8");
test("admin overview server-side role guard and RLS scoped queries",()=>{assert.match(s,/await requireRole\("admin"\)/);assert.match(s,/await createClient\(\)/);assert.match(s,/count:"exact",head:true/);assert.match(s,/\.eq\("approval_status","pending"\)/);assert.match(s,/\.eq\("approval_status","approved"\)\.eq\("availability","available"\)/);});
test("all eight admin navigation items and existing tools",()=>{for(const name of ["Dashboard","Recovery Requests","Users","Drivers","Subscriptions","Reviews","Reports","Settings","Pricing Rules","Driver Approvals"])assert.ok(s.includes(name),name);});
test("no invented revenue or example metrics",()=>{assert.match(s,/Stripe revenue not connected/);assert.match(s,/value="—"/);assert.doesNotMatch(s,/£1,279|125 Total|48 Active|32 Pending|mockDrivers|fakeJobs/);assert.match(s,/r\.error/);assert.match(s,/a\.error/);assert.match(s,/p\.error/);});
test("responsive sidebar and mobile menu",()=>{
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(max-width:430px\)/);
 const narrow=css.split("@media(max-width:430px)")[1];
 assert.ok(narrow,"430px responsive rules exist");
 assert.match(narrow,/\.ss11-stats\{grid-template-columns:1fr(?:;|\})/);
 assert.match(s,/ss11-mobile-menu/);
});
