import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("Customer signup function only is replaced; enabled Auth trigger is preserved",()=>{
 const sql=read("supabase/migrations/0015_secure_customer_signup.sql");
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.create_customer_profile_on_signup/);
 assert.doesNotMatch(sql,/^DROP TRIGGER|^CREATE TRIGGER/gm);
 assert.match(sql,/t\.tgname='on_auth_user_created_customer'/);
 assert.match(sql,/t\.tgenabled='O'/);
 assert.match(sql,/registration_flow',''\) <> 'customer_public_v1'/);
 assert.match(sql,/'customer'::public\.user_role/);
});
test("Staging recovery is scoped to exact legacy verified Driver, service role and no Customer jobs",()=>{
 const sql=read("supabase/migrations/0018_staging_verified_driver_role_recovery.sql");
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(sql,/lower\(v_auth\.email\) <> 'mirpurdigitalmarketing@gmail.com'/);
 assert.match(sql,/v_auth\.email_confirmed_at IS NULL/);
 assert.match(sql,/driver_application_v1/);
 assert.match(sql,/public\.recovery_jobs/);
 assert.match(sql,/public\.driver_profiles/);
 assert.match(sql,/WHERE id=p_user_id AND role='customer'/);
 assert.match(sql,/REVOKE ALL/);
});
test("Existing Staging-only API retains Admin guards and proxy supports guarded request",()=>{
 const route=read("app/api/admin/driver-role-recovery/route.ts"),proxy=read("proxy.ts");
 for(const term of ["VERCEL_ENV","VERCEL_GIT_COMMIT_REF","isDriverRegistrationEnabled","reviewConfirmed","profile?.role!==\"admin\"","getUserById"])assert.ok(route.includes(term),term);
 assert.match(proxy,/"\/api\/admin\/driver-role-recovery"/);
 assert.match(proxy,/onboardingWrite/);
 assert.match(proxy,/await isDriverRegistrationEnabled\(\)/);
});
