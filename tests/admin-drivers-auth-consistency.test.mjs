import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const route=readFileSync("app/api/admin/drivers/route.ts","utf8");
test("Driver Approvals checks role using authenticated RLS client, not service role",()=>{
 const identity=route.slice(route.indexOf("async function admin()"),route.indexOf("export async function GET()"));
 assert.match(identity,/auth\.auth\.getUser\(\)/);
 assert.match(identity,/await auth\.from\("profiles"\)\.select\("role"\)\.eq\("id",user\.id\)/);
 assert.ok(identity.indexOf('profile?.role!=="admin"') < identity.indexOf('const db=serverDb()'));
 assert.doesNotMatch(identity,/await db\.from\("profiles"\)/);
});
test("Admin role checks and approval guards stay in place",()=>{
 assert.match(route,/if\(!access\)return send\(\{error:"Admin authentication required"\},403\)/);
 assert.match(route,/isDriverRegistrationEnabled\(\)/);
 assert.match(route,/b\.reviewConfirmed!==true/);
 assert.match(route,/origin!==new URL\(req\.url\)\.origin/);
});
