import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const widths=[320,375,390,430,768,1024,1440];
const errors=[];await mkdir("qa-request-screenshots",{recursive:true});
async function assertNoOverflow(page,stage,width){const amount=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(amount>2)throw Error(stage+" "+width+"px: horizontal overflow "+amount+"px")}

async function mockSafeApi(page){
 await page.route("**/api/recovery/postcode?**",route=>{
  const u=new URL(route.request().url()),pc=u.searchParams.get("postcode")||"SW1A 1AA";
  return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({valid:true,postcode:pc})});
 });
 await page.route("**/api/recovery/open-estimate",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({available:false,message:"Price to be confirmed by recovery drivers"})}));
 await page.route("**/api/recovery/jobs",route=>{throw Error("Forbidden job submission attempt")});
}
const target="http://127.0.0.1:3000/recovery/request?pickup=SW1A%201AA&pickupLocation=10%20Downing%20Street&destination=M1%201AA&destinationLocation=Manchester";
for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:844}});
 const page=await context.newPage();const js=[];
 page.on("pageerror",err=>js.push(err.message));
 try{
  await mockSafeApi(page);
  await page.goto(target,{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"Request Recovery"}).waitFor();
  const labels=await page.locator(".recovery-demo-progress li").allTextContents();
  if(labels.map(x=>x.replace(/\d/g,"").trim()).join("|")!=="Details|Estimate|Offers|Choose")throw Error("Wrong client-stage labels: "+labels);
  const over=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  if(over>2)throw Error("Horizontal overflow "+over);
  for(const title of ["Vehicle Details","What's the issue?","Your Contact Details"]){
   if(await page.getByRole("button",{name:new RegExp(title.replace(/[?]/g,"."))}).count()!==1)throw Error("Missing collapsible "+title);
  }
  if(!(await page.getByRole("button",{name:/Get Estimate/}).isVisible()))throw Error("No Get Estimate action");
  await page.screenshot({path:`qa-request-screenshots/details-${width}.png`,fullPage:true,animations:"disabled"});
  if(js.length)throw Error("JS errors "+js.join("; "));
  console.log("PASS details viewport "+width);
 }catch(e){errors.push("viewport "+width+": "+e.message);console.error("FAIL viewport "+width,e.message)}
 await context.close();
}
for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage();
 try{
  await mockSafeApi(page);await page.goto(target,{waitUntil:"domcontentloaded"});
  await page.getByRole("button",{name:/Get Estimate/}).click();
  await page.getByRole("button",{name:/Vehicle Details/}).waitFor();
  if(!(await page.getByRole("button",{name:/Vehicle Details/}).getAttribute("aria-expanded")==="true"))throw Error("Required vehicle card not expanded");
  await page.getByLabel(/Vehicle make/).fill("Ford");
  await page.getByLabel(/Vehicle model/).fill("Focus");
  await page.getByLabel(/Vehicle type/).selectOption("Car");
  await page.getByLabel(/Transmission/).selectOption("Manual");
  await page.getByLabel(/Is the vehicle running/).selectOption("Running");
  await page.getByLabel(/Can the vehicle roll/).selectOption("No");
  await page.getByLabel(/How many passengers/).selectOption("2");
  await page.getByLabel(/Involved in an accident/).selectOption("No");
  await page.getByLabel(/Locked wheels/).selectOption("No");
  await assertNoOverflow(page,"vehicle",width);
  await page.screenshot({path:`qa-request-screenshots/vehicle-${width}.png`,fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:/What's the issue/}).click();
  await page.getByRole("button",{name:/Emergency & Roadside/}).click();
  await page.getByRole("button",{name:"Breakdown Recovery",exact:true}).click();
  await page.getByRole("button",{name:"Scheduled",exact:true}).click();
  await page.getByLabel(/Preferred collection date/).fill("2099-05-22T12:00");
  await page.getByLabel(/Additional Details/).fill("Mock test note");
  await assertNoOverflow(page,"issue",width);
  await page.screenshot({path:`qa-request-screenshots/issue-${width}.png`,fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:/Your Contact Details/}).click();
  await page.getByLabel(/Full name/).fill("Test Customer");
  await page.getByLabel(/UK mobile number/).fill("07123456789");
  await page.getByLabel(/Email address/).fill("demo@example.test");
  await assertNoOverflow(page,"contact",width);
  await page.screenshot({path:`qa-request-screenshots/contact-${width}.png`,fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:/Get Estimate/}).click();
  await page.getByRole("heading",{name:/Review your recovery request/}).waitFor({timeout:12000});
  await page.getByText("Price to be confirmed by recovery drivers").first().waitFor({timeout:12000});
  if(!(await page.getByRole("button",{name:/REQUEST SUBMISSION PAUSED/}).isDisabled()))throw Error("Demo booking write enabled");
  if(await page.locator(".recovery-demo-progress li.current").count()!==1)throw Error("Estimate progress stage not selected");
  await assertNoOverflow(page,"estimate",width);
  await page.screenshot({path:`qa-request-screenshots/estimate-${width}.png`,fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:"Edit vehicle"}).click();
  if(!(await page.getByLabel(/Vehicle make/).inputValue()==="Ford"))throw Error("Vehicle data lost after editing");
  await page.goBack();await page.getByRole("heading",{name:/Review your recovery request/}).waitFor();
  await page.goForward();await page.getByLabel(/Vehicle make/).waitFor();
  if(await page.getByLabel(/Vehicle make/).inputValue()!=="Ford")throw Error("Browser history lost input");
  await page.reload({waitUntil:"domcontentloaded"});
  await page.getByRole("button",{name:/Vehicle Details/}).click();
  if(await page.getByLabel(/Vehicle type/).inputValue()!=="Car")throw Error("Non-sensitive selection not restored");
  if(await page.getByLabel(/Vehicle make/).inputValue()!=="")throw Error("Private make persisted");
  await page.getByRole("button",{name:/What's the issue/}).click();
  if(!(await page.getByRole("button",{name:"Breakdown Recovery",exact:true}).isVisible()))throw Error("Restored service group not visible after refresh");
  if(await page.getByRole("button",{name:"Breakdown Recovery",exact:true}).getAttribute("aria-pressed")!=="true")throw Error("Restored service not selected");

  const draft=await page.evaluate(()=>sessionStorage.getItem("ukr-request-safe-draft-v1"));
  for(const secret of ["customerName","phone","email","registration","pickupAddress","destinationAddress","problemDescription"]){
   if(Object.hasOwn(JSON.parse(draft||"{}"),secret))throw Error("Private key stored: "+secret);
  }
  console.log("PASS complete demo details-to-estimate flow "+width);
 }catch(e){errors.push("journey "+width+": "+e.message);console.error("FAIL journey "+width,e.message)}
 await context.close();
}
await browser.close();
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}
