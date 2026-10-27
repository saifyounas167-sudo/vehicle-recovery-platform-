import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(p,"utf8");
test("admin links absent from public navigation and homepage",()=>{
 for(const path of ["app/components/public-header.tsx","app/page.tsx","app/components/account-navigation.tsx"]){
  const content=read(path);assert.doesNotMatch(content,/href="\/login\?role=admin"/,path);
 }
 const nav=read("app/components/account-navigation.tsx");
 assert.match(nav,/role==="admin"&&!allowAdmin/);
});
test("private admin entry remains role-checked with logout",()=>{
 const auth=read("lib/auth.ts"),admin=read("app/admin/page.tsx"),nav=read("app/components/account-navigation.tsx");
 assert.match(auth,/role === "admin" \? "\/login\?role=admin&reason=auth"/);
 assert.match(admin,/await requireRole\("admin"\)/);
 assert.match(admin,/<AccountNavigation allowAdmin\/>/);
 assert.match(nav,/signOut\(\{scope:"local"\}\)/);
});
