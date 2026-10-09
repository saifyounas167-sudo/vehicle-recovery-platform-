import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
const file=p=>readFileSync(p,"utf8");
test("valid scoped standalone manifest and Apple touch icon",()=>{
 const m=JSON.parse(file("public/manifest.webmanifest"));
 assert.equal(m.start_url,"/");assert.equal(m.scope,"/");assert.equal(m.display,"standalone");
 assert.equal(m.theme_color,"#ff6600");assert.ok(m.icons.length>=2);
 const png=readFileSync("public/apple-touch-icon.png");
 assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 assert.equal(png.readUInt32BE(16),180);assert.equal(png.readUInt32BE(20),180);
 assert.ok(file("app/layout.tsx").includes("/apple-touch-icon.png"));
});
test("service worker never caches customer pages or API data",()=>{
 const sw=file("public/sw.js");const reg=file("app/pwa-register.tsx");
 assert.ok(reg.includes('serviceWorker.register("/sw.js"'));
 assert.doesNotMatch(sw,/addEventListener\(["']fetch/);
 assert.doesNotMatch(sw,/cache\.put\(|cache\.add(All)?\(/);
 assert.ok(sw.includes("caches.delete"));
});
test("iOS guidance and Android native prompt with standalone detection",()=>{
 const c=file("app/install-app-button.tsx");
 for(const t of ["beforeinstallprompt","event.prompt()","event.userChoice","appinstalled","display-mode: standalone","navigator.maxTouchPoints","Safari","Add to Home Screen","Open as Web App","aria-modal","Escape","createPortal","App Already Installed"])assert.ok(c.includes(t),t);
});
test("homepage keeps app section scope with non-interactive phone preview",()=>{
 const c=file("app/page.tsx");const css=file("app/home-enhancements.css");
 const sec=c.slice(c.indexOf('<section className="app-section"'),c.indexOf('<section className="driver-cta"'));
 assert.ok(sec.includes("pwa-phone-screen"));assert.ok(sec.includes("Not interactive"));assert.ok(sec.includes("<InstallAppButton/>"));
 assert.ok(css.includes(".uk-home .app-section"));assert.ok(css.includes(".pwa-dialog-backdrop"));
 assert.ok(c.includes('HERO_BACKGROUND_IMAGE="/recovery-hero.webp"'));
});

test("iPhone quick guidance includes actual Share icon and Safari fallback",()=>{
 const c=file("app/install-app-button.tsx");
 for(const t of ["pwa-share-icon","Add to Home Screen","Open as Web App","Copy website link","navigator.clipboard.writeText","Open website in browser","FBAN","Instagram"])assert.ok(c.includes(t),t);
 assert.ok(c.includes('event.prompt()'));assert.ok(c.includes("display-mode: standalone"));
});
