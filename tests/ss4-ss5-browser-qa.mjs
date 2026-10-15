import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const widths=[320,375,390,430,768,1024,1440],failures=[];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
await mkdir("qa-dynamic-marketplace",{recursive:true});
const url="http://127.0.0.1:3000/recovery/request?service=Accident%20Recovery&pickup=SW1A%201AA&pickupLocation=10%20Downing%20Street&destination=M1%201AA&destinationLocation=Manchester";
const fixtureOffers=[
 {id:"11111111-1111-4111-8111-111111111111",priceGbp:110,etaMinutes:45,message:"Flatbed available",status:"pending",driver:{name:"QA Provider Alpha",verified:true,imageUrl:null,truckType:"Flatbed",services:["Accident Recovery"],coverageRadiusMiles:50,rating:null,reviewCount:0}},
 {id:"22222222-2222-4222-8222-222222222222",priceGbp:130,etaMinutes:20,message:"On my way",status:"pending",driver:{name:"QA Provider Beta",verified:true,imageUrl:null,truckType:"Recovery truck",services:["Accident Recovery"],coverageRadiusMiles:60,rating:null,reviewCount:0}}
];
async function setup(page,empty=false){
 const fulfill=(route,body,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
 await page.route("**/api/client-review-status",r=>fulfill(r,{clientDemo:false,writesEnabled:true,isolatedStaging:true,pricingApproved:false}));
 await page.route("**/api/recovery/postcode?**",r=>fulfill(r,{valid:true,postcode:new URL(r.request().url()).searchParams.get("postcode")}));
 await page.route("**/api/recovery/open-estimate",r=>fulfill(r,{available:false,message:"Price to be confirmed by recovery drivers"}));
 await page.route("**/api/recovery/jobs",r=>fulfill(r,{job:{id:"UKR-QATEST",status:"submitted"},guestAccess:{jobId:"99999999-9999-4999-8999-999999999999",reference:"UKR-QATEST",proof:"a".repeat(64)}},201));
 await page.route("**/api/recovery/guest-offers",r=>fulfill(r,{job:{reference:"UKR-QATEST",status:"submitted"},offers:empty?[]:fixtureOffers}));
 await page.route("**/api/recovery/accept-offer",r=>fulfill(r,{accepted:true}));
}
async function complete(page){
 await page.getByRole("button",{name:/Get Estimate/}).click();
 await page.getByLabel(/Vehicle type/).selectOption("Car");
 await page.getByLabel(/Is the vehicle running/).selectOption("Running");
 await page.getByLabel(/Can the vehicle roll/).selectOption("Yes");
 await page.getByLabel(/How many passengers/).selectOption("0");
 await page.getByLabel(/Involved in an accident/).selectOption("No");
 await page.getByRole("button",{name:/Your Contact Details/}).click();
 await page.getByLabel(/Full name/).fill("QA Test Customer");
 await page.getByLabel(/UK mobile number/).fill("07123456789");
 await page.getByRole("button",{name:/Get Estimate/}).click();
 await page.getByRole("heading",{name:"Estimated Price"}).waitFor();
 await page.getByRole("button",{name:/Submit Recovery Request & Continue/}).click();
 await page.getByRole("heading",{name:"Driver Offers"}).waitFor();
 if(await page.getByRole("heading",{name:"Recovery request received"}).count())throw Error("Duplicate receipt heading appears above offers");
}
for(const width of widths){
 const ctx=await browser.newContext({viewport:{width,height:844}}),page=await ctx.newPage();
 try{
  await setup(page);await page.goto(url,{waitUntil:"domcontentloaded"});
  await complete(page);
  await page.getByRole("button",{name:"View Details"}).first().waitFor();
  if(await page.locator(".uk-offer-card").count()!==2)throw Error("Genuine-offer fixture count mismatch");
  await page.screenshot({path:`qa-dynamic-marketplace/SS4-MOCKED-${width}.png`,fullPage:true,animations:"disabled"});
  await page.getByLabel("Sort by").selectOption("eta");
  if(!(await page.locator(".uk-offer-card h3").first().textContent()).includes("Beta"))throw Error("ETA sorting incorrect");
  await page.getByLabel("Sort by").selectOption("price");
  if(!(await page.locator(".uk-offer-card h3").first().textContent()).includes("Alpha"))throw Error("Price sorting incorrect");
  await page.getByRole("button",{name:"View Details"}).first().click();
  await page.getByRole("heading",{name:"Driver Details"}).waitFor();
  if(await page.locator("[aria-current=step]").textContent()!=="4 Choose")throw Error("Choose stage incorrect");
  await page.getByText("No reviews yet").first().waitFor();
  await page.screenshot({path:`qa-dynamic-marketplace/SS5-MOCKED-${width}.png`,fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:"Choose This Driver"}).click();
  await page.getByText("Your driver has been selected.").waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  if(overflow>2)throw Error("Horizontal overflow "+overflow);
  if(page.url().includes("07123456789"))throw Error("Private contact leaked into URL");
  console.log("PASS SS4 SS5 MOCKED",width);
 }catch(e){failures.push(width+"px: "+e.message);console.error("FAIL",width,e.message)}
 await ctx.close();
}
const ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage();
try{await setup(page,true);await page.goto(url,{waitUntil:"domcontentloaded"});await complete(page);
 await page.getByText("No driver offers have been received yet.").waitFor();
 await page.screenshot({path:"qa-dynamic-marketplace/SS4-empty-MOCKED-390.png",fullPage:true,animations:"disabled"});
 console.log("PASS truthful empty state");
}catch(e){failures.push("empty state: "+e.message)}await ctx.close();await browser.close();
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
