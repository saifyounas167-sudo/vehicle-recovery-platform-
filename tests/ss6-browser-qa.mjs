import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const widths=[320,375,390,430,768,1024,1440],failures=[];
await mkdir("qa-ss6-screenshots",{recursive:true});
const origin="http://127.0.0.1:3000";
const access={jobId:"99999999-9999-4999-8999-999999999999",reference:"UKR-QATEST",proof:"a".repeat(64)};
const booking={reference:"UKR-QATEST",status:"assigned",companyName:"QA Provider Alpha",companyLogoUrl:null,priceGbp:110,etaMinutes:45,service:"Accident Recovery",paymentMethod:"Pay your recovery driver directly."};
async function respond(route,data,status=200){await route.fulfill({status,contentType:"application/json",body:JSON.stringify(data)});}
for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:850}}),page=await context.newPage();
 try{
  await page.goto(origin+"/recovery/booking",{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"Booking Confirmation Preview"}).waitFor();
  if(await page.getByRole("heading",{name:"Recovery Booked!"}).count())throw Error("False success shown in read-only mode");
  if(!await page.getByText("No payment has been taken.").isVisible())throw Error("Payment warning missing");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  if(overflow>2)throw Error("Read-only horizontal overflow "+overflow);
  await page.screenshot({path:`qa-ss6-screenshots/preview-${width}.png`,fullPage:true,animations:"disabled"});
  await page.getByRole("link",{name:"View Booking Status"}).click();
  await page.waitForURL("**/recovery/booking/details");
  await page.getByRole("heading",{name:"Booking Confirmation Preview"}).waitFor();
  await page.getByRole("link",{name:"Back to Home"}).click();
  await page.waitForURL(origin+"/");
  console.log("PASS read-only and navigation "+width);
 }catch(error){failures.push("preview "+width+" "+error.message);}
 await context.close();
}
for(const kind of ["confirmed","pending","unauthorized","missing"]){
 const context=await browser.newContext({viewport:{width:390,height:850}}),page=await context.newPage();
 try{
  await page.route("**/api/client-review-status",r=>respond(r,{clientDemo:false,writesEnabled:true,isolatedStaging:true}));
  await page.route("**/api/recovery/booking-confirmation",r=>kind==="unauthorized"?respond(r,{error:"Not authorised"},403):kind==="pending"?respond(r,{confirmed:false,status:"pending"}):respond(r,{confirmed:true,booking}));
  if(kind!=="missing")await page.addInitScript(({key,value})=>{sessionStorage.setItem(key,JSON.stringify(value));},{key:"ukr-ss6-guest-access",value:access});
  await page.goto(origin+"/recovery/booking",{waitUntil:"domcontentloaded"});
  if(kind==="confirmed"){
   await page.getByRole("heading",{name:"Recovery Booked!"}).waitFor();
   for(const text of ["QA Provider Alpha","£110.00","45 minutes","Accident Recovery","Pay your recovery driver directly."])await page.getByText(text,{exact:true}).first().waitFor();
   await page.getByRole("link",{name:"View Booking",exact:true}).click();
   await page.waitForURL("**/recovery/booking/details");
   await page.getByRole("heading",{name:"Recovery Booked!"}).waitFor();
  }else{
   await page.getByRole("heading",{name:kind==="pending"?"Booking Pending":"Booking Unavailable"}).waitFor();
   if(await page.getByRole("heading",{name:"Recovery Booked!"}).count())throw Error("False confirmed result");
  }
  await page.screenshot({path:`qa-ss6-screenshots/${kind}-MOCKED-390.png`,fullPage:true,animations:"disabled"});
  console.log("PASS SS6 "+kind+" mocked");
 }catch(error){failures.push(kind+": "+error.message)}
 await context.close();
}
await browser.close();
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
