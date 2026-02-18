import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side geolocation endpoint.
 * Detects user's country from IP using Vercel/Cloudflare headers
 * or falls back to a server-side API call (no CORS issues).
 */
export async function GET(request: NextRequest) {
  // 1. Try platform headers first (free, instant, no external call)
  //    Vercel: x-vercel-ip-country
  //    Cloudflare: cf-ipcountry
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  const cfCountry = request.headers.get("cf-ipcountry");
  const platformCountry = vercelCountry || cfCountry;

  if (platformCountry && platformCountry !== "XX") {
    return NextResponse.json({ country_code: platformCountry });
  }

  // 2. Fallback: server-side fetch (no CORS since it's server-to-server)
  try {
    // Get the client's IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim();

    const url = clientIp
      ? `http://ip-api.com/json/${clientIp}?fields=countryCode`
      : `http://ip-api.com/json/?fields=countryCode`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(2000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.countryCode) {
        return NextResponse.json({ country_code: data.countryCode });
      }
    }
  } catch {
    // Silent fail
  }

  // 3. Default fallback
  return NextResponse.json({ country_code: "US" });
}
