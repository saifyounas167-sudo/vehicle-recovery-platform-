import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const read=p=>readFileSync(p,"utf8");
test("Public header safely skips Supabase initialization if Preview build config missing",()=>{
 const nav=read("app/components/account-navigation.tsx");
 assert.match(nav,/hasBrowserSupabaseConfig\(\)/);
 assert.ok(nav.indexOf("if(!hasBrowserSupabaseConfig())")<nav.indexOf("const supabase=createClient()"));
});
test("Preview build check reports missing NAMES only and fails closed",()=>{
 const run=spawnSync(process.execPath,["scripts/validate-public-env.mjs"],{env:{PATH:process.env.PATH,VERCEL_ENV:"preview"},encoding:"utf8"});
 assert.notEqual(run.status,0);
 assert.match(run.stderr,/NEXT_PUBLIC_SUPABASE_URL/);
 assert.match(run.stderr,/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
 assert.doesNotMatch(run.stderr,/sk_live_|eyJ/);
});
test("Local build does not require connected Supabase",()=>{
 const run=spawnSync(process.execPath,["scripts/validate-public-env.mjs"],{env:{PATH:process.env.PATH},encoding:"utf8"});
 assert.equal(run.status,0);
});
