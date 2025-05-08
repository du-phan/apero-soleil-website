import fs from "fs";
import path from "path";

// New interface for the properties of a terrace feature
export interface TerraceFeatureProperties {
  id: string; // Unique identifier for the terrace (e.g., address)
  // Dynamically includes time slots like t0900: boolean, t0930: boolean, etc.
  [key: string]: any; // Allows for dynamic time slot properties
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

const GEOJSON_PATH = path.join(
  process.cwd(),
  "src/data/sunlight_results.geojson"
);

// Helper to verify the GeoJSON file exists
function verifyGeoJsonFile(): boolean {
  try {
    const exists = fs.existsSync(GEOJSON_PATH);
    console.log(
      `[csvParser] GeoJSON file exists: ${exists} at path: ${GEOJSON_PATH}`
    );
    if (exists) {
      const stats = fs.statSync(GEOJSON_PATH);
      console.log(
        `[csvParser] GeoJSON file size: ${(stats.size / 1024 / 1024).toFixed(
          2
        )} MB`
      );
    }
    return exists;
  } catch (error) {
    console.error(`[csvParser] Error verifying GeoJSON file: ${error}`);
    return false;
  }
}

/**
 * Parses the optimized GeoJSON file of terrace sunshine records.
 * This version reads the entire file synchronously as it's expected to be smaller.
 */
export function parseGeoJson(): TerraceFeature[] {
  try {
    console.log(`[csvParser] Starting to parse GeoJSON file...`);

    if (!verifyGeoJsonFile()) {
      console.error(`[csvParser] GeoJSON file not found at: ${GEOJSON_PATH}`);
      return [];
    }

    console.log(`[csvParser] Reading file content...`);
    const fileContent = fs.readFileSync(GEOJSON_PATH, "utf8");
    console.log(
      `[csvParser] File read successfully. Content length: ${fileContent.length} characters`
    );

    console.log(`[csvParser] Parsing JSON...`);
    const geojson = JSON.parse(fileContent);
    console.log(`[csvParser] JSON parsed successfully.`);

    if (!geojson || !geojson.features || !Array.isArray(geojson.features)) {
      console.error(
        `[csvParser] Invalid GeoJSON structure: missing or invalid features array`
      );
      console.log(
        `[csvParser] GeoJSON structure:`,
        JSON.stringify({
          type: geojson?.type,
          featuresExists: !!geojson?.features,
          featuresIsArray: Array.isArray(geojson?.features),
          featuresLength: geojson?.features?.length || 0,
        })
      );
      return [];
    }

    const features = geojson.features as TerraceFeature[];
    console.log(`[csvParser] Found ${features.length} features in GeoJSON`);

    // Check the structure of the first feature for validation
    if (features.length > 0) {
      const firstFeature = features[0];
      const hasValidGeometry =
        firstFeature.geometry &&
        firstFeature.geometry.type === "Point" &&
        Array.isArray(firstFeature.geometry.coordinates) &&
        firstFeature.geometry.coordinates.length === 2;

      const hasValidProperties =
        firstFeature.properties &&
        typeof firstFeature.properties.id === "string";

      console.log(`[csvParser] First feature validation:`, {
        hasValidGeometry,
        hasValidProperties,
        geometryType: firstFeature.geometry?.type,
        coordinatesLength: firstFeature.geometry?.coordinates?.length,
        idExists: !!firstFeature.properties?.id,
      });

      // Check for time properties
      const timeProps = Object.keys(firstFeature.properties).filter(
        (key) => key.startsWith("t") && !isNaN(parseInt(key.substring(1)))
      );

      console.log(
        `[csvParser] Found ${timeProps.length} time properties in first feature`
      );
      console.log(`[csvParser] Sample time properties:`, timeProps.slice(0, 5));

      // Check for duplicate IDs
      const idCounts: Record<string, number> = {};
      features.forEach((f) => {
        const id = f.properties.id;
        idCounts[id] = (idCounts[id] || 0) + 1;
      });

      const duplicateIds = Object.entries(idCounts)
        .filter(([, count]) => count > 1)
        .map(([id]) => id);

      if (duplicateIds.length > 0) {
        console.warn(
          `[csvParser] Found ${duplicateIds.length} duplicate terrace IDs`
        );
        console.warn(
          `[csvParser] First 5 duplicate IDs:`,
          duplicateIds.slice(0, 5)
        );
      } else {
        console.log(`[csvParser] No duplicate terrace IDs found - good!`);
      }
    }

    return features;
  } catch (error) {
    console.error(`[csvParser] Error parsing GeoJSON: ${error}`);
    return [];
  }
}

export function getUniqueTerraces(): string[] {
  const allFeatures = parseGeoJson();
  const uniqueIds = new Set<string>();
  allFeatures.forEach((feature) => {
    uniqueIds.add(feature.properties.id);
  });
  return Array.from(uniqueIds);
}

export function getAvailableTimeSlots(): string[] {
  const allFeatures = parseGeoJson();
  if (!allFeatures || allFeatures.length === 0) {
    return [];
  }
  // Infer time slots from the properties of the first feature
  // Exclude 'id', 'terrace_lat', 'terrace_lon' or other non-timeslot properties
  const properties = allFeatures[0].properties;
  const timeSlots = Object.keys(properties).filter(
    (key) => key.startsWith("t") && !isNaN(parseInt(key.substring(1), 10))
    // Add more specific filtering if 'terrace_lat', 'terrace_lon' are still present
    // and not desired, e.g. key !== 'id' && key !== 'terrace_lat' && key !== 'terrace_lon'
  );
  return timeSlots.sort(); // Sort for consistency
}
