import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("Verified Driver missing profile resumes application, existing wrong roles still blocked",()=>{
 const login=read("app/login/login-form.tsx");
 assert.match(login,/role==="driver"&&!profile&&Boolean\(data\.user\.email_confirmed_at\)/);
 assert.match(login,/window\.location\.assign\("\/driver\/register"\)/);
 assert.match(login,/if\(!profile\|\|profile\.role!==role\)/);
 assert.match(login,/window\.location\.assign\("\/403"\)/);
});
test("Preview cannot submit, is explicitly exited, or overwrite real registration draft",()=>{
 const page=read("app/driver/register/page.tsx");
 assert.match(page,/if\(designPreview\|\|inFlight\.current\|\|saved\)return/);
 assert.match(page,/disabled=\{designPreview\|\|busy\|\|!agree\}/);
 assert.match(page,/if\(!hydrated\|\|saved\|\|designPreview\)return/);
 assert.match(page,/Exit Design Preview/);
 assert.match(page,/setDesignPreview\(v=>!v\)/);
 assert.match(page,/sessionStorage\.setItem\(DRAFT_KEY,value\)/);
 assert.doesNotMatch(page,/JSON\.stringify\(\{[^}]*password/);
});
test("Driver submit remains verified-email and pending/offline, Admin inbox unchanged",()=>{
 const apply=read("app/api/driver/apply/route.ts"),admin=read("app/api/admin/drivers/route.ts");
 assert.match(apply,/if\(!user\.email_confirmed_at\)/);
 assert.match(apply,/approval_status:"pending"/);
 assert.match(apply,/availability:"offline"/);
 assert.match(admin,/profile\?\.role!=="admin"/);
 assert.match(admin,/driver_profiles/);
});
