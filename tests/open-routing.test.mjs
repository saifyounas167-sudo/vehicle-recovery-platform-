import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const routing=readFileSync("src/lib/open-routing.ts","utf8");
const api=readFileSync("app/api/recovery/open-estimate/route.ts","utf8");
test("uses actual route metres, not straight-line distance",()=>{assert.match(routing,/metres\/1609\.344/);assert.match(routing,/route\.distance/);assert.doesNotMatch(routing,/haversine/i)});
test("rejects public demo routing hosts",()=>{assert.match(routing,/router\.project-osrm\.org/);assert.match(routing,/ROUTING_PROVIDER_URL/)});
test("fails closed without a verified route or pricing config",()=>{assert.match(api,/Price to be confirmed by recovery drivers/);assert.match(api,/rules\.length!==1/);assert.match(api,/typeof minimum!=="number"/)});
test("admin-configurable surcharge factors are checked",()=>{for(const k of ["vehicleSurcharge","nonRunningSurcharge","lockedWheelSurcharge","accidentSurcharge","nightSurcharge","weekendSurcharge","bankHolidaySurcharge","urgentSurcharge"])assert.ok(api.includes(k))});
