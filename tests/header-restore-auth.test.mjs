import test from "node:test";import assert from "node:assert/strict";import{readFileSync}from"node:fs";
const header=readFileSync("app/components/public-header.tsx","utf8"),mobile=readFileSync("app/components/public-mobile-menu.tsx","utf8"),nav=readFileSync("app/components/account-navigation.tsx","utf8");
test("original desktop header login controls and order preserved",()=>{
 const names=["Customer Login","GET STARTED","Business Login","Driver Login","Admin Login"];
 let i=-1;for(const name of names){const j=header.indexOf(name);assert.ok(j>i,name);i=j;}
 assert.match(header,/InstallAppButton className="header-install"/);
 assert.match(header,/AccountNavigation/);
});
test("original mobile links remain visible beside compact signed-in account dropdown",()=>{
 for(const role of ["customer","business","driver","admin"])assert.ok(mobile.includes('/login?role='+role));
 assert.match(header,/<PublicMobileMenu open={open} onClose={close}\/>/);
 assert.match(mobile,/AccountNavigation mobile onNavigate={onClose}/);
 assert.match(nav,/if\(!ready\|\|!signedIn\)return null/);
 assert.match(nav,/<details className=/);
});
test("secure session switch and logout preserved",()=>{
 assert.match(nav,/Switch Google Account/);
 assert.match(nav,/signOut\(\{scope:"local"\}\)/);
 assert.match(nav,/My Dashboard/);
});
