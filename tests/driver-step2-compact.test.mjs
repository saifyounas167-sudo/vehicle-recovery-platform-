import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const form=readFileSync("app/driver/register/page.tsx","utf8");
const css=readFileSync("app/driver/register/registration.css","utf8");
test("Step 2 optional details stay controlled, accessible and preserved",()=>{
 assert.match(form,/<details className="ss8-additional">/);
 assert.match(form,/<summary>Additional Details \(Optional\)/);
 for(const f of ["recoveryExperience","companyRegistrationNumber","truckDetails","vehicleRegistration"])assert.ok(form.includes(f));
 assert.match(form,/Business Address <em>Required<\/em>/);
 assert.match(form,/recoveryServices\.map/);
});
test("Compact service grid and Staging preview remain intact",()=>{
 assert.match(css,/\.ss8-step-two \.ss8-options label\{min-height:40px/);
 assert.match(css,/min-width:17px!important/);
 assert.match(css,/@media\(max-width:600px\).*?\.ss8-step-two \.ss8-options\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(form,/Preview All Steps/);
 assert.match(form,/setDesignPreview/);
});
