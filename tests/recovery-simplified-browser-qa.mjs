import {chromium} from "playwright";
import assert from "node:assert/strict";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const services=["Breakdown Recovery","Accident Recovery","Vehicle Transport","Car Towing","Jump Start / Flat Battery Assistance","Flat Tyre Assistance","Motorbike Recovery","Van Recovery","Auction Vehicle Collection","Non-Running Vehicle Transport"];
const failures=[];
for(const width of [320,375,390,430,768,1024,1440]){
 const ctx=await browser.newContext({viewport:{width,height:850}});
 const page=await ctx.newPage();page.setDefaultTimeout(8000);
 try{
  await page.goto("http://127.0.0.1:3000/recovery/request");
  const panel=page.locator("#demo-issue-fields");
  await panel.waitFor();
  assert.equal(await panel.locator(".recovery-service-grid button").count(),10);
  for(const service of services){
   await panel.getByRole("button",{name:service,exact:true}).click();
   assert.equal(await panel.getByRole("button",{name:service,exact:true}).getAttribute("aria-pressed"),"true");
   const needsDestination=!["Breakdown Recovery","Jump Start / Flat Battery Assistance","Flat Tyre Assistance"].includes(service);
   assert.equal(await page.getByRole("button",{name:/Drop-off Location/}).count(),Number(needsDestination));
   if(service==="Breakdown Recovery"){
    await panel.getByRole("button",{name:"Roadside assistance",exact:true}).click();
    assert.equal(await page.getByRole("button",{name:/Drop-off Location/}).count(),0);
    await panel.getByRole("button",{name:"Vehicle transport",exact:true}).click();
    assert.equal(await page.getByRole("button",{name:/Drop-off Location/}).count(),1);
   }
  }
  await panel.getByRole("button",{name:"Scheduled",exact:true}).click();
  assert.equal(await panel.getByLabel("Preferred collection date/time").count(),1);
  await panel.getByRole("button",{name:"ASAP",exact:true}).click();
  assert.equal(await panel.getByLabel("Preferred collection date/time").count(),0);
  assert.ok(await page.getByRole("button",{name:/Get Estimate/}).isVisible());
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2);
  console.log("PASS all service options and mobile/desktop",width);
 }catch(e){failures.push(width+": "+e.message)}
 await ctx.close();
}
await browser.close();if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
