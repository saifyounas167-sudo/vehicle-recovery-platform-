import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const proxy=readFileSync("proxy.ts","utf8");
test("public homepage GET and HEAD avoid external Supabase session refresh",()=>{
 assert.match(proxy,/pathname==="\/"&&\(request\.method==="GET"\|\|request\.method==="HEAD"\)/);
 assert.match(proxy,/return NextResponse\.next\(\{request\}\)/);
 assert.ok(proxy.indexOf("pathname===")<proxy.indexOf("if(isClientReviewDemo()"));
});
test("authenticated routes continue to refresh sessions and marketplace writes remain protected",()=>{
 assert.match(proxy,/return updateSession\(request\)/);
 assert.match(proxy,/if\(!allowedGet&&!allowedEstimate\)/);
 assert.match(proxy,/if\(!path\.startsWith\("\/api\/"\) && method!=="GET" && method!=="HEAD"\)/);
 assert.doesNotMatch(proxy,/request\.nextUrl\.pathname==="\/admin"/);
});
