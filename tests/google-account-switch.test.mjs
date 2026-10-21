import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const form=readFileSync("app/login/login-form.tsx","utf8"),nav=readFileSync("app/components/account-navigation.tsx","utf8");
test("Google selection is explicit and remains behind staging gate",()=>{assert.match(form,/queryParams:\{prompt:"select_account"\}/);assert.match(form,/disabled={!googleEnabled\|\|busy}/);assert.match(form,/signInWithOAuth/);});
test("simplified account menu keeps secure role links and logout",()=>{assert.match(nav,/My Profile/);assert.match(nav,/My Dashboard/);assert.match(nav,/signOut\\(\\{scope:"local"\\}\\)/);assert.doesNotMatch(nav,/Switch Google Account/);assert.doesNotMatch(nav,/Account access pending/);});
