import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const f=p=>readFileSync(p,"utf8");
test("server allowlist permits only approved pages and read-only postcode lookup",()=>{
 const s=f("proxy.ts");for(const x of ['"/"','"/how-it-works"','"/about"','"/api/recovery/postcode"','"/api/recovery/location-suggest"'])assert.ok(s.includes(x),x);
 assert.ok(s.includes('method!=="GET"&&method!=="HEAD"'));
 assert.ok(s.includes("status:404"));
 assert.doesNotMatch(s,/updateSession\(/);
});
test("frozen branch uses approved pages and disabled submission",()=>{
 const page=f("app/page.tsx"),header=f("app/components/public-header.tsx");
 assert.ok(page.includes("setPreviewNotice(true)"));
 assert.ok(page.includes("quote")==false||page.includes("quote"));
 assert.ok(header.includes('"/?quote=1"'));
 assert.doesNotMatch(header,/href="\/login/);
});
test("unapproved links are intercepted before routing",()=>{const guard=f("app/components/preview-link-guard.tsx");assert.ok(guard.includes('document.addEventListener("click",intercept,true)'));assert.ok(guard.includes("event.preventDefault()"))});
