import { createClient } from "@supabase/supabase-js";

// New interface for the properties of a terrace feature
export interface TerraceFeatureProperties {
  id: string; // Unique identifier for the terrace (e.g., address)
  // Dynamically includes time slots like t0900: boolean, t0930: boolean, etc.
  [key: string]: unknown; // Allows for dynamic time slot properties
}

// New interface for a GeoJSON feature representing a terrace
export interface TerraceFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: TerraceFeatureProperties;
}

// Add a type for a terrace record (matching the expected API usage)
export type TerraceRecord = {
  terrace_id: string;
  terrace_lat: number;
  terrace_lon: number;
  h_terrace?: number;
  date?: string;
  time_slot?: string;
  is_sunlit?: boolean;
  sun_altitude?: number;
  sun_azimuth?: number;
  distance_to_obstacle?: number;
  obstruction_height?: number;
  ray_height_at_obstacle?: number;
  obstruction_lat?: number;
  obstruction_lon?: number;
  [key: string]: unknown;
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "apero-soleil";
const FILE_PATH = "sunlight_results.geojson";

/**
 * Fetches and parses the GeoJSON file from Supabase private bucket.
 * Note: Caching is now handled at the API route level.
 */
export async function parseGeoJson(): Promise<TerraceFeature[]> {
  // Always fetch fresh data from Supabase
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(FILE_PATH);
  if (error || !data) {
    throw new Error("Failed to fetch GeoJSON from Supabase private bucket");
  }
  const text = await data.text();
  const geojson = JSON.parse(text);
  if (!geojson || !geojson.features || !Array.isArray(geojson.features)) {
    throw new Error("Invalid GeoJSON structure from Supabase");
  }
  return geojson.features as TerraceFeature[];
}

export async function getUniqueTerraces(): Promise<string[]> {
  const allFeatures = await parseGeoJson();
  const uniqueIds = new Set<string>();
  allFeatures.forEach((feature) => {
    uniqueIds.add(feature.properties.id);
  });
  return Array.from(uniqueIds);
}

export async function getAvailableTimeSlots(): Promise<string[]> {
  const allFeatures = await parseGeoJson();
  if (!allFeatures || allFeatures.length === 0) {
    return [];
  }
  // Infer time slots from the properties of the first feature
  const properties = allFeatures[0].properties;
  const timeSlots = Object.keys(properties).filter(
    (key) => key.startsWith("t") && !isNaN(parseInt(key.substring(1), 10))
  );
  return timeSlots.sort(); // Sort for consistency
}

// Helper to convert a TerraceFeature to a TerraceRecord
function featureToTerraceRecord(feature: TerraceFeature): TerraceRecord {
  const { id, ...rest } = feature.properties;
  return {
    terrace_id: id,
    terrace_lat: feature.geometry.coordinates[1],
    terrace_lon: feature.geometry.coordinates[0],
    ...rest,
  };
}

// Returns all terrace records for a given terraceId
export async function getTerraceRecords(
  terraceId: string
): Promise<TerraceRecord[]> {
  const features = await parseGeoJson();
  return features
    .filter((f) => f.properties.id === terraceId)
    .map(featureToTerraceRecord);
}

// Returns all terrace records, with optional filtering
export async function parseCsv(options?: {
  filter?: (record: TerraceRecord) => boolean;
}): Promise<TerraceRecord[]> {
  const features = await parseGeoJson();
  let records = features.map(featureToTerraceRecord);
  if (options?.filter) {
    records = records.filter(options.filter);
  }
  return records;
}
