import type { TerraceRecord } from "./csvParser";
import { Terrace } from "@/contexts/TerraceContext";

export interface GeoJsonFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: string;
    isSunlit: boolean;
    [key: string]: any;
  };
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

/**
 * Convert terrace records to GeoJSON feature collection
 */
export function terraceRecordsToGeoJson(
  records: TerraceRecord[]
): GeoJsonFeatureCollection {
  const features: GeoJsonFeature[] = records.map((record) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [record.terrace_lon, record.terrace_lat],
    },
    properties: {
      id: record.terrace_id,
      isSunlit: record.is_sunlit,
      date: record.date,
      timeSlot: record.time_slot,
      sunAltitude: record.sun_altitude,
      sunAzimuth: record.sun_azimuth,
      terraceHeight: record.h_terrace,
      // Add optional properties if they exist
      ...(record.distance_to_obstacle && {
        distanceToObstacle: record.distance_to_obstacle,
      }),
      ...(record.obstruction_height && {
        obstructionHeight: record.obstruction_height,
      }),
      ...(record.ray_height_at_obstacle && {
        rayHeightAtObstacle: record.ray_height_at_obstacle,
      }),
      ...(record.obstruction_lat && { obstructionLat: record.obstruction_lat }),
      ...(record.obstruction_lon && { obstructionLon: record.obstruction_lon }),
    },
  }));

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Group terrace records by ID for timeline visualization
 */
export function groupTerraceRecordsByTimeline(
  records: TerraceRecord[]
): Record<string, { time: string; isSunlit: boolean }[]> {
  const terraceTimelines: Record<
    string,
    { time: string; isSunlit: boolean }[]
  > = {};

  // First, group by terrace ID
  records.forEach((record) => {
    if (!terraceTimelines[record.terrace_id]) {
      terraceTimelines[record.terrace_id] = [];
    }

    terraceTimelines[record.terrace_id].push({
      time: record.time_slot,
      isSunlit: record.is_sunlit,
    });
  });

  // Sort each timeline by time
  Object.keys(terraceTimelines).forEach((terraceId) => {
    terraceTimelines[terraceId].sort((a, b) => {
      return a.time.localeCompare(b.time);
    });
  });

  return terraceTimelines;
}

/**
 * Create sunshine timeline data for heat indicators
 */
export function createSunshineHeatMap(
  records: TerraceRecord[]
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};

  // Group records by date and time slot
  records.forEach((record) => {
    if (!result[record.date]) {
      result[record.date] = {};
    }

    if (!result[record.date][record.time_slot]) {
      result[record.date][record.time_slot] = 0;
    }

    if (record.is_sunlit) {
      result[record.date][record.time_slot]++;
    }
  });

  return result;
}

/**
 * Transform Terrace objects from context to GeoJSON format
 */
export function transformTerracesToGeoJson(
  terraces: Terrace[]
): GeoJsonFeatureCollection {
  const features: GeoJsonFeature[] = terraces.map((terrace) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [terrace.lon, terrace.lat],
    },
    properties: {
      id: terrace.id,
      isSunlit: terrace.isSunlit,
      address: terrace.address,
    },
  }));

  return {
    type: "FeatureCollection",
    features,
  };
}
