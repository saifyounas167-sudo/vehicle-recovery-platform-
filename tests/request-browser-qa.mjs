import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const widths=[320,375,390,430,768,1024,1440],fail=[];
await mkdir("qa-request-screenshots",{recursive:true});
for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 try{
  await page.route("**/api/recovery/postcode?**",route=>{const u=new URL(route.request().url()),raw=u.searchParams.get("postcode");return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(raw?{valid:true,postcode:raw,latitude:51.5,longitude:-0.12}:{postcode:"SW1A 1AA"})})});
  await page.route("**/api/recovery/open-estimate",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({available:false,message:"Price to be confirmed by recovery drivers"})}));
  await page.goto("http://127.0.0.1:3000/recovery/request?pickup=SW1A%201AA&pickupLocation=10%20Downing%20Street&destination=M1%201AA&destinationLocation=Manchester",{waitUntil:"domcontentloaded"});
  await page.locator(".recovery-card").waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(overflow>2)throw Error("horizontal overflow "+overflow+"px");
  if(!await page.getByRole("heading",{name:"Request Recovery"}).isVisible())throw Error("heading not visible");
  await page.screenshot({path:`qa-request-screenshots/request-step1-${width}.png`,fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:/Continue/}).click();
  await page.getByRole("heading",{name:/Tell us about your vehicle/}).waitFor();
  await page.screenshot({path:`qa-request-screenshots/request-step2-${width}.png`,fullPage:true,animations:"disabled"});
  if(errors.length)throw Error("browser errors: "+errors.join("; "));
  console.log("PASS width "+width+" step 1-2");
 }catch(e){fail.push(width+": "+e.message);console.error("FAIL "+width,e.message)}
 await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
try{
 await page.route("**/api/recovery/postcode?**",route=>{const u=new URL(route.request().url());return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({valid:true,postcode:u.searchParams.get("postcode")})})});
 await page.route("**/api/recovery/open-estimate",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({available:false,message:"Driver prices not available in preview"})}));
 await page.goto("http://127.0.0.1:3000/recovery/request?pickup=SW1A%201AA&pickupLocation=10%20Downing%20Street&destination=M1%201AA&destinationLocation=Manchester",{waitUntil:"domcontentloaded"});
 await page.getByRole("button",{name:/Continue/}).click();
 await page.getByLabel(/Vehicle make/).fill("Ford");await page.getByLabel(/Vehicle model/).fill("Focus");
 await page.getByLabel(/Vehicle type/).selectOption("Car");await page.getByLabel(/Transmission/).selectOption("Manual");
 await page.getByLabel(/Is the vehicle running/).selectOption("Running");
 await page.getByLabel(/Can the vehicle roll/).selectOption("Yes");await page.getByLabel(/Involved in an accident/).selectOption("No");
 await page.getByRole("button",{name:/Continue/}).click();
 await page.screenshot({path:"qa-request-screenshots/request-step3-390.png",fullPage:true,animations:"disabled"});
 await page.getByRole("button",{name:/Emergency & Roadside/}).click();
 await page.getByRole("button",{name:"Breakdown Recovery"}).click();
 await page.getByRole("button",{name:/Continue/}).click();
 await page.screenshot({path:"qa-request-screenshots/request-step4-390.png",fullPage:true,animations:"disabled"});
 await page.getByLabel(/Full name/).fill("Test Customer");
 await page.getByLabel(/UK mobile number/).fill("07123456789");
 await page.getByLabel(/Email address/).fill("demo@example.test");
 await page.getByRole("button",{name:/Continue/}).click();
 await page.getByRole("heading",{name:/Review your recovery request/}).waitFor();
 await page.screenshot({path:"qa-request-screenshots/request-step5-390.png",fullPage:true,animations:"disabled"});
 if(!await page.getByRole("button",{name:/REQUEST SUBMISSION PAUSED/}).isDisabled())throw Error("demo submission not blocked");
 await page.getByRole("button",{name:"Edit vehicle"}).click();
 await page.getByRole("heading",{name:/Tell us about your vehicle/}).waitFor();
 if(await page.getByLabel(/Vehicle make/).inputValue()!=="Ford")throw Error("back navigation lost vehicle");
 console.log("PASS five-step mock journey, review editing, read-only guard");
}catch(e){fail.push("journey: "+e.message);console.error("FAIL journey",e.message)}
await context.close();await browser.close();
if(fail.length){console.error(fail.join("\n"));process.exitCode=1}
