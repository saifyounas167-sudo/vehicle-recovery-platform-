import {chromium} from "playwright";
import assert from "node:assert/strict";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const base="http://127.0.0.1:3000";
const errors=[];
for(const width of [320,375,390,430,768,1024,1440]){
 const context=await browser.newContext({viewport:{width,height:850}});
 const page=await context.newPage();
 try{
  const response=await page.goto(base+"/driver/register",{waitUntil:"domcontentloaded"});
  assert.equal(response?.status(),200);
  await page.getByRole("heading",{name:"Join as a Recovery Driver"}).waitFor();
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,"SS8 registration horizontal overflow: "+overflow+"px");
  await page.getByLabel("Full Name").fill("QA Driver");
  await page.getByLabel("Email Address").fill("driver-qa@example.invalid");
  await page.getByLabel("Phone Number").fill("07123456789");
  await page.getByLabel("Vehicle Type",{exact:true}).selectOption("Flatbed");
  await page.getByLabel("Company Name (optional)").fill("QA Recovery");
  await page.getByLabel("Password").fill("TestPassword123!");
  await page.getByRole("button",{name:"Continue →"}).click();
  await page.getByRole("heading",{name:"Recovery business details"}).waitFor();
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,"SS8 company screen horizontal overflow: "+overflow+"px");
  console.log("PASS SS8 registration steps and viewport",width);
 }catch(error){errors.push(width+": "+error.message)}
 await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:840}});
const page=await context.newPage();let signupCalls=0;
try{
 page.on("request",r=>{if(r.url().includes("/auth/v1/signup"))signupCalls++});
 await page.goto(base+"/driver/register");
 await page.getByLabel("Full Name").fill("QA Driver");
 await page.getByLabel("Email Address").fill("driver-qa@example.invalid");
 await page.getByLabel("Phone Number").fill("07123456789");
 await page.getByLabel("Vehicle Type",{exact:true}).selectOption("Flatbed");
 await page.getByLabel("Password").fill("TestPassword123!");
 await page.getByRole("button",{name:"Continue →"}).click();
 await page.getByLabel("Recovery truck type").selectOption("Flatbed");
 await page.getByText("Services you provide").waitFor();
 await page.locator("fieldset").first().locator('input[type="checkbox"]').first().check();
 await page.locator("fieldset").nth(1).locator('input[type="checkbox"]').first().check();
 await page.getByRole("button",{name:"Continue →"}).click();
 await page.getByRole("heading",{name:"Coverage & verification"}).waitFor();
 await page.getByLabel("UK coverage postcode").fill("M1 1AA");
 await page.getByRole("button",{name:"Submit for Admin Review"}).click();
 await page.getByText("Driver registration is paused during client review.",{exact:false}).waitFor();
 assert.equal(signupCalls,0,"Production-style client review attempted a real Supabase signup");
 console.log("PASS no signup/auth write while review guard enabled");
}catch(error){errors.push("review safety: "+error.message)}
await context.close();await browser.close();
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}
