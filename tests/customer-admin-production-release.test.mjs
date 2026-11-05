import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("Production Customer milestone defaults closed and pins Production Supabase",()=>{
 const g=read("src/lib/customer-production-gate.ts");
 assert.match(g,/VERCEL_ENV==="production"/);
 assert.match(g,/CUSTOMER_ADMIN_PRODUCTION_ENABLED==="enabled"/);
 assert.match(g,/eosrparfgrycdnykekcn\.supabase\.co/);
 assert.match(g,/SUPABASE_SERVICE_ROLE_KEY===e\.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY/);
 assert.doesNotMatch(g,/ozphvosiqbzvkthlppkd/);
});
test("Only Customer recovery requests bypass demo API guard, with session and role enforcement",()=>{
 const p=read("proxy.ts"),r=read("app/api/recovery/jobs/route.ts");
 assert.match(p,/method==="POST"&&path==="\/api\/recovery\/jobs"&&customerMilestoneProductionEnabled\(\)/);
 assert.match(p,/if\(!allowedGet&&!allowedEstimate\)/);
 assert.match(r,/customerMilestoneProductionEnabled\(\)&&!userId/);
 assert.match(r,/profile\?\.role!=="customer"/);
 assert.match(r,/allow_recovery_request/);
});
test("Submission UI only opens with attested status and Admin jobs retain RLS guard",()=>{
 const ui=read("app/recovery/request/page.tsx"),s=read("app/api/client-review-status/route.ts"),a=read("app/admin/jobs/page.tsx");
 assert.match(ui,/d\.customerProductionEnabled===true/);
 assert.match(s,/customerProductionEnabled:customerMilestoneProductionEnabled\(\)/);
 assert.match(a,/requireRole\("admin"\)/);
 assert.match(a,/from\("recovery_jobs"\)/);
});
test("Production migration grants exact service-role permissions without RLS or public grants",()=>{
 const sql=read("supabase/migrations/production_customer_admin_service_role_insert_APPROVAL_REQUIRED.sql");
 assert.match(sql,/GRANT SELECT, INSERT, DELETE ON TABLE public\.recovery_jobs TO service_role/);
 assert.match(sql,/GRANT INSERT ON TABLE public\.recovery_job_private_contacts TO service_role/);
 assert.doesNotMatch(sql,/GRANT (?:SELECT|DELETE)[^;]*public\.recovery_job_private_contacts TO service_role/i);
 assert.match(sql,/BEGIN;/);
 assert.match(sql,/DO \$verify\$/);
 assert.match(sql,/COMMIT;/);
 assert.doesNotMatch(sql,/DISABLE ROW LEVEL SECURITY|GRANT .* TO authenticated|GRANT .* TO anon|UPDATE |DELETE FROM/i);
});
