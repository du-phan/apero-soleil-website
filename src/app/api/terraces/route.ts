import { NextRequest, NextResponse } from "next/server";
import { parseGeoJson, TerraceFeature } from "@/lib/data/csvParser";
// import { terraceRecordsToGeoJson, groupTerraceRecordsByTimeline } from "@/lib/data/dataTransformers";

// Load all terrace features into memory once
const allTerraceFeatures: TerraceFeature[] = parseGeoJson();

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

// Helper function to filter terraces based on bounding box
function getFilteredTerraces(
  // timeKey: string, // No longer needed here, client will handle current time
  bounds?: {
    swLng: number;
    swLat: number;
    neLng: number;
    neLat: number;
  }
): TerraceAPIResponse[] {
  let featuresToProcess = allTerraceFeatures;

  // 1. Filter by bounding box if bounds are provided
  if (bounds) {
    featuresToProcess = allTerraceFeatures.filter((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      return (
        lon >= bounds.swLng &&
        lon <= bounds.neLng &&
        lat >= bounds.swLat &&
        lat <= bounds.neLat
      );
    });
  }

  // 2. Map to API response format, passing through all properties
  const terraces = featuresToProcess.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const address = feature.properties.id.includes("demo")
      ? `Demo Terrace #${feature.properties.id.split("-")[1]}`
      : feature.properties.id;

    // Construct the response object, spreading all properties from the GeoJSON feature
    // This assumes feature.properties already contains t0900, t0930, etc.
    const responseTerrace: TerraceAPIResponse = {
      ...feature.properties, // Spread all properties from the source first
      id: feature.properties.id,
      lat: lat,
      lon: lon,
      address: address,
    };

    // Ensure core properties are not overwritten by spread if they have different names in source
    // For example, if source has 'terrace_id' instead of 'id', map explicitly.
    // Here, we assume 'id' is consistent.
    // We also delete the original 'id' from the spread properties if it was duplicated,
    // or ensure the intended 'id' (and lat/lon/address) takes precedence.
    // The current `TerraceFeature` properties seem to be just 'id' and time keys.
    // If `feature.properties` has a conflicting `lat`, `lon`, or `address`, this needs careful handling.
    // Assuming `feature.properties` primarily contains `id` and `tXXXX` keys.

    return responseTerrace;
  });

  return terraces;
}

// The actual API route handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Get time parameter - NO LONGER USED FOR FILTERING HERE
  // const timeKey = searchParams.get("time");

  // Get bounding box parameters
  const swLngParam = searchParams.get("swLng");
  const swLatParam = searchParams.get("swLat");
  const neLngParam = searchParams.get("neLng");
  const neLatParam = searchParams.get("neLat");

  console.log(
    `[API] Request parameters - bounds: ${swLngParam},${swLatParam} to ${neLngParam},${neLatParam}` // Removed timeKey from log
  );

  // Validate required timeKey - NO LONGER REQUIRED
  // if (!timeKey || !timeKey.startsWith("t")) {
  //   console.error(`[API] Invalid time parameter: ${timeKey}`);
  //   return NextResponse.json(
  //     {
  //       error: 'Invalid or missing "time" parameter. Expected format: "tHHMM"',
  //     },
  //     { status: 400 }
  //   );
  // }

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

  const terraces = getFilteredTerraces(bounds); // Removed timeKey argument

  // Note: The 'limit' parameter from the original code is not used here as
  // viewport filtering is the primary mechanism. If needed, it could be added back
  // to slice the 'terraces' array before responding.

  return NextResponse.json(terraces);
}
