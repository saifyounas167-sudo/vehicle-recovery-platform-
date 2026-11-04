import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=(path)=>readFileSync(path,"utf8");
test("Customer and Admin server dashboards enforce exact roles",()=>{
  assert.match(source("app/customer/page.tsx"),/requireRole\("customer"\)/);
  assert.match(source("app/admin/jobs/page.tsx"),/requireRole\("admin"\)/);
  const auth=source("lib/auth.ts");
  assert.match(auth,/if\s*\(!user\s*\|\|\s*!profile\)\s*redirect\(/);
  assert.match(auth,/if\s*\(profile\.role\s*!==\s*role\)\s*redirect\("\/403"\)/);
});
test("Login checks Supabase profile role and signs out on mismatch",()=>{
  const login=source("app/login/login-form.tsx");
  assert.match(login,/signInWithPassword/);
  assert.match(login,/from\("profiles"\)\.select\("role"\)/);
  assert.match(login,/!profile\s*\|\|\s*profile\.role\s*!==\s*role/);
  assert.match(login,/signOut\(\{scope:"local"\}\)/);
  assert.match(login,/setError\(!profile/);
});
test("Staging-only Customer API requires customer session; Production writes blocked",()=>{
  const api=source("app/api/recovery/jobs/route.ts");
  const gate=source("src/lib/customer-milestone-gate.ts");
  assert.match(api,/customerMilestoneStagingEnabled\(\)&&!userId/);
  assert.match(api,/profile\?\.role!=="customer"/);
  assert.match(api,/VERCEL_ENV==="production"/);
  assert.match(gate,/VERCEL_GIT_COMMIT_REF==="integration\/staging-recovery-pr56-pr55-pr70"/);
});
test("Rate-limit and contacts remain private; per-customer RLS retained",()=>{
  const m=source("supabase/migrations/0019_staging_customer_admin_milestone.sql");
  const fix=source("supabase/migrations/0020_staging_rate_limit_rpc_permissions.sql");
  assert.match(m,/ALTER TABLE public\.recovery_jobs ENABLE ROW LEVEL SECURITY/);
  assert.match(m,/customer_id=auth\.uid\(\)/);
  assert.match(m,/p\.role='admin'/);
  assert.match(m,/ALTER TABLE public\.recovery_job_private_contacts ENABLE ROW LEVEL SECURITY/);
  assert.match(m,/ALTER TABLE public\.recovery_request_rate_limits ENABLE ROW LEVEL SECURITY/);
  assert.match(fix,/GRANT SELECT, INSERT ON TABLE public\.recovery_request_rate_limits TO service_role/);
  assert.match(fix,/REVOKE ALL ON TABLE public\.recovery_request_rate_limits FROM anon, authenticated/);
  assert.doesNotMatch(fix,/DISABLE ROW LEVEL SECURITY/i);
});
test("Customer dashboard sections and mobile wayfinding contract",()=>{
  const frame=source("app/customer/customer-frame.tsx");
  const page=source("app/customer/page.tsx");
  for(const key of ["requests","offers","bookings","tracking","history","quote","account"]){
    assert.match(frame,new RegExp('key:"'+key+'"'));
  }
  for(const id of ["requests","offers","bookings","tracking","history"]){
    assert.ok(page.includes('id="'+id+'"'),id);
  }
  for(const text of ["Home","Requests","Track","Account"]){
    assert.ok(frame.includes('name:"'+text+'"'),text);
  }
});
