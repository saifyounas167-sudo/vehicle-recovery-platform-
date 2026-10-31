import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("Customer signup still provisions customer without browser role trust",()=>{
 const page=read("app/login/customer-signup.tsx"),migration=read("supabase/migrations/0015_secure_customer_signup.sql");
 assert.match(page,/registration_flow:"customer_public_v1"/);
 assert.match(migration,/registration_flow',''\) <> 'customer_public_v1'/);
 assert.doesNotMatch(migration,/^DROP TRIGGER|^CREATE TRIGGER/gm);
});
test("Driver registration and confirmation do not self-approve",()=>{
 const form=read("app/driver/register/page.tsx"),apply=read("app/api/driver/apply/route.ts");
 assert.match(form,/registration_flow:"driver_application_v1"/);
 assert.match(form,/auth\.signUp/);
 assert.match(apply,/email_confirmed_at/);
 assert.match(apply,/existing&&existing\.role!=="driver"/);
 assert.match(apply,/approval_status:"pending"/);
 assert.match(apply,/availability:"offline"/);
});
test("Admin role recovery cannot be reached by ordinary Customer role or unpinned Production",()=>{
 const proxy=read("proxy.ts"),route=read("app/api/admin/driver-role-recovery/route.ts");
 const recovery=read("supabase/migrations/0018_staging_verified_driver_role_recovery.sql");
 assert.match(proxy,/"\/api\/admin\/driver-role-recovery"/);
 assert.match(proxy,/await isDriverRegistrationEnabled\(\)/);
 assert.match(route,/VERCEL_ENV!=="preview"/);
 assert.match(route,/profile\?\.role!=="admin"/);
 assert.match(route,/reviewConfirmed!==true/);
 assert.match(recovery,/lower\(v_auth\.email\) <> 'mirpurdigitalmarketing@gmail.com'/);
 assert.match(recovery,/auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(recovery,/WHERE id=p_user_id AND role='customer'/);
});
