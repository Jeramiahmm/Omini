/**
 * Mapbox Geocoding API client.
 * Converts addresses to lat/lng coordinates.
 * Bounded to the Longmont/Boulder/Lyons service area.
 */

// Bounding box: SW corner to NE corner covering service area
const SERVICE_BBOX = "-105.40,39.95,-105.00,40.30"; // Boulder to Lyons area

export interface GeocodeSuggestion {
  text: string;
  placeName: string;
  lat: number;
  lng: number;
}

export async function searchAddress(
  query: string,
  token: string
): Promise<GeocodeSuggestion[]> {
  if (!query || query.length < 3 || !token) return [];

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&bbox=${SERVICE_BBOX}&limit=5&types=address,poi&country=US`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.features || []).map((f: { text: string; place_name: string; center: [number, number] }) => ({
      text: f.text,
      placeName: f.place_name,
      lat: f.center[1],
      lng: f.center[0],
    }));
  } catch {
    return [];
  }
}

export async function geocodeAddress(
  address: string,
  token: string
): Promise<{ lat: number; lng: number; address: string } | null> {
  const results = await searchAddress(address, token);
  return results.length > 0
    ? { lat: results[0].lat, lng: results[0].lng, address: results[0].placeName }
    : null;
}

export async function batchGeocode(
  addresses: string[],
  token: string
): Promise<{ address: string; lat: number; lng: number; original: string; failed: boolean }[]> {
  const results = [];
  for (const addr of addresses) {
    const trimmed = addr.trim();
    if (!trimmed) continue;
    const geo = await geocodeAddress(trimmed, token);
    if (geo) {
      results.push({ ...geo, original: trimmed, failed: false });
    } else {
      results.push({ address: trimmed, lat: 0, lng: 0, original: trimmed, failed: true });
    }
  }
  return results;
}
