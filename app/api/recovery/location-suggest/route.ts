import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const postcode = /^(?:GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;
const aliases: Record<string, string> = {
  brmigum: "Birmingham",
  birmingum: "Birmingham",
  brmingham: "Birmingham",
  birminham: "Birmingham",
  edinbrgh: "Edinburgh",
  manchstr: "Manchester",
  lecester: "Leicester",
  gloster: "Gloucester",
};
type Suggestion = {
  id: string;
  label: string;
  detail: string;
  postcode: string | null;
  kind: string;
};
const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().replace(/\s+/g, " ") ?? "";
  if (q.length < 2 || q.length > 90 || /[<>{}\u0000-\u001f]/.test(q)) {
    return json({ suggestions: [], message: "Enter at least two characters (maximum 90)." }, 400);
  }

  const result: Suggestion[] = [];
  let unavailable = false;
  const key = process.env.GEOAPIFY_API_KEY?.trim();

  if (key) {
    try {
      const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
      url.searchParams.set("text", aliases[q.toLowerCase()] || q);
      url.searchParams.set("filter", "countrycode:gb");
      url.searchParams.set("format", "json");
      url.searchParams.set("lang", "en");
      url.searchParams.set("limit", "8");
      url.searchParams.set("apiKey", key);
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error("Autocomplete unavailable");
      const data = (await response.json()) as {
        results?: Array<{
          place_id?: string; formatted?: string; address_line1?: string; address_line2?: string;
          postcode?: string; result_type?: string; city?: string; county?: string;
          country_code?: string; lat?: number; lon?: number;
        }>;
      };
      for (const p of data.results ?? []) {
        if (p.country_code?.toLowerCase() !== "gb") continue;
        const label = (p.formatted || p.address_line1 || p.city || "").trim();
        if (!label) continue;
        const kind = p.result_type || "location";
        const exactPostcode = typeof p.postcode === "string" && postcode.test(p.postcode.trim())
          && ["postcode", "building", "amenity"].includes(kind)
          ? p.postcode.trim().toUpperCase() : null;
        result.push({
          id: p.place_id || "place-" + result.length + "-" + label,
          label,
          detail: [kind.replace(/_/g, " "), p.county].filter(Boolean).join(" · "),
          postcode: exactPostcode,
          kind,
        });
      }
    } catch {
      unavailable = true;
    }
  } else {
    unavailable = true;
  }

  // Free postcode prefix lookup works even when optional Geoapify is not configured.
  if (/^[a-z]{1,2}\d[a-z\d]?(?:\s?\d[a-z]{0,2})?$/i.test(q.replace(/\s/g, ""))) {
    try {
      const prefix = q.replace(/\s/g, "");
      const response = await fetch(
        "https://api.postcodes.io/postcodes/" + encodeURIComponent(prefix) + "/autocomplete?limit=8",
        { cache: "no-store", signal: AbortSignal.timeout(5500) }
      );
      if (response.ok) {
        const data = (await response.json()) as { result?: string[] | null };
        for (const pc of data.result ?? []) {
          if (!postcode.test(pc)) continue;
          result.push({ id: "postcode-" + pc, label: pc.toUpperCase() + ", United Kingdom", detail: "UK postcode", postcode: pc.toUpperCase(), kind: "postcode" });
        }
      }
    } catch {
      // Keep the location-provider results when postcode lookup is unavailable.
    }
  }

  const seen = new Set<string>();
  const suggestions = result.filter((x) => {
    const code = x.postcode?.replace(/\s/g, "") || x.label.toLowerCase();
    if (seen.has(code)) return false;
    seen.add(code);
    return true;
  }).slice(0, 8);

  return json({
    suggestions,
    unavailable: unavailable && suggestions.length === 0,
    message: unavailable && suggestions.length === 0
      ? "UK location suggestions are temporarily unavailable. You can enter a complete UK postcode manually."
      : undefined,
  });
}
