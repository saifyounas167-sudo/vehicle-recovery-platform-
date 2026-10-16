import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
import assert from "node:assert/strict";
const origin="http://127.0.0.1:3000",id="99999999-9999-4999-8999-999999999999";
const access={jobId:id,reference:"UKR-QATEST",proof:"a".repeat(64)};
const booking={reference:access.reference,status:"assigned",companyName:"QA Provider Alpha",companyLogoUrl:null,priceGbp:110,etaMinutes:45,service:"Accident Recovery",paymentMethod:"Pay your recovery driver directly."};
const tracking={bookingConfirmed:true,trackingAvailable:false,status:"assigned",service:"Accident Recovery",reference:access.reference,driver:{companyName:"QA Provider Alpha",truckType:"Flatbed",avatarUrl:null,verified:true,phone:null},offeredEtaMinutes:45,liveEtaMinutes:null,driverLocation:null,pickup:{postcode:"M1 1AA",point:null},destination:{postcode:null,point:null}};
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]}),failures=[];
await mkdir("qa-ss7-screenshots",{recursive:true});
const reply=(route,data,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(data)});
for(const width of [320,375,390,430,768,1024,1440]){
 const ctx=await browser.newContext({viewport:{width,height:840}}),page=await ctx.newPage();
 try{
  await page.goto(origin+"/recovery/tracking/"+id,{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"Customer Tracking Preview"}).waitFor();
  assert.equal(await page.getByText("QA Provider Alpha").count(),0,"Must not show fake driver during review");
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  if(overflow>2){const offenders=await page.evaluate(()=>[...document.querySelectorAll("body *")].map(e=>({tag:e.tagName,cls:typeof e.className==="string"?e.className:"",left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth})).filter(e=>e.right>innerWidth+2||e.left< -2).slice(0,25));console.error("OVERFLOW ELEMENTS",JSON.stringify(offenders));}
  assert.ok(overflow<=2,"Preview horizontal overflow "+width+": "+overflow);
  await page.screenshot({path:`qa-ss7-screenshots/preview-${width}.png`,fullPage:true,animations:"disabled"});
  await page.route("**/api/client-review-status",r=>reply(r,{clientDemo:false,writesEnabled:true,isolatedStaging:true}));
  await page.route("**/api/recovery/tracking/**",r=>reply(r,tracking));
  await page.addInitScript(v=>sessionStorage.setItem("ukr-ss6-guest-access",JSON.stringify(v)),access);
  await page.reload({waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"Driver Assigned"}).waitFor();
  await page.getByRole("heading",{name:"QA Provider Alpha"}).waitFor();
  await page.getByText("45 minutes").waitFor();
  await page.getByText("Original estimate, not live arrival time").waitFor();
  await page.getByText("Live driver location and continuously updated ETA are unavailable.",{exact:false}).waitFor();
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,"Tracking overflow "+width+": "+overflow);
  await page.screenshot({path:`qa-ss7-screenshots/assigned-MOCKED-${width}.png`,fullPage:true,animations:"disabled"});
  console.log("PASS SS7 responsive preview and mocked tracking",width);
 }catch(e){failures.push(width+": "+e.message)}
 await ctx.close();
}
for(const [name,status,result] of [["unauthorised",403,{error:"Not authorised"}],["not-found",404,{error:"Tracking not found"}],["unassigned",200,{bookingConfirmed:false,status:"submitted",trackingAvailable:false}]]){
 const ctx=await browser.newContext({viewport:{width:390,height:840}}),page=await ctx.newPage();
 try{
  await page.route("**/api/client-review-status",r=>reply(r,{clientDemo:false,writesEnabled:true,isolatedStaging:true}));
  await page.route("**/api/recovery/tracking/**",r=>reply(r,result,status));
  await page.goto(origin+"/recovery/tracking/"+id,{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:name==="unassigned"?"Recovery Not Yet Assigned":"Tracking Not Available"}).waitFor();
  assert.equal(await page.getByText("QA Provider Alpha").count(),0);
  console.log("PASS mocked tracking state",name);
 }catch(e){failures.push(name+": "+e.message)}
 await ctx.close();
}
const ctx=await browser.newContext({viewport:{width:390,height:840}}),page=await ctx.newPage();
try{
 await page.route("**/api/client-review-status",r=>reply(r,{clientDemo:false,writesEnabled:true,isolatedStaging:true}));
 await page.route("**/api/recovery/booking-confirmation",r=>reply(r,{confirmed:true,booking}));
 await page.route("**/api/recovery/tracking/**",r=>reply(r,tracking));
 await page.addInitScript(v=>sessionStorage.setItem("ukr-ss6-guest-access",JSON.stringify(v)),access);
 await page.goto(origin+"/recovery/booking",{waitUntil:"domcontentloaded"});
 await page.getByRole("heading",{name:"Recovery Booked!"}).waitFor();
 await page.getByRole("link",{name:"Track Recovery"}).click();
 await page.waitForURL("**/recovery/tracking/"+id);
 await page.getByRole("heading",{name:"Driver Assigned"}).waitFor();
 console.log("PASS mocked SS6 → SS7 navigation");
}catch(e){failures.push("SS6 → SS7: "+e.message)}
await ctx.close();
await browser.close();
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
