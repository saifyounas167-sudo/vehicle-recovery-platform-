import {chromium} from "playwright";import assert from "node:assert/strict";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]}),failures=[];
for(const width of [320,375,390,768,1024,1440]){const context=await browser.newContext({viewport:{width,height:850}}),page=await context.newPage();try{
 for(const role of ["driver","customer","admin"]){await page.goto("http://127.0.0.1:3000/login?role="+role);await page.getByRole("heading",{name:role==="driver"?"Driver Login":role==="admin"?"Admin Login":"Customer Login"}).waitFor();assert.ok(await page.getByRole("button",{name:/Sign In/}).count());assert.equal(await page.getByRole("link",{name:"Create Driver Account"}).count(),role==="driver"?1:0);assert.equal(await page.getByRole("link",{name:"Create Account",exact:true}).count(),role==="customer"?1:0);await page.getByRole("link",{name:"Forgot Password?"}).click();await page.getByRole("heading",{name:"Forgot Password"}).waitFor();const delta=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(delta<=2,"overflow "+width+" "+delta);}
 console.log("PASS premium login",width)
}catch(e){failures.push(width+": "+e.message)}await context.close()}
await browser.close();if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
