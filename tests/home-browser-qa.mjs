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
  await hero.locator('a.ukr-btn--primary').click();
  await page.waitForURL(/\/recovery\/request/,{timeout:12000});
  if(!(await page.getByRole("heading",{name:"Request Recovery"}).isVisible()))throw Error("Request Recovery not opened directly");
  await page.screenshot({path:`qa-screenshots/after-quote-cta-${width}.png`,fullPage:true,animations:"disabled"});
  if(!(await page.getByText("Details",{exact:true}).first().isVisible()))throw Error("Client demo progress missing");
  await page.goBack({waitUntil:"domcontentloaded"});
  await page.locator(".ukr-title").waitFor();
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
await browser.close();
if(failures.length){console.error("QA failures:\\n"+failures.join("\\n"));process.exitCode=1}
