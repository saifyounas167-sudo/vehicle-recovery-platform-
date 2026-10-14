import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/page.tsx","utf8");
const customer = readFileSync("app/recovery/request/page.tsx","utf8");
const component = readFileSync("app/components/uk-location-search.tsx","utf8");
const endpoint = readFileSync("app/api/recovery/location-suggest/route.ts","utf8");

test("client quote CTA opens the existing form with its pickup and drop-off autocomplete",()=>{
  const hero=readFileSync("app/components/uk-recovery-hero.tsx","utf8");
  assert.match(hero,/href="\/recovery\/request"/);
  assert.doesNotMatch(home,/homepage-quick-quote/);
  assert.match(customer,/UkLocationSearch label="Pickup location or UK postcode"/);
  assert.match(customer,/UkLocationSearch label="Drop-off location or UK postcode"/);
});
test("city search keeps exact postcode confirmation in existing recovery form",()=>{
  assert.match(customer,/pickupLocation/);
  assert.match(customer,/destinationLocation/);
  assert.match(customer,/Confirm complete UK pickup postcode/);
  assert.ok(customer.includes("Confirm UK destination postcode (optional)"));
  assert.match(customer,/postcode\.test\(v\.pickupPostcode\.trim\(\)\)/);
});
test("autocomplete supports keyboard, safe suggestion selection and debounced requests",()=>{
  assert.match(component,/role="combobox"/);
  assert.match(component,/role="listbox"/);
  assert.match(component,/e\.key === "ArrowDown"/);
  assert.match(component,/e\.key === "Escape"/);
  assert.match(component,/setTimeout\(async/);
  assert.match(component,/AbortController/);
});
test("UK-only geocoder does not pretend city has a precise postcode",()=>{
  assert.match(endpoint,/countrycode:gb/);
  assert.match(endpoint,/p\.country_code\?\.toLowerCase\(\) !== "gb"/);
  assert.match(endpoint,/exactPostcode/);
  assert.match(endpoint,/GEOAPIFY_API_KEY/);
  assert.match(endpoint,/api\.postcodes\.io/);
  assert.doesNotMatch(endpoint,/api\.geoapify\.com.*apiKey=[^"]/);
});

test("demo security proxy permits only read-only location suggestions without changing write restrictions",()=>{
 const proxy=readFileSync("proxy.ts","utf8");
 assert.match(proxy,/method==="GET"/);
 assert.match(proxy,/\/api\/recovery\/location-suggest/);
 assert.match(proxy,/if\(!allowedGet&&!allowedEstimate\)/);
 assert.match(proxy,/status:503/);
});

test("one-field mobile search does not render separate loading card or stale results",()=>{
  const css=readFileSync("app/home-enhancements.css","utf8");
  assert.match(component,/requestRef\.current === requestNumber/);
  assert.match(component,/resultsFor === query/);
  assert.match(component,/setSuggestions\(\[\]\)/);
  assert.match(component,/uk-location-loading/);
  assert.doesNotMatch(component,/className="uk-location-help"/);
  assert.match(css,/hero-action-panel \.uk-location-input-wrap input:focus-visible/);
  assert.match(css,/border:0 !important/);
});
