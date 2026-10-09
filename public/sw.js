/* Network-only service worker: no Cache API, navigation fallback or offline claims. */
self.addEventListener("install",()=>{self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith("uk-recovery-")).map(k=>caches.delete(k)));
 await self.clients.claim();
})())});
/* No fetch handler: all pages, requests and API calls always use normal network behaviour. */
