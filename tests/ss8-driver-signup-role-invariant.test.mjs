import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const get=p=>readFileSync(p,"utf8");
test("staging customer trigger guard never gives Driver or Admin roles from metadata",()=>{
 const migration=get("supabase/migrations/0015_secure_customer_signup.sql");
 assert.match(migration,/registration_flow',''\) <> 'customer_public_v1'/);
 assert.match(migration,/VALUES \(NEW\.id, 'customer'::public\.user_role/);
 assert.doesNotMatch(migration,/VALUES \(NEW\.id, 'driver'/);
 assert.match(migration,/IF EXISTS \(SELECT 1 FROM public\.profiles WHERE id = NEW\.id\)/);
});
test("verified Driver application creates role only in server route; stays pending offline",()=>{
 const api=get("app/api/driver/apply/route.ts");
 assert.match(api,/auth\.auth\.getUser\(\)/);
 assert.match(api,/!user\.email_confirmed_at/);
 assert.match(api,/isDriverRegistrationEnabled\(\)/);
 assert.match(api,/existing&&existing\.role!=="driver"/);
 assert.match(api,/role:"driver"/);
 assert.match(api,/approval_status:"pending"/);
 assert.match(api,/availability:"offline"/);
 assert.match(api,/\.eq\("approval_status",current\.approval_status\)/);
});
test("existing Driver recovery remains Admin verified, service-role only and unapplied",()=>{
 const api=get("app/api/admin/driver-role-recovery/route.ts");
 const sql=get("supabase/migrations/0018_staging_verified_driver_role_recovery.sql");
 assert.match(api,/profile\?\.role!=="admin"/);
 assert.match(api,/reviewConfirmed!==true/);
 assert.match(api,/user_metadata\?\.registration_flow!=="driver_application_v1"/);
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(sql,/WHERE id=p_user_id AND role='customer'/);
 assert.match(sql,/REVOKE ALL.*public\.ss8_recover_verified_driver_signup/s);
});
