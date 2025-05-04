import { NextRequest, NextResponse } from "next/server";
import {
  getTerracesByDateTime,
  getSunnyTerraces,
  getAvailableDates,
  getAvailableTimeSlots,
} from "@/lib/data/csvParser";
import {
  terraceRecordsToGeoJson,
  groupTerraceRecordsByTimeline,
} from "@/lib/data/dataTransformers";
// import { Terrace } from "@/contexts/TerraceContext"; // Remove unused import
// Remove fs, path, csv-parse/sync imports

// Define the structure for a terrace in our API response
interface Terrace {
  id: string;
  lat: number;
  lon: number;
  address: string;
  isSunlit: boolean;
}

// Filter terraces by date and time using the new loader
async function filterTerraces(date: string, time: string): Promise<Terrace[]> {
  // Find closest time slot (assuming time slots are in 30-min increments like "09:00", "09:30", etc.)
  const hour = parseInt(time.split(":")[0], 10);
  const minute = parseInt(time.split(":")[1], 10);
  const closestMinute = minute < 15 ? "00" : minute < 45 ? "30" : "00";
  const closestHour = minute >= 45 ? (hour + 1) % 24 : hour;
  const closestTime = `${String(closestHour).padStart(
    2,
    "0"
  )}:${closestMinute}`;

  // Use the new loader
  const filteredRecords = await getTerracesByDateTime(date, closestTime);

  // Map to API response format and remove duplicates (keep one entry per terrace)
  const terraceMap = new Map<string, Terrace>();

  filteredRecords.forEach((record) => {
    terraceMap.set(record.terrace_id, {
      id: record.terrace_id,
      lat: record.terrace_lat,
      lon: record.terrace_lon,
      address: record.terrace_id, // Use terrace_id as address fallback
      isSunlit: record.is_sunlit,
    });
  });

  return Array.from(terraceMap.values());
}

// The actual API route handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Get date and time parameters
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];
  const time =
    searchParams.get("time") || new Date().toTimeString().substring(0, 5);

  const terraces = await filterTerraces(date, time);

  // For demo purposes, if no terraces found, generate some random ones in Paris
  if (terraces.length === 0) {
    const demoTerraces: Terrace[] = [];
    const parisCenter = [2.3522, 48.8566];

    // Generate 20 random terraces around Paris
    for (let i = 0; i < 20; i++) {
      // Random offsets within ~2km
      const lonOffset = (Math.random() - 0.5) * 0.04;
      const latOffset = (Math.random() - 0.5) * 0.02;

      demoTerraces.push({
        id: `demo-${i}`,
        lon: parisCenter[0] + lonOffset,
        lat: parisCenter[1] + latOffset,
        address: `Demo Terrace #${i + 1}`,
        isSunlit: Math.random() > 0.4, // 60% chance of being sunny
      });
    }

    return NextResponse.json(demoTerraces);
  }

  return NextResponse.json(terraces);
}
