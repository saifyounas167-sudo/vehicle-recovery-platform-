# UK location autocomplete configuration

The new shared location search is available in the homepage quick-quote and the five-step recovery request form.

## Configure

Set `GEOAPIFY_API_KEY` as a **server-only** environment variable on the Vercel project. Never use `NEXT_PUBLIC_` or commit the API key. Use a Geoapify plan/quota suitable for the expected autocomplete traffic and check its terms before launch. Redeploy after configuring it.

The API route `/api/recovery/location-suggest?q=...` uses Geoapify UK filtering and supports matching cities, towns, streets and locations. A small spelling-correction alias handles known misspellings (including `Brmigum` -> Birmingham). No geocoder can guarantee matches for every possible misspelling. Without the provider key, it can still look up some UK postcode prefixes via Postcodes.io, but **UK-wide city/address search is NOT functional** and the interface displays an honest fallback.

City/town selection is not a precise recovery pickup location. The recovery request **still requires a complete verified UK postcode and street/landmark confirmation** before progressing to a quote. The existing ORS routing, pricing, customer form steps and read-only safety restrictions are unchanged.

## Manual checks

- Type `Birm`, `Brmigum`, `Lon` and `Man`; results must resolve using real UK locations and no fictional data.
- Type `SW1A`; postcode-prefix suggestions should appear when the public lookup is accessible.
- Select a city; the five-step form should preserve it while requiring an exact postcode and address.
- Select a full postcode; confirm the existing postcode-checking flow works.
- Ensure dropdown selection and Escape / arrow / Enter keys work on desktop.
- Test iPhone/Android screen widths for no clipped fields, no overlay issues and no sideways scrolling.
- Ensure denial of GPS permission does not prevent manual location entry.
- Confirm the live postcode lookup and ORS route endpoints remain unchanged.

**Do not merge or advertise the feature as a complete UK-wide autocomplete until a real provider key is configured and browser tests verify the above.**
