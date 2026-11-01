// Browser smoke QA: no credentials, no new accounts, no database writes.
// Runs against an ephemeral local Next.js production build with placeholder Auth env.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";

const widths=[320,375,390,430,768,1024,1440];
const base="http://127.0.0.1:3108";
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p","3108"],{
 env:{...process.env,VERCEL_ENV:"test",NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"placeholder"},stdio:["ignore","pipe","pipe"]
});
let serverLog="";
server.stdout.on("data",chunk=>{serverLog+=(String(chunk)).slice(-1500);});
server.stderr.on("data",chunk=>{serverLog+=(String(chunk)).slice(-1500);});
const failures=[];
let browser;
try{
 let ready=false;
 for(let i=0;i<90;i++){
  if(server.exitCode!==null)throw Error("Next server exited: "+serverLog.slice(-600));
  try{const r=await fetch(base+"/");if(r.status<500){ready=true;break;}}catch{}
  await delay(1000);
 }
 if(!ready)throw Error("Next server did not become ready: "+serverLog.slice(-1000));
 browser=await chromium.launch({headless:true});
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:850},deviceScaleFactor:1});
  const page=await context.newPage();
  for(const [path,label] of [["/","homepage"],["/login?role=customer","Customer Login"],["/login?role=admin","Admin Login"],["/recovery/request","Recovery Request"]]){
   try{
    const response=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:25000});
    assert.ok(response&&response.status()<500, label+" returned server error");
    if(path.includes("role=customer"))await page.getByRole("heading",{name:"Customer Login"}).waitFor({timeout:8000});
    if(path.includes("role=admin"))await page.getByRole("heading",{name:"Admin Login"}).waitFor({timeout:8000});
    const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth}));
    assert.ok(metrics.scroll<=metrics.width+4,`${label} has horizontal overflow ${metrics.scroll}px at ${width}px`);
    console.log("PASS browser",width,label);
   }catch(err){failures.push(`${width}px ${label}: ${String(err?.message||err)}`);}
  }
  // These are anonymous-only checks: verified Customer/Admin role isolation requires existing test sessions.
  for(const path of ["/customer","/admin"]){
   try{
    await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:25000});
    await page.waitForURL(url=>url.pathname==="/login",{timeout:15000});
    const actual=new URL(page.url());
    assert.equal(actual.pathname,"/login");
    assert.notEqual(actual.pathname,"/403");
    console.log("PASS anon protected route",width,path);
   }catch(err){failures.push(`${width}px anonymous ${path}: ${String(err?.message||err)}`);}
  }
  await context.close();
 }
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}
if(failures.length){
 console.error("BROWSER QA FAILURES ("+failures.length+"):\n"+failures.join("\n"));
 process.exitCode=1;
}else console.log("Browser QA PASS: 7 viewports, public pages, and anonymous Customer/Admin route guards.");
