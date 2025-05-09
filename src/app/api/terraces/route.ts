import { NextRequest, NextResponse } from "next/server";
import { parseGeoJson, TerraceFeature } from "@/lib/data/csvParser";
// import { terraceRecordsToGeoJson, groupTerraceRecordsByTimeline } from "@/lib/data/dataTransformers";

// Define the structure for a terrace in our API response
// This should now align with the main Terrace type which includes all time properties
interface TerraceAPIResponse {
  id: string;
  lat: number;
  lon: number;
  address: string;
  // isSunlit is no longer determined by the API directly based on a single timeKey
  // sunAzimuth and sunAltitude can be included if available in feature.properties
  sunAzimuth?: number;
  sunAltitude?: number;
  // Index signature to include all time slot properties like t0900, t0930
  [key: `t${string}`]: boolean | number | string | undefined;
}

// --- In-memory cache for terrace GeoJSON (moved from csvParser) ---
let cachedGeoJson: TerraceFeature[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// The actual API route handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Get bounding box parameters
  const swLngParam = searchParams.get("swLng");
  const swLatParam = searchParams.get("swLat");
  const neLngParam = searchParams.get("neLng");
  const neLatParam = searchParams.get("neLat");

  console.log(
    `[API] Request parameters - bounds: ${swLngParam},${swLatParam} to ${neLngParam},${neLatParam}`
  );

  let bounds;
  if (swLngParam && swLatParam && neLngParam && neLatParam) {
    bounds = {
      swLng: parseFloat(swLngParam),
      swLat: parseFloat(swLatParam),
      neLng: parseFloat(neLngParam),
      neLat: parseFloat(neLatParam),
    };
    if (
      isNaN(bounds.swLng) ||
      isNaN(bounds.swLat) ||
      isNaN(bounds.neLng) ||
      isNaN(bounds.neLat)
    ) {
      console.error(`[API] Invalid bounding box parameters`);
      return NextResponse.json(
        { error: "Invalid bounding box parameters. All must be numbers." },
        { status: 400 }
      );
    }
  }

  try {
    // --- Caching logic ---
    let allTerraceFeatures: TerraceFeature[];
    const now = Date.now();
    if (cachedGeoJson && now - cacheTimestamp < CACHE_TTL) {
      allTerraceFeatures = cachedGeoJson;
    } else {
      try {
        allTerraceFeatures = await parseGeoJson();
        cachedGeoJson = allTerraceFeatures;
        cacheTimestamp = now;
      } catch (fetchError) {
        if (cachedGeoJson) {
          console.warn(
            "[API] Supabase fetch failed, serving stale cache.",
            fetchError
          );
          allTerraceFeatures = cachedGeoJson;
        } else {
          throw fetchError;
        }
      }
    }

    let featuresToProcess: TerraceFeature[] = allTerraceFeatures;

    // 1. Filter by bounding box if bounds are provided
    if (bounds) {
      featuresToProcess = allTerraceFeatures.filter(
        (feature: TerraceFeature) => {
          const [lon, lat] = feature.geometry.coordinates;
          return (
            lon >= bounds.swLng &&
            lon <= bounds.neLng &&
            lat >= bounds.swLat &&
            lat <= bounds.neLat
          );
        }
      );
    }

    // 2. Map to API response format, passing through all properties
    const terraces: TerraceAPIResponse[] = featuresToProcess.map(
      (feature: TerraceFeature) => {
        const [lon, lat] = feature.geometry.coordinates;
        const address = feature.properties.id.includes("demo")
          ? `Demo Terrace #${feature.properties.id.split("-")[1]}`
          : feature.properties.id;
        return {
          ...feature.properties,
          id: feature.properties.id,
          lat: lat,
          lon: lon,
          address: address,
        };
      }
    );

    return NextResponse.json(terraces);
  } catch (error) {
    console.error("[API] Error loading terrace data:", error);
    return NextResponse.json(
      { error: "Failed to load terrace data" },
      { status: 500 }
    );
  }
}
