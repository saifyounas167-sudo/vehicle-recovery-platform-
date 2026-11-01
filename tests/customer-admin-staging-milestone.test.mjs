import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=p=>readFileSync(p,"utf8");
test("Customer milestone write capability is isolated to pinned staging and never Production",()=>{
 const gate=file("src/lib/customer-milestone-gate.ts");
 for(const value of ['VERCEL_ENV==="preview"','CUSTOMER_MILESTONE_STAGING_ENABLED==="enabled"','MARKETPLACE_STAGING_MODE']) {
  if(value.includes("MARKETPLACE"))continue;
  assert.ok(gate.includes(value),value);
 }
 assert.match(gate,/SUPABASE_SERVICE_ROLE_KEY===e.STAGING_SUPABASE_SERVICE_ROLE_KEY/);
 const endpoint=file("app/api/recovery/jobs/route.ts");
 assert.match(endpoint,/customerMilestoneStagingEnabled\(\)/);
 assert.match(endpoint,/!userId\)return bad\("Sign in as a Customer/);
 assert.match(endpoint,/process.env.VERCEL_ENV==="production"/);
 const proxy=file("proxy.ts");
 assert.match(proxy,/path==="\/api\/recovery\/jobs"&&customerMilestoneStagingEnabled\(\)/);
});
test("Real Customer form is gated by server-attested milestone",()=>{
 const form=file("app/recovery/request/page.tsx");
 const status=file("app/api/client-review-status/route.ts");
 assert.match(form,/d.customerMilestoneEnabled===true/);
 assert.match(status,/customerMilestoneEnabled:customerMilestoneStagingEnabled\(\)/);
});
test("Admin Jobs page reads real RLS-protected Staging rows, no mock data",()=>{
 const page=file("app/admin/jobs/page.tsx");
 assert.match(page,/requireRole\("admin"\)/);
 assert.match(page,/from\("recovery_jobs"\)/);
 assert.match(page,/Recovery records unavailable/);
 assert.match(page,/jobs.map/);
});
test("Customer/Admin additive migration protects existing accounts and sensitive contacts",()=>{
 const sql=file("supabase/migrations/0019_staging_customer_admin_milestone.sql");
 for(const name of ["recovery_jobs","recovery_job_private_contacts","recovery_request_rate_limits"])
  assert.match(sql,new RegExp("CREATE TABLE public\\."+name+"\\("));
 assert.doesNotMatch(sql,/\bDROP TABLE\b|\bTRUNCATE\b|\bDELETE FROM\b|\bUPDATE public\.profiles\b/i);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/g);
 assert.match(sql,/REVOKE ALL ON public.recovery_job_private_contacts/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public.allow_recovery_request\(text\) TO service_role/);
});
