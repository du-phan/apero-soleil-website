import { NextRequest, NextResponse } from "next/server";
import { getTerraceRecords } from "@/lib/data/csvParser";
import { groupTerraceRecordsByTimeline } from "@/lib/data/dataTransformers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: terraceId } = await context.params;

  if (!terraceId) {
    return NextResponse.json(
      { error: "Terrace ID is required" },
      { status: 400 }
    );
  }

  try {
    // Get all records for this terrace
    const terraceRecords = await getTerraceRecords(terraceId);

    if (terraceRecords.length === 0) {
      return NextResponse.json({ error: "Terrace not found" }, { status: 404 });
    }

    // Get the first record to extract terrace metadata
    const firstRecord = terraceRecords[0];
    const terraceInfo = {
      id: firstRecord.terrace_id,
      location: {
        lat: firstRecord.terrace_lat,
        lon: firstRecord.terrace_lon,
      },
      height: firstRecord.h_terrace,
    };

    // Group records by time to create a timeline of sun/shade status
    const sunTimeline =
      groupTerraceRecordsByTimeline(terraceRecords)[terraceId];

    return NextResponse.json({
      terrace: terraceInfo,
      timeline: sunTimeline,
    });
  } catch (error) {
    console.error(`Error fetching terrace ${terraceId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch terrace data" },
      { status: 500 }
    );
  }
}
