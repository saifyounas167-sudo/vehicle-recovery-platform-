import {chromium} from "playwright";
import assert from "node:assert/strict";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const widths=[320,375,390,430,768,1024,1440];const failures=[];
for(const width of widths){const context=await browser.newContext({viewport:{width,height:850}});const page=await context.newPage();
 try{const response=await page.goto("http://127.0.0.1:3000/driver",{waitUntil:"domcontentloaded"});assert.ok(response);await page.waitForLoadState("networkidle");assert.ok(!page.url().endsWith("/driver"),"Unauthenticated user must not reach protected dashboard");assert.ok(!await page.getByText("Available recovery requests",{exact:true}).count(),"Private jobs must not render");const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert.ok(overflow<=2,"Unauthenticated responsive overflow "+overflow);console.log("PASS unauth driver guard / viewport",width);}
 catch(e){failures.push(width+": "+e.message);}await context.close();}
await browser.close();if(failures.length){console.error(failures.join("\n"));process.exitCode=1;}
