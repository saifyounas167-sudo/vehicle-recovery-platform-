import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/page.tsx","utf8");
const customer = readFileSync("app/recovery/request/page.tsx","utf8");
const component = readFileSync("app/components/uk-location-search.tsx","utf8");
const endpoint = readFileSync("app/api/recovery/location-suggest/route.ts","utf8");

test("location search is available in homepage pickup and drop-off",()=>{
  assert.match(home,/UkLocationSearch label="Pickup Location"/);
  assert.match(home,/UkLocationSearch label="Drop-off Location/);
  assert.match(home,/pickupLocation/);
  assert.match(home,/destinationLocation/);
  assert.doesNotMatch(home,/className="close-quote"/);
});
test("city search keeps exact postcode confirmation in existing recovery form",()=>{
  assert.match(customer,/pickupLocation/);
  assert.match(customer,/destinationLocation/);
  assert.match(customer,/Confirm complete UK pickup postcode/);
  assert.match(customer,/Confirm complete UK destination postcode/);
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
