import {chromium} from "playwright";
import assert from "node:assert/strict";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
for(const width of [320,375,390,430,768,1024,1440]){
 const page=await browser.newPage({viewport:{width,height:850}});
 await page.goto("http://127.0.0.1:3000/",{waitUntil:"networkidle"});
 if(width<=1160){
  await page.getByRole("button",{name:"Open menu"}).click();
  const dialog=page.getByRole("dialog",{name:"UK Recovery mobile navigation"});
  await dialog.waitFor({state:"visible",timeout:5000});
  for(const role of ["Customer","Driver","Admin"])await dialog.getByRole("link",{name:role+" Login",exact:true}).waitFor({state:"visible"});
  await dialog.getByRole("link",{name:"Create Customer Account"}).waitFor({state:"visible"});
  assert.equal(await dialog.getByRole("link",{name:"Business Login"}).count(),0);
  await dialog.getByRole("button",{name:"For Drivers"}).click();
  await dialog.getByRole("link",{name:"Driver Registration"}).waitFor({state:"visible"});
  await dialog.getByRole("link",{name:"Driver Membership / Pricing"}).waitFor({state:"visible"});
  await page.keyboard.press("Escape");await dialog.waitFor({state:"hidden",timeout:5000});
  if(width===390){
   await page.getByRole("button",{name:"Open menu"}).click();await dialog.waitFor({state:"visible",timeout:5000});
   await dialog.getByRole("link",{name:"Driver Login",exact:true}).click();
   await page.getByRole("heading",{name:"Driver Login"}).waitFor({state:"visible",timeout:5000});
   await page.goto("http://127.0.0.1:3000/login?role=customer");
   await page.getByRole("heading",{name:"Customer Login"}).waitFor({state:"visible"});
   await page.goto("http://127.0.0.1:3000/login?role=admin");
   await page.getByRole("heading",{name:"Admin Login"}).waitFor({state:"visible"});
   const response=await page.goto("http://127.0.0.1:3000/driver/pricing");
   assert.equal(response?.status(),200);
   await page.getByRole("heading",{name:"Driver Membership / Pricing"}).waitFor({state:"visible"});
  }
 }else assert.ok(await page.getByRole("navigation",{name:"Main navigation"}).isVisible());
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(overflow<=2,"Horizontal overflow at "+width+"px: "+overflow);
 console.log("PASS",width);
 await page.close();
}
await browser.close();
