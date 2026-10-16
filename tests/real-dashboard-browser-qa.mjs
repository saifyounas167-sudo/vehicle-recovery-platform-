import {chromium} from "playwright";import assert from "node:assert/strict";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]}),errors=[];
for(const width of [375,768,1440]){
 const ctx=await browser.newContext({viewport:{width,height:850}}),page=await ctx.newPage();
 try{
  for(const role of ["driver","customer","admin"]){
   await page.goto("http://127.0.0.1:3000/login?role="+role,{waitUntil:"domcontentloaded"});
   await page.getByRole("heading",{name:role==="driver"?"Driver Login":role==="admin"?"Admin Login":"Customer Login"}).waitFor();
   assert.ok(!page.url().includes("/demo"),"Login demo redirect");
   await page.goto("http://127.0.0.1:3000/"+role,{waitUntil:"domcontentloaded"});
   assert.ok(page.url().includes("/login?reason=auth"),role+" unauthenticated access must redirect to login");
  }
  await page.goto("http://127.0.0.1:3000/",{waitUntil:"domcontentloaded"});
  assert.equal(await page.locator(".language-control,.mobile-language").count(),0);
  console.log("PASS read-only unauthenticated role routes",width);
 }catch(e){errors.push(width+" "+e.message)}
 await ctx.close();
}
await browser.close();
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}
