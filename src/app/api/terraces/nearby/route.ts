import { NextRequest, NextResponse } from "next/server";
import { parseCsv, type TerraceRecord } from "@/lib/data/csvParser";
import { terraceRecordsToGeoJson } from "@/lib/data/dataTransformers";

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // in kilometers
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lon = parseFloat(searchParams.get("lon") || "0");
  const radius = parseFloat(searchParams.get("radius") || "0.5"); // Default 500m
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const onlySunny = searchParams.get("sunny") === "true";

  // Validate coordinates
  if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) {
    return NextResponse.json(
      { error: "Valid latitude and longitude parameters are required" },
      { status: 400 }
    );
  }

  // Validate required parameters
  if (!date || !time) {
    return NextResponse.json(
      { error: "Date and time parameters are required" },
      { status: 400 }
    );
  }

  try {
    // Get all terrace records for the date/time
    const allTerraces = await parseCsv({
      filter: (record) => {
        // Filter by date and time first
        if (record.date !== date || record.time_slot !== time) {
          return false;
        }

        // Filter by sunshine if required
        if (onlySunny && !record.is_sunlit) {
          return false;
        }

        return true;
      },
    });

    // Filter terraces by distance
    const nearbyTerraces = allTerraces.filter((terrace) => {
      const distance = calculateDistance(
        lat,
        lon,
        terrace.terrace_lat,
        terrace.terrace_lon
      );
      return distance <= radius;
    });

    // Sort by distance from provided coordinates
    nearbyTerraces.sort((a, b) => {
      const distA = calculateDistance(lat, lon, a.terrace_lat, a.terrace_lon);
      const distB = calculateDistance(lat, lon, b.terrace_lat, b.terrace_lon);
      return distA - distB;
    });

    // Add distance to each terrace
    const terracesWithDistance = nearbyTerraces.map((terrace) => {
      const distance = calculateDistance(
        lat,
        lon,
        terrace.terrace_lat,
        terrace.terrace_lon
      );

      return {
        ...terrace,
        distance_from_search: distance,
      };
    });

    // Convert to GeoJSON
    const geoJson = terraceRecordsToGeoJson(terracesWithDistance);

    return NextResponse.json({
      ...geoJson,
      meta: {
        count: nearbyTerraces.length,
        searchPoint: { lat, lon },
        radius,
        date,
        time,
        onlySunny,
      },
    });
  } catch (error) {
    console.error("Error finding nearby terraces:", error);
    return NextResponse.json(
      { error: "Failed to find nearby terraces" },
      { status: 500 }
    );
  }
}
