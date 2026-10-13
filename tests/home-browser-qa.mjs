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
  if(overflow>2){const offenders=await page.evaluate(()=>Array.from(document.querySelectorAll("body *")).filter(el=>el.getBoundingClientRect().right>innerWidth+2||el.getBoundingClientRect().left< -2).slice(0,12).map(el=>({tag:el.tagName,cls:el.className?.baseVal||el.className,left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)})));throw Error("horizontal overflow "+overflow+"px "+JSON.stringify(offenders))}
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
   if(await page.getByRole("button",{name:"Close menu"}).getAttribute("aria-expanded")!=="true")throw Error("mobile menu not expanded");
   await page.getByRole("button",{name:"Close menu"}).click();
  }
  if(await hero.locator('a[href="/recovery/nearby"]').count()!==1)throw Error("nearby CTA route missing");
  if(await hero.locator('a[href="/driver/register"]').count()!==1)throw Error("driver CTA route missing");
  if(await cards.filter({has:page.locator('a[href="/recovery/request"]')}).count()!==10){
   for(let i=0;i<10;i++)if(await cards.nth(i).getAttribute("href")!=="/recovery/request")throw Error("service link wrong "+i)
  }
  if(await page.locator('a[href="/how-it-works"]').count()===0)throw Error("How It Works route missing");
  if(await page.locator('a[href="/about"]').count()===0)throw Error("About route missing");
  if(await page.locator('footer a[href="/recovery/request"]').count()===0)throw Error("footer recovery route missing");
  if(errors.length)throw Error("console/page errors: "+errors.slice(0,3).join("; "));
  console.log("PASS viewport",width);
 }catch(e){failures.push(`${width}: ${e.message}`);console.error("FAIL viewport",width,e.message)}
 await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844},permissions:["geolocation"],geolocation:{latitude:51.501,longitude: -0.142}});
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
const deniedContext=await browser.newContext({viewport:{width:375,height:812},permissions:[]});
const deniedPage=await deniedContext.newPage();
try{
 await deniedPage.goto("http://127.0.0.1:3000/",{waitUntil:"domcontentloaded"});
 await deniedPage.locator(".ukr-btn--primary").click();
 await deniedPage.getByText("Use My Current Location").click();
 await deniedPage.getByText("Location permission was not granted.").waitFor({timeout:12000});
 console.log("PASS GPS permission denied");
}catch(e){failures.push("GPS denied: "+e.message);console.error("FAIL GPS denied",e.message)}
await deniedContext.close();
const installedContext=await browser.newContext({viewport:{width:375,height:812}});
await installedContext.addInitScript(()=>{const orig=window.matchMedia.bind(window);window.matchMedia=(query)=>query==="(display-mode: standalone)"?{matches:true,media:query,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){},dispatchEvent(){return true}}:orig(query)});
const installedPage=await installedContext.newPage();
try{
 await installedPage.goto("http://127.0.0.1:3000/",{waitUntil:"domcontentloaded"});
 await installedPage.waitForTimeout(400);
 if(await installedPage.locator(".public-mobile-actions .header-install").count()!==0)throw Error("installed header button still present");
 if(await installedPage.locator("#install-app .ukra-install").count()!==1)throw Error("homepage installed-state CTA missing");
 console.log("PASS simulated standalone installed-state header");
}catch(e){failures.push("PWA standalone: "+e.message);console.error("FAIL PWA standalone",e.message)}
await installedContext.close();
await browser.close();
if(failures.length){console.error("QA failures:\n"+failures.join("\n"));process.exitCode=1}
