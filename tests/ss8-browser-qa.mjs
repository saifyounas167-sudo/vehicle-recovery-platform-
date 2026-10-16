import {chromium} from "playwright";
import assert from "node:assert/strict";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
for(const width of [320,375,390,430,768,1024,1440]){
 const ctx=await browser.newContext({viewport:{width,height:850}}),page=await ctx.newPage();
 try{
  await page.goto("http://127.0.0.1:3000/driver/register",{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"Join as a Recovery Driver"}).waitFor();
  for(const name of ["Full Name","Email Address","Phone Number","Vehicle Type","Company Name (optional)"])assert.ok(await page.getByLabel(name,{exact:true}).count(),name);
  assert.ok(await page.getByRole("link",{name:"Login"}).count());
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,"horizontal overflow: "+overflow);
  console.log("PASS SS8 layout",width);
 }catch(e){failures.push(width+" "+e.message)}
 await ctx.close();
}
await browser.close();
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
