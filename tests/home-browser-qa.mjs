import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const widths=[320,375,390,430,768,1024,1440];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
await mkdir("qa-screenshots",{recursive:true});
for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:840},deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("console",m=>{if(m.type()==="error")errors.push(m.text())});
 try{
  const res=await page.goto("http://127.0.0.1:3000/",{waitUntil:"domcontentloaded",timeout:45000});
  if(!res||res.status()>=400)throw Error("Homepage HTTP "+res?.status());
  await page.locator(".ukr-title").waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  if(overflow>2)throw Error("horizontal overflow "+overflow+"px");
  const cards=page.locator("#services .ukrs-card");
  if(await cards.count()!==10)throw Error("expected exactly ten service cards");
  if(width<=600){const a=await cards.nth(0).boundingBox(),b=await cards.nth(1).boundingBox();if(!a||!b||Math.abs(a.y-b.y)>4||b.x<=a.x)throw Error("two-column mobile service layout missing")}
  const hero=page.locator(".ukr-hero");
  if(!(await hero.locator(".ukr-btn--primary").isVisible()))throw Error("primary CTA hidden");
  await page.screenshot({path:`qa-screenshots/home-${width}.png`,fullPage:true,animations:"disabled"});
  await hero.locator("button.ukr-btn--primary").click();
  if(!(await page.locator("#homepage-quick-quote").isVisible()))throw Error("quote form did not open");
  await hero.locator("button.ukr-btn--primary").click();
  if(await page.locator("#homepage-quick-quote").count())throw Error("quote form did not close");
  if(width<=430){
   const menu=page.getByRole("button",{name:"Open menu"});
   await menu.click();
   if(await menu.getAttribute("aria-expanded")!=="true")throw Error("mobile menu not expanded");
   await page.getByRole("button",{name:"Close menu"}).click();
  }
  if(errors.length)throw Error("console/page errors: "+errors.slice(0,3).join("; "));
  console.log("PASS viewport",width);
 }catch(e){failures.push(`${width}: ${e.message}`);console.error("FAIL viewport",width,e.message)}
 await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844},permissions:["geolocation"],geolocation:{latitude:51.501,long: -0.142}});
const page=await context.newPage();
try{
 await page.route("**/api/recovery/location-suggest**",async route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({suggestions:[{id:"mock",label:"10 Downing Street, London SW1A 2AA",detail:"London",postcode:"SW1A 2AA",kind:"building"}]})}));
 await page.route("**/api/recovery/postcode?**",async route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({postcode:"SW1A 1AA"})}));
 await page.goto("http://127.0.0.1:3000/",{waitUntil:"domcontentloaded"});
 await page.locator(".ukr-btn--primary").click();
 const inputs=page.locator("#homepage-quick-quote input");
 await inputs.first().fill("SW1A");
 await page.getByText("10 Downing Street, London SW1A 2AA").first().waitFor({timeout:12000});
 await page.getByText("10 Downing Street, London SW1A 2AA").first().click();
 if(await inputs.first().inputValue()!=="10 Downing Street, London SW1A 2AA")throw Error("autocomplete selection failed");
 await page.getByText("Use My Current Location").click();
 await page.getByText("Pickup postcode detected.").waitFor({timeout:12000});
 await page.getByRole("button",{name:/EXPLORE YOUR RECOVERY ESTIMATE/}).click();
 await page.waitForURL(/\/recovery\/request\?pickup=SW1A(?:\+|%20)1AA/,{timeout:12000});
 console.log("PASS mocked autocomplete, GPS granted, quote transfer");
}catch(e){failures.push("functionality: "+e.message);console.error("FAIL functionality",e.message)}
await context.close();
await browser.close();
if(failures.length){console.error("QA failures:\n"+failures.join("\n"));process.exitCode=1}
