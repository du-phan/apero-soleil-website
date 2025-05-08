# Map Visualization Scaling Analysis Report

**Date:** 2025-05-04

## Executive Summary

This report analyzes the challenges encountered in visualizing a growing dataset of Parisian terraces (initially 10,000, targeting 30,000+) within the Apero Soleil web application. The primary issue stemmed from an inefficient initial data structure (highly redundant GeoJSON, 111MB+), leading to performance bottlenecks and memory limitations in both data loading and rendering. Initial attempts to mitigate this via data streaming proved complex and addressed the symptom rather than the root cause.

The core recommendation is to **restructure the source GeoJSON data** to represent each physical terrace as a single feature, embedding time-varying sunlit information within its properties. This drastically reduces data size and complexity.

Combined with this data restructuring, the recommended implementation strategy involves:

1.  Simplifying the backend API and data parsing logic.
2.  Implementing **viewport-based data loading** on the frontend (fetching only visible data).
3.  Continuing to use **client-side clustering** via MapLibre GL JS for efficient rendering.

This approach mirrors common industry best practices for datasets of this scale, avoids the immediate need for heavier server-side vector tiling solutions, and provides a solid foundation for future enhancements like advanced filtering.

## 1. Problem Statement

The application needs to display information about Parisian terraces, including their sunlit status at different times of the day. The initial dataset comprised ~10,000 unique terrace locations. However, the source GeoJSON file (`src/data/sunlight_results.geojson`) represented each observation (terrace + date + time slot) as a separate GeoJSON feature.

**Issues Encountered:**

- **Excessive Data Size:** With ~20 time slots per terrace per day, the GeoJSON file ballooned to over 111MB, containing hundreds of thousands of features despite only representing 10,000 physical locations.
- **Performance Degradation:** Loading and processing this large file caused significant performance issues and memory limitations, making the application unresponsive or unable to load the actual data (falling back to demo data).
- **Scalability Concerns:** The original approach would not scale effectively to the target dataset size of 30,000+ unique terraces, as the file size and feature count would grow linearly with both the number of terraces and the number of time slots observed.

The goal is to efficiently load, process, and visualize up to 30,000+ terrace locations on an interactive map, allowing users to filter by time and see sunlit status, while maintaining a smooth and responsive user experience.

## 2. Analysis of Situation & Implementations

### 2.1. Original Data Format & Loading (`fs.readFileSync`)

- **Format:** GeoJSON `FeatureCollection` where each `Feature` represented a single `(terrace_id, date, time_slot)` observation. Geometry and static properties were repeated for every time slot for the same terrace.
- **Loading (`csvParser.ts` v1):** Used Node.js `fs.readFileSync` to load the entire 111MB+ file into memory, followed by `JSON.parse`.
- **Outcome:** Failed due to excessive memory consumption and slow parsing times for such a large file. The API endpoint often timed out or crashed, leading to the demo data fallback.

### 2.2. Intermediate Streaming Attempt (`csvParser.ts` v2/v3)

- **Rationale:** To avoid loading the entire file into memory, a streaming approach was implemented.
- **Implementation:**
  - v2 attempted using the `JSONStream` library, but encountered dependency/typing issues.
  - v3 implemented a manual chunk-based parsing logic using Node.js `createReadStream`.
- **Outcome:** While technically feasible, this significantly increased the complexity of the `csvParser.ts` module. More importantly, it only addressed the _loading_ symptom, not the underlying _data redundancy_ problem. The API still had to process a massive stream of redundant features.

### 2.3. Current Rendering (`MapView.tsx`)

- **Technology:** Uses `maplibre-gl` for rendering.
- **Clustering:** Implemented client-side clustering using MapLibre's built-in capabilities (`cluster: true` in `addSource`). This is effective for _rendering_ large numbers of points already loaded on the client.
- **Limitation:** Clustering only helps once the data is loaded. It doesn't solve the initial data fetching/processing bottleneck caused by the large, redundant dataset.

## 3. Proposed Optimal Data Structure

The most significant optimization is to restructure the GeoJSON data itself.

- **Format:** GeoJSON `FeatureCollection`.
- **Features:** Exactly one `Feature` per unique `terrace_id`.
- **Geometry:** `Point` geometry stored once per terrace.
- **Properties:**
  - Static terrace info (`id`, which is its address in Paris).
  - Time-varying data embedded directly in properties using a consistent key scheme (e.g., `tHHMM`).
  - Value for each time key is a simple boolean (`true` for sunlit, `false` for shaded).

