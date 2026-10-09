import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync("app/how-it-works/page.tsx","utf8");
const css=readFileSync("app/how-it-works/how-it-works.css","utf8");
test("customer and driver journeys contain exactly six ordered steps each",()=>{
 const customer=page.match(/const customerSteps=\[([\s\S]*?)\] as const;/)?.[1]||"";
 const driver=page.match(/const driverSteps=\[([\s\S]*?)\] as const;/)?.[1]||"";
 assert.equal([...customer.matchAll(/\{n:"\d\d",icon:/g)].length,6);
 assert.equal([...driver.matchAll(/\{n:"\d\d",icon:/g)].length,6);
 for(const i of ["01","02","03","04","05","06"]){
  assert.ok(customer.includes('n:"'+i+'"'));
  assert.ok(driver.includes('n:"'+i+'"'));
 }
});
test("business model is accurate: customer chooses, direct payment, no guaranteed booking",()=>{
 for(const phrase of [
 "the customer chooses","pay the driver or company directly",
 "not through this website","never automatically",
 "approved","membership","price, ETA","optional message",
 "GPS","pricing rules"
 ])assert.ok(page.toLowerCase().includes(phrase.toLowerCase()),phrase);
 assert.match(page,/online subscription payment integration is planned/);
 assert.match(page,/Client demo only/);
 assert.doesNotMatch(page,/guaranteed arrival|instant booking|auto-assign|automatic cheapest/i);
});
test("all CTA routes exist in app and anchors have targets",()=>{
 assert.match(page,/href="\/recovery\/request"/);
 assert.match(page,/href="\/driver\/register"/);
 assert.match(page,/href="\/"/);
 for(const anchor of ["for-customers","for-drivers","common-questions"])
  assert.ok(page.includes('href="#'+anchor+'"')&&page.includes('id="'+anchor+'"'));
});
test("native FAQs are keyboard accessible and pages contain metadata",()=>{
 assert.match(page,/<details key=\{item\.q\}/);
 assert.match(page,/<summary>/);
 assert.match(page,/export const metadata:Metadata=/);
 assert.match(page,/aria-labelledby="hiw-title"/);
 assert.match(page,/aria-label="Illustrative UK recovery route diagram, not live tracking"/);
});
test("design styles are scoped, responsive, and respect reduced motion",()=>{
 assert.match(css,/\.hiw-hero/);
 assert.match(css,/#ff6600/i);
 assert.match(css,/@media\(max-width:1050px\)/);
 assert.match(css,/@media\(max-width:820px\)/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.hiw a:focus-visible/);
});
test("existing customer wizard remains five-step and real booking disabled",()=>{
 const wizard=readFileSync("app/recovery/request/page.tsx","utf8");
 const proxy=readFileSync("proxy.ts","utf8");
 assert.match(wizard,/const steps=\["Location","Vehicle","Recovery","Customer","Review"\]/);
 assert.match(wizard,/REQUEST SUBMISSION PAUSED/);
 assert.match(proxy,/isClientReviewDemo\(\)/);
});
