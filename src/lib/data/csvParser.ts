import fs from "fs";
import path from "path";

export interface TerraceRecord {
  terrace_id: string;
  terrace_lat: number;
  terrace_lon: number;
  date: string;
  time_slot: string;
  is_sunlit: boolean;
  sun_altitude?: number;
  sun_azimuth?: number;
  h_terrace?: number;
  distance_to_obstacle?: number;
  obstruction_height?: number;
  ray_height_at_obstacle?: number;
  obstruction_lat?: number;
  obstruction_lon?: number;
}

export interface ParseOptions {
  limit?: number;
  filter?: (record: TerraceRecord) => boolean;
}

const GEOJSON_PATH = path.join(
  process.cwd(),
  "src/data/sunlight_results_20250504_174453.geojson"
);

/**
 * Parse GeoJSON data of terrace sunshine records
 */
export async function parseGeoJson(
  options: ParseOptions = {}
): Promise<TerraceRecord[]> {
  const { limit, filter } = options;
  const fileContent = fs.readFileSync(GEOJSON_PATH, "utf8");
  const geojson = JSON.parse(fileContent);
  const results: TerraceRecord[] = [];

  for (const feature of geojson.features) {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;
    const record: TerraceRecord = {
      terrace_id: props.terrace_id,
      terrace_lat: coords[1],
      terrace_lon: coords[0],
      date: props.date,
      time_slot: props.time_slot,
      is_sunlit: props.is_sunlit,
      sun_altitude: props.sun_altitude,
      sun_azimuth: props.sun_azimuth,
      h_terrace: props.h_terrace,
      distance_to_obstacle: props.distance_to_obstacle,
      obstruction_height: props.obstruction_height,
      ray_height_at_obstacle: props.ray_height_at_obstacle,
      obstruction_lat: props.obstruction_lat,
      obstruction_lon: props.obstruction_lon,
    };
    if (filter && !filter(record)) continue;
    results.push(record);
    if (limit && results.length >= limit) break;
  }
  return results;
}

export async function getUniqueTerraces(): Promise<string[]> {
  const allRecords = await parseGeoJson();
  const uniqueIds = new Set<string>();
  allRecords.forEach((record) => {
    uniqueIds.add(record.terrace_id);
  });
  return Array.from(uniqueIds);
}

export async function getTerraceRecords(
  terraceId: string
): Promise<TerraceRecord[]> {
  const records = await parseGeoJson({
    filter: (record) => record.terrace_id === terraceId,
  });
  return records;
}

export async function getTerracesByDateTime(
  date: string,
  timeSlot?: string
): Promise<TerraceRecord[]> {
  const records = await parseGeoJson({
    filter: (record) => {
      if (timeSlot && timeSlot.length > 0) {
        return record.date === date && record.time_slot === timeSlot;
      }
      return record.date === date;
    },
  });
  return records;
}

export async function getSunnyTerraces(
  date: string,
  timeSlot: string
): Promise<TerraceRecord[]> {
  const records = await parseGeoJson({
    filter: (record) =>
      record.date === date &&
      record.time_slot === timeSlot &&
      record.is_sunlit === true,
  });
  return records;
}

export async function getAvailableDates(): Promise<string[]> {
  const allRecords = await parseGeoJson();
  const uniqueDates = new Set<string>();
  allRecords.forEach((record) => {
    uniqueDates.add(record.date);
  });
  return Array.from(uniqueDates).sort();
}

export async function getAvailableTimeSlots(): Promise<string[]> {
  const allRecords = await parseGeoJson();
  const uniqueTimeSlots = new Set<string>();
  allRecords.forEach((record) => {
    uniqueTimeSlots.add(record.time_slot);
  });
  return Array.from(uniqueTimeSlots).sort();
}