**Example Feature:**

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [2.35, 48.85] },
  "properties": {
    "id": "21 RUE FRANCOIS MIRON, 75004",
    "t0900": true,
    "t0930": true,
    "t1000": false,
    // ... all time slots ...
    "t1800": false
  }
}
```

**Benefits:**

- **Drastic Size Reduction:** Eliminates geometric redundancy, reducing file size likely by >90% (e.g., < 10-20MB for 30k terraces).
- **Simplified Loading:** The smaller file can be loaded efficiently using `fs.readFileSync` + `JSON.parse`.
- **Efficient API Lookup:** The API loads the small dataset and performs fast property lookups (`properties[timeKey]`) to determine sunlit status for the requested time. No complex streaming or deduplication needed at runtime.

## 4. Recommended Implementation Strategy

A multi-faceted approach leveraging the new data structure:

1.  **Data Generation:** Modify the upstream data pipeline to produce the aggregated GeoJSON format described in Section 3.
2.  **Data Parser (`csvParser.ts`):** **Revert** the `parseGeoJson` function to the original simple implementation using `fs.readFileSync` and `JSON.parse`. The streaming logic is no longer necessary or beneficial with the optimized, smaller data file. Remove related helper functions if they become obsolete.
3.  **Backend API (`/api/terraces/route.ts`):**
    - Load the entire aggregated GeoJSON into memory on startup or first request (it will be small enough).
    - Modify the `filterTerraces` function (or equivalent):
      - Iterate through the in-memory features.
      - For each feature, determine `isSunlit` by accessing the correct time property (e.g., `props[timeKey]`).
      - Construct the API response feature with the dynamic `isSunlit` value.
    - **Implement Bounding Box Filtering:** Add support for `swLng`, `swLat`, `neLng`, `neLat` query parameters. Filter the in-memory features based on whether their coordinates fall within the requested bounds _before_ constructing the response.
4.  **Frontend Map (`MapView.tsx`):**
    - **Implement Viewport Loading:**
      - On initial load, fetch data for the default viewport bounds.
      - Add `moveend` / `zoomend` event listeners to the map.
      - When the map stops moving, get the new bounds (`map.getBounds()`).
      - **Fetch Trigger:** Implement either:
        - **Automatic (Debounced):** Automatically call the API with the new bounds after a short delay (debouncing prevents excessive calls during dragging).
        - **Manual (Le Fooding Style):** Display an "Update results in this area" button when the map moves significantly, requiring a user click to fetch new data. _Recommended for simplicity and explicit control._
      - Update the `terraces` source data using `source.setData()` with the new GeoJSON `FeatureCollection` returned by the bounded API call.
    - **Refine Clustering:** Continue using MapLibre's client-side clustering. Adjust `clusterRadius`, `clusterMaxZoom`, and layer paint properties (`clusters`, `cluster-count`) for optimal visual representation at different zoom levels with 30k points.

## 5. Alternative / Future Scaling Options

If the recommended strategy proves insufficient as data grows beyond 30k points or requirements become more complex (e.g., heavy server-side filtering):

- **PMTiles:** Pre-render the aggregated data into a `.pmtiles` file using `tippecanoe`. Host statically and use the `pmtiles` protocol in MapLibre. Offers tiling benefits (zoom simplification, efficient fetching) without a live server. Excellent lightweight option.
- **Server-Side Vector Tiles:** Implement a dedicated tile server (e.g., Martin, pg_tileserv, t-rex) generating tiles on-the-fly from a database (like PostGIS). More complex setup but offers maximum flexibility for dynamic data and server-side filtering/analysis.
- **Advanced Client-Side Rendering (deck.gl):** For highly interactive visualizations or rendering different data layers, consider `deck.gl` which integrates well with MapLibre and React.

## 6. User Journey Enhancements

To further improve usability and perceived performance, especially with 30k points across Paris:

- **Filtering:** Allow users to filter terraces _before_ they are loaded/displayed on the map:
  - By Arrondissement (Dropdown/Multi-select).
  - By Neighborhood (Could use bounding boxes or dedicated tags).
  - By other attributes (e.g., type, price range - if added to the data).
- **Search:** Implement geocoding search (using Mapbox Geocoding API or other services) to allow users to jump to specific addresses or areas of interest.
- **Contextual Information:** Display the number of currently visible/loaded terraces. Clearly indicate when data is being loaded for a new area.

## 7. Conclusion

The primary bottleneck was the inefficient, redundant data structure. Restructuring the GeoJSON to have one feature per terrace is the most critical step. This simplification enables:

- Reverting to a simple, robust data loading mechanism (`fs.readFileSync`).
- Efficient backend API processing.
- Effective implementation of viewport-based data fetching on the frontend.

Combined with refined client-side clustering in MapLibre, this strategy provides a performant and scalable solution for visualizing 30,000+ terraces without the immediate need for complex server-side tiling infrastructure. Future scaling can be addressed with options like PMTiles if necessary. Enhancing the user journey with filtering options should also be considered.
