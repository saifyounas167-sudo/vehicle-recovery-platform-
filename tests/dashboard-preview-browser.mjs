import {chromium} from "playwright";import assert from "node:assert/strict";
const enabled=process.env.DASHBOARD_PREVIEW_MODE==="enabled";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});const errors=[];
for(const width of [320,375,390,430,768,1024,1440]){
 const context=await browser.newContext({viewport:{width,height:850}});const page=await context.newPage();
 for(const role of ["customer","driver","admin"]){try{
 const res=await page.goto("http://127.0.0.1:3000/preview/"+role,{waitUntil:"networkidle"});
 if(enabled){assert.equal(res.status(),200);assert.ok(await page.getByText("PREVIEW MODE · SAMPLE DATA ONLY").count());assert.equal(await page.locator('button:not([disabled])').count(),role==="driver"?4:0);assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"),"noindex, nofollow");}
 else assert.equal(res.status(),404);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=2,"overflow "+overflow);
 console.log("PASS",enabled?"ON":"OFF",role,width);
 }catch(e){errors.push(role+" "+width+": "+e.message);}}
 for(const role of ["customer","driver","admin"]){try{await page.goto("http://127.0.0.1:3000/"+role,{waitUntil:"networkidle"});assert.ok(!new URL(page.url()).pathname.match(new RegExp("^/"+role+"/?$")),"Real route must require login");}catch(e){errors.push("protected "+role+" "+width+": "+e.message);}}
 await context.close();
}
await browser.close();if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}
