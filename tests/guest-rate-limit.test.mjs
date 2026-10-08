import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const migration=readFileSync("supabase/migrations/0008_guest_rate_limit_rpc_grants.sql","utf8");
const original=readFileSync("supabase/migrations/0006_guest_rate_limit.sql","utf8");
const route=readFileSync("app/api/recovery/jobs/route.ts","utf8");
test("original RPC signature and schema are unchanged",()=>{
 assert.match(original,/function public\.allow_recovery_request\(p_client_hash text\)/i);
 assert.match(original,/security invoker/i);
 assert.match(route,/\.rpc\("allow_recovery_request",\{p_client_hash:ipHash\}\)/);
});
test("repair grants service role table and identity sequence privileges",()=>{
 assert.match(migration,/grant select, insert on table public\.recovery_request_rate_limits to service_role/i);
 assert.match(migration,/grant usage, select on sequence public\.recovery_request_rate_limits_id_seq to service_role/i);
 assert.match(migration,/grant execute on function public\.allow_recovery_request\(text\) to service_role/i);
 assert.match(migration,/notify pgrst, 'reload schema'/i);
});
test("anonymous access remains revoked and RLS enabled",()=>{
 assert.match(migration,/revoke all on function public\.allow_recovery_request\(text\) from public, anon, authenticated/i);
 assert.match(migration,/revoke all on table public\.recovery_request_rate_limits from anon, authenticated/i);
 assert.match(migration,/enable row level security/i);
});
test("failure remains fail-closed and sanitized",()=>{
 assert.match(route,/if\(limitError\)\{/);
 assert.match(route,/console\.error\("Guest rate-limit RPC failed",\{code:safeCode/);
 assert.match(route,/return bad\("Submission protection unavailable",503\)/);
 assert.doesNotMatch(route,/console\.error\([^\n]*limitError\)/);
});

test("false RPC result is rate limited; null/unknown fails closed",()=>{
 assert.match(route,/if\(permitted===false\)return bad\("Too many recovery requests\. Please try later\.",429\)/);
 assert.match(route,/resultType:typeof permitted/);
 assert.match(route,/return bad\("Submission protection unavailable",503\)/);
});
