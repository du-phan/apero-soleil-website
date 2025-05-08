import { NextRequest, NextResponse } from "next/server";
import { parseGeoJson, TerraceFeature } from "@/lib/data/csvParser";
// import { terraceRecordsToGeoJson, groupTerraceRecordsByTimeline } from "@/lib/data/dataTransformers";

// Load all terrace features into memory once
const allTerraceFeatures: TerraceFeature[] = parseGeoJson();

// Define the structure for a terrace in our API response
interface TerraceAPIResponse {
  id: string;
  lat: number;
  lon: number;
  address: string;
  isSunlit: boolean;
  sunAzimuth?: number;
  sunAltitude?: number;
}

// Helper function to filter terraces based on time and bounding box
function getFilteredTerraces(
  timeKey: string, // e.g., "t1000", "t1030"
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

  // 2. Map to API response format, adding isSunlit based on timeKey
  const terraces = featuresToProcess.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const address = feature.properties.id.includes("demo")
      ? `Demo Terrace #${feature.properties.id.split("-")[1]}`
      : feature.properties.id; // Use the ID as the address, or format as needed

    const isSunlit = !!feature.properties[timeKey]; // Ensure boolean, true if property exists and is true-thy

    return {
      id: feature.properties.id,
      lat: lat,
      lon: lon,
      address: address,
      isSunlit: isSunlit,
      // sunAzimuth and sunAltitude are not in the new primary GeoJSON properties by default.
      // If they were added back to properties, they could be accessed here:
      // sunAzimuth: feature.properties.sun_azimuth,
      // sunAltitude: feature.properties.sun_altitude,
    };
  });

  return terraces;
}

// The actual API route handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Get time parameter (e.g., "t1000", "t1030")
  // Client should format this from a Date object or time picker
  const timeKey = searchParams.get("time"); // Example: "t1000"

  // Get bounding box parameters
  const swLngParam = searchParams.get("swLng");
  const swLatParam = searchParams.get("swLat");
  const neLngParam = searchParams.get("neLng");
  const neLatParam = searchParams.get("neLat");

  console.log(
    `[API] Request parameters - timeKey: ${timeKey}, bounds: ${swLngParam},${swLatParam} to ${neLngParam},${neLatParam}`
  );

  // Validate required timeKey
  if (!timeKey || !timeKey.startsWith("t")) {
    console.error(`[API] Invalid time parameter: ${timeKey}`);
    return NextResponse.json(
      {
        error: 'Invalid or missing "time" parameter. Expected format: "tHHMM"',
      },
      { status: 400 }
    );
  }

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

  const terraces = getFilteredTerraces(timeKey, bounds);

  // Note: The 'limit' parameter from the original code is not used here as
  // viewport filtering is the primary mechanism. If needed, it could be added back
  // to slice the 'terraces' array before responding.

  return NextResponse.json(terraces);
}
