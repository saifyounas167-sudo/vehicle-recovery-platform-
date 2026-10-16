import {chromium} from "playwright";
import assert from "node:assert/strict";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]}),errors=[];
for(const width of [320,375,390,430,768,1024,1440]){
 const ctx=await browser.newContext({viewport:{width,height:850}}),page=await ctx.newPage();
 try{
  const response=await page.goto("http://127.0.0.1:3000/driver/register",{waitUntil:"domcontentloaded"});
  assert.equal(response?.status(),200);
  assert.ok(page.url().includes("/demo/driver"),"Read-only production must redirect driver registration");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,"demo preview horizontal overflow "+overflow);
  console.log("PASS protected registration redirect",width);
 }catch(e){errors.push(width+": "+e.message)}
 await ctx.close();
}
await browser.close();
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}
