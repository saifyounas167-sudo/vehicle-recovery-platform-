import {chromium} from "playwright";import assert from "node:assert/strict";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
for(const width of [320,375,390,430,768,1024,1440]){const page=await browser.newPage({viewport:{width,height:850}});await page.goto("http://127.0.0.1:3000/",{waitUntil:"networkidle"});
if(width<=1160){await page.getByRole("button",{name:"Open menu"}).click();const dialog=page.getByRole("dialog",{name:"UK Recovery mobile navigation"});await dialog.waitFor({state:"visible",timeout:5000});await dialog.getByRole("link",{name:"Login / Sign Up"}).waitFor({state:"visible"});await dialog.getByRole("button",{name:"For Drivers"}).click();await dialog.getByRole("link",{name:"Driver Registration"}).waitFor({state:"visible"});await page.keyboard.press("Escape");await dialog.waitFor({state:"hidden",timeout:5000});await page.getByRole("button",{name:"Open menu"}).click();await dialog.getByRole("button",{name:"Close menu"}).click();await dialog.waitFor({state:"hidden",timeout:5000});}
else assert.ok(await page.getByRole("navigation",{name:"Main navigation"}).isVisible());
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=2,"Overflow at "+width+"px: "+overflow);console.log("PASS",width);await page.close();}
await browser.close();
