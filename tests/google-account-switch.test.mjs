import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const form=readFileSync("app/login/login-form.tsx","utf8"),nav=readFileSync("app/components/account-navigation.tsx","utf8");
test("Google selection is explicit and remains behind staging gate",()=>{assert.match(form,/queryParams:\{prompt:"select_account"\}/);assert.match(form,/disabled={!googleEnabled\|\|busy}/);assert.match(form,/signInWithOAuth/);});
test("switch account and logout clear local session",()=>{assert.match(nav,/Switch Google Account/);assert.match(nav,/Account \/ Profile/);assert.match(nav,/My Dashboard/);assert.match(nav,/signOut\(\{scope:"local"\}\)/);assert.match(nav,/switch=1/);});
