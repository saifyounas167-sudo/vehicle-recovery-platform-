import {chromium} from "playwright";
import assert from "node:assert/strict";
const base="http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
for(const width of [320,375,390,768,1024,1440]){
 const context=await browser.newContext({viewport:{width,height:850}});
 const page=await context.newPage();
 try{
  await page.goto(base+"/customer",{waitUntil:"domcontentloaded"});
  await page.waitForURL(url=>url.pathname==="/login");
  assert.equal(new URL(page.url()).searchParams.get("reason"),"auth","Customer dashboard must require sign-in");
  await page.goto(base+"/customer/account",{waitUntil:"domcontentloaded"});
  await page.waitForURL(url=>url.pathname==="/login");
  await page.getByRole("heading",{name:"Customer Login"}).waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,"mobile customer login overflow "+overflow+"px");
  console.log("PASS customer route guards and login viewport",width);
 }catch(error){errors.push(width+": "+error.message)}
 await context.close();
}
await browser.close();
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}
