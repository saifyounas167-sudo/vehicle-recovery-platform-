import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=path=>readFileSync(path,"utf8");
test("Driver signup requires staging and keeps role assignment server-side",()=>{
 const form=src("app/driver/register/page.tsx");
 const apply=src("app/api/driver/apply/route.ts");
 assert.ok(form.indexOf('fetch("/api/client-review-status"')<form.indexOf("supabase.auth.signUp"));
 assert.match(form,/registration_flow:"driver_application_v1"/);
 assert.match(form,/Pending Admin Approval/);
 assert.match(apply,/existing&&existing.role!=="driver"/);
 assert.match(apply,/role:"driver"/);
 assert.match(apply,/approval_status:"pending"/);
 assert.match(apply,/eq\("approval_status",current.approval_status\)/);
});
test("Approval and membership and staging gate job feed",()=>{
 const page=src("app/driver/page.tsx"),job=src("app/driver/jobs/[id]/page.tsx");
 assert.match(page,/requireRole\("driver"\)/);
 assert.match(page,/approved && subscribed && marketplaceOpen/);
 assert.match(page,/canSeeJobs\?await/);
 assert.match(page,/canSeeJobs \?/);
 assert.match(job,/membership\?\.status!=="active"/);
 assert.match(job,/isClientReviewDemo\(\)&&!isIsolatedMarketplaceStaging\(\)/);
 assert.match(src("app/api/driver/offers/route.ts"),/membership\?\.status!=="active"/);
});
test("Admin pending inbox is backed by database only and role protected",()=>{
 const page=src("app/admin/page.tsx");
 assert.match(page,/requireRole\("admin"\)/);
 assert.match(page,/select\("id",\{count:"exact",head:true\}\)\.eq\("approval_status","pending"\)/);
 assert.match(page,/Driver Approval Inbox/);
 assert.doesNotMatch(page,/fakeApplications|mockDrivers|sampleApproval/);
});
test("Admin approval validates required documents, capability and current status",()=>{
 const api=src("app/api/admin/drivers/route.ts");
 assert.match(api,/profile\?\.role!=="admin"/);
 assert.match(api,/b.reviewConfirmed!==true/);
 assert.match(api,/\["insurance","driving_licence","business"\]/);
 assert.match(api,/driver.company_name\?\.trim\(\)/);
 assert.match(api,/coverage_latitude==null/);
 assert.match(api,/\.eq\("approval_status",driver.approval_status\)/);
 assert.match(api,/availability:"offline"/);
 assert.match(api,/origin!==new URL\(req.url\).origin/);
});
test("Private documents are never exposed through public paths",()=>{
 const api=src("app/api/driver/documents/route.ts");
 assert.match(api,/driver-verification-private/);
 assert.match(api,/\.eq\("driver_id",user.id\)/);
 assert.match(api,/createSignedUrl\(doc.storage_path,60\)/);
 assert.match(api,/doc.storage_path.startsWith\(user.id\+"\/"\)/);
 assert.match(api,/file.size>5242880/);
 assert.match(api,/isClientReviewDemo\(\)&&!isIsolatedMarketplaceStaging\(\)/);
});
test("Application remains in private staging and production OAuth and offers unchanged",()=>{
 assert.match(src("src/lib/client-review.ts"),/return true/);
 assert.match(src("src/lib/google-oauth-gate.ts"),/GOOGLE_OAUTH_PRODUCTION_APPROVED/);
 assert.match(src("proxy.ts"),/if\(!allowedGet&&!allowedEstimate\)/);
});
