import {chromium} from "playwright";
import assert from "node:assert/strict";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const widths=[320,375,390,430,768,1024,1440];
const failures=[];
const serviceNames=[
 "Breakdown Recovery","Accident Recovery","Vehicle Transport","Car Towing",
 "Jump Start / Flat Battery Assistance","Flat Tyre Assistance","Motorbike Recovery",
 "Van Recovery","Auction Vehicle Collection","Non-Running Vehicle Transport"
];
for(const width of widths){
 const ctx=await browser.newContext({viewport:{width,height:850}});
 const page=await ctx.newPage();
 page.setDefaultTimeout(10000);
 try{
  await page.goto("http://127.0.0.1:3000/recovery/request",{waitUntil:"domcontentloaded"});
  const headings=(await page.locator(".recovery-demo-toggle").allTextContents()).map(t=>t.trim());
  assert.equal(headings.length,5,"Five original collapsible sections");
  for(const [i,title] of ["Pickup Location","Drop-off Location","Vehicle Details","What's the issue?","Your Contact Details"].entries())
   assert.ok(headings[i].startsWith(title),`Wrong section at ${i+1}: ${headings[i]}`);
  const pickup=page.getByRole("button",{name:/Pickup Location/});
  const dropoff=page.getByRole("button",{name:/Drop-off Location/});
  assert.equal(await pickup.getAttribute("aria-expanded"),"true","Pickup opens first");
  assert.match(await dropoff.innerText(),/Optional/,"Drop-off visible and optional before service");
  assert.equal(await dropoff.getAttribute("aria-expanded"),"false");
  await page.getByRole("button",{name:/What's the issue\?/}).click();
  const issue=page.locator("#demo-issue-fields");
  await issue.waitFor();
  assert.equal(await issue.locator(".recovery-service-grid button").count(),10);
  for(const name of serviceNames){
   const choice=issue.getByRole("button",{name,exact:true});
   await choice.click();
   assert.equal(await choice.getAttribute("aria-pressed"),"true");
   assert.equal(await dropoff.count(),1,"Drop-off must always be visible");
   const required=!("Breakdown Recovery"===name||"Jump Start / Flat Battery Assistance"===name||"Flat Tyre Assistance"===name);
   assert.match(await dropoff.innerText(),required?/Required/:/Optional/,`Drop-off state for ${name}`);
   if(name==="Breakdown Recovery"){
    await issue.getByRole("button",{name:"Roadside assistance",exact:true}).click();
    assert.match(await dropoff.innerText(),/Optional/);
    await issue.getByRole("button",{name:"Vehicle transport",exact:true}).click();
    assert.match(await dropoff.innerText(),/Required/);
   }
  }
  await issue.getByRole("button",{name:"Scheduled",exact:true}).click();
  const date=issue.getByLabel("Select Date");
  const time=issue.getByLabel("Select Time");
  assert.equal(await date.count(),1);
  assert.equal(await time.count(),1);
  assert.equal(await time.isDisabled(),true,"Time unavailable until date selected");
  const future=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  await date.fill(future);
  assert.equal(await time.isEnabled(),true);
  await time.selectOption("12:00");
  assert.equal(await time.inputValue(),"12:00");
  const list=await time.locator("option").allTextContents();
  assert.ok(list.some(t=>t==="12:00 PM"),"Readable AM/PM time labels");
  await issue.getByRole("button",{name:"ASAP",exact:true}).click();
  assert.equal(await issue.getByLabel("Select Date").count(),0);
  assert.equal(await issue.getByLabel("Select Time").count(),0);
  assert.equal(await page.getByRole("button",{name:/Get Estimate/}).isVisible(),true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,`Horizontal overflow: ${overflow}px`);
  console.log("PASS SS59 pickup/drop-off/service/scheduling browser QA",width);
 }catch(e){failures.push(`${width}: ${e.stack||e.message}`)}
 await ctx.close();
}
await browser.close();
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
