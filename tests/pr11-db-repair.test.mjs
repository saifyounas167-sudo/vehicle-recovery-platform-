import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const first=readFileSync("supabase/test-seeds/pr11-safe-repair-stage1-membership.sql","utf8");
const second=readFileSync("supabase/test-seeds/pr11-safe-repair-stage2-guest-acceptance.sql","utf8");
test("repair is staged, transactional, and never disables RLS",()=>{
 for(const sql of [first,second]){
  assert.match(sql,/^begin;/m);
  assert.match(sql,/^commit;/m);
  assert.doesNotMatch(sql,/disable row level security|drop table|truncate|delete from|update public\.pricing_rules/i);
 }
 assert.match(first,/driver_memberships enable row level security/);
 assert.match(first,/add column if not exists eta_minutes/);
 assert.match(first,/verified active member creates offer/);
 assert.match(first,/valid_until>now\(\)/);
 assert.match(first,/guard_new_driver_offer_trigger/);
 assert.match(first,/guard_profile_privileges_trigger/);
 assert.match(first,/guard_driver_approval_trigger/);
});
test("both offer-acceptance RPCs require approved active members and job locks",()=>{
 assert.match(first,/accept_customer_offer\(p_offer_id uuid\)/);
 assert.match(first,/where id=target_job_id for update/);
 assert.match(first,/auth\.uid\(\) is null/);
 assert.match(second,/accept_guest_recovery_offer\(p_job_id uuid,p_offer_id uuid\)/);
 assert.match(second,/where id=p_job_id for update/);
 assert.match(second,/dm\.valid_until>now\(\)/);
 assert.match(second,/revoke all on function public\.accept_guest_recovery_offer\(uuid,uuid\) from public,anon,authenticated/);
 assert.match(second,/grant execute on function public\.accept_guest_recovery_offer\(uuid,uuid\) to service_role/);
});
