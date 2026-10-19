import {chromium} from "playwright";
import assert from "node:assert/strict";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
for(const width of [320,375,390,430,768,1024,1440]){
 const context=await browser.newContext({viewport:{width,height:850}});
 const page=await context.newPage();
 try{
  // Presentation test only; authenticated route's server role guard is tested separately.
  await page.goto("http://127.0.0.1:3000/ss9-visual-qa");
  assert.equal(await page.getByRole("heading",{name:"Driver Membership"}).count(),1);
  assert.equal(await page.getByRole("heading",{name:"Monthly Plan"}).count(),1);
  assert.equal(await page.locator(".ss9-card").count(),1);
  assert.equal(await page.locator(".ss9-benefits li").count(),4);
  assert.equal(await page.getByRole("button",{name:"Subscribe with Stripe"}).isDisabled(),true);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,"horizontal overflow");
  await page.getByRole("button",{name:"Open navigation menu"}).count().catch(()=>{});
  await page.locator(".ss9-nav summary").click();
  assert.equal(await page.getByRole("link",{name:"Driver Dashboard"}).isVisible(),true);
  console.log("PASS SS9 screenshot structure and responsive layout",width);
 }catch(e){failures.push(width+": "+e.message)}
 await context.close();
}
await browser.close();
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
