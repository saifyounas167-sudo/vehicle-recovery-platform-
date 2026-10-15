import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const widths=[320,375,390,430,768,1024,1440],failures=[];
await mkdir("qa-estimate-screenshots",{recursive:true});
const url="http://127.0.0.1:3000/recovery/request?service=Accident%20Recovery&pickup=SW1A%201AA&pickupLocation=10%20Downing%20Street&destination=M1%201AA&destinationLocation=Manchester";
async function mock(page,available){
 await page.route("**/api/recovery/postcode?**",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({valid:true,postcode:new URL(route.request().url()).searchParams.get("postcode")})}));
 await page.route("**/api/recovery/open-estimate",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(available?{available:true,estimatedPriceGbp:131,route:{distanceMiles:42},disclaimer:"Mock estimate — not a live quote"}:{available:false,message:"Price to be confirmed by recovery drivers"})}));
 await page.route("**/api/recovery/jobs",()=>{throw Error("Live job submission attempted in browser test")});
}
async function fill(page){
 await page.getByRole("button",{name:/Get Estimate/}).click();
 await page.getByLabel(/Vehicle type/).selectOption("Car");
 await page.getByLabel(/Is the vehicle running/).selectOption("Running");
 await page.getByLabel(/Can the vehicle roll/).selectOption("Yes");
 await page.getByLabel(/How many passengers/).selectOption("0");
 await page.getByLabel(/Involved in an accident/).selectOption("No");
 await page.getByRole("button",{name:/Your Contact Details/}).click();
 await page.getByLabel(/Full name/).fill("Preview Customer");
 await page.getByLabel(/UK mobile number/).fill("07123456789");
 await page.getByRole("button",{name:/Get Estimate/}).click();
 await page.getByRole("heading",{name:"Estimated Price"}).waitFor({timeout:12000});
}
for(const width of widths){
 const ctx=await browser.newContext({viewport:{width,height:844}});const page=await ctx.newPage();
 try{
  await mock(page,true);await page.goto(url,{waitUntil:"domcontentloaded"});
  if(await page.locator(".recovery-demo-progress li.current").count()!==1)throw Error("Incorrect progress markup");
  await page.screenshot({path:`qa-estimate-screenshots/before-details-${width}.png`,fullPage:true,animations:"disabled"});
  await fill(page);
  await page.getByText("£131.00",{exact:true}).waitFor();
  if(!(await page.locator(".recovery-demo-progress li").nth(1).evaluate(el=>el.classList.contains("current"))))throw Error("Estimate not active");
  for(const required of ["42.00 road miles","Accident Recovery","Car"]){if(!(await page.getByText(new RegExp(required)).first().isVisible()))throw Error("Missing summary: "+required)}
  if(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)>2)throw Error("Horizontal overflow");
  if(page.url().includes("07123456789")||page.url().includes("Preview%20Customer"))throw Error("Private URL leak");
  await page.screenshot({path:`qa-estimate-screenshots/estimate-available-mocked-${width}.png`,fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:/Continue/}).click();
  await page.getByText("Driver offers coming soon").waitFor();
  await page.getByRole("button",{name:/Back \/ Edit Details/}).click();
  await page.getByRole("button",{name:/Vehicle Details/}).click();
  if(await page.getByLabel(/Vehicle type/).inputValue()!=="Car")throw Error("Back lost vehicle data");
  await page.goBack();await page.getByRole("heading",{name:"Estimated Price"}).waitFor();
  await page.goForward();await page.getByRole("button",{name:/Get Estimate/}).waitFor();
  console.log("PASS mocked estimate & history",width);
 }catch(e){failures.push(`${width}: ${e.message}`);console.error("FAIL",width,e.message)}
 await ctx.close();
}
const ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage();
try{
 await mock(page,false);await page.goto(url,{waitUntil:"domcontentloaded"});
 await fill(page);
 await page.getByText("Price to be confirmed by recovery drivers.",{exact:true}).waitFor();
 await page.getByRole("button",{name:/Retry estimate/}).click();
 await page.getByText("Price to be confirmed by recovery drivers.",{exact:true}).waitFor();
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:"qa-estimate-screenshots/estimate-unavailable-mocked-390.png",fullPage:true,animations:"disabled"});
 await page.getByRole("button",{name:/Continue/}).click();
 await page.getByText("Driver offers coming soon").waitFor();
 console.log("PASS unavailable/retry/read-only offers");
}catch(e){failures.push("fallback: "+e.message);console.error("FAIL fallback",e.message)}
await ctx.close();await browser.close();
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
