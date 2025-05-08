"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, {
  Map,
  LngLatLike,
  MapLayerMouseEvent,
  LngLatBounds,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Terrace } from "@/app/page";

const MAP_STYLE = "https://tiles.stadiamaps.com/styles/stamen_toner_lite.json";
const INITIAL_CENTER: [number, number] = [2.3622, 48.859]; // Le Marais
const INITIAL_ZOOM = 15;
const SOURCE_ID = "terraces";

// Debounce utility (moved to top-level)
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

interface MapViewProps {
  currentTimeKey: string;
}

function terracesToGeoJSON(
  terraces: Terrace[],
  currentTimeKey: string
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: terraces.map((terrace) => {
      // Determine isSunlit based on the currentTimeKey and the terrace's time slot properties
      const isSunlit = !!terrace[currentTimeKey as keyof Terrace];

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [terrace.lon, terrace.lat],
        },
        properties: {
          id: terrace.id, // Ensure this ID is suitable for map.setFeatureState
          address: terrace.address,
          isSunlit: isSunlit,
          // Pass through all other properties from the terrace object,
          // which include t0900, t0930 etc. This is useful if setFeatureState needs them
          // or if we want to inspect them later.
          ...terrace,
        },
      };
    }),
  };
}

const MapView: React.FC<MapViewProps> = ({ currentTimeKey }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [terracesData, setTerracesData] = useState<Terrace[]>([]); // Stores raw terrace data with all time slots
  const [loading, setLoading] = useState(false);

  // Fetch terraces for the current bounds (all time data for them)
  const fetchTerraces = useCallback(
    async (bounds: LngLatBounds) => {
      // Removed timeKey from parameters
      setLoading(true);
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const params = new URLSearchParams({
        // time: timeKey, // Removed timeKey from API call
        swLng: sw.lng.toString(),
        swLat: sw.lat.toString(),
        neLng: ne.lng.toString(),
        neLat: ne.lat.toString(),
      });
      // The API now returns terraces with all their time slot properties
      const res = await fetch(`/api/terraces?${params.toString()}`);
      const data: Terrace[] = await res.json(); // Assuming API returns Terrace[] compatible objects
      setTerracesData(data); // Store the raw data with all time slots
      setLoading(false);
      return data;
    },
    [] // No dependencies needed for fetchTerraces itself related to timeKey
  );

  // Debounced fetch for map move/zoom
  const debouncedFetchTerraces = useCallback(
    debounce((bounds: LngLatBounds, currentMapTimeKey: string) => {
      // Renamed timeKey to currentMapTimeKey for clarity
      fetchTerraces(bounds).then((data) => {
        // Call fetchTerraces without timeKey
        // Update map source if map is ready
        if (mapRef.current && mapRef.current.getSource(SOURCE_ID)) {
          // Convert to GeoJSON using the current time key to set initial isSunlit
          const geojson = terracesToGeoJSON(data, currentMapTimeKey);
          (
            mapRef.current.getSource(SOURCE_ID) as maplibregl.GeoJSONSource
          ).setData(geojson);
        }
      });
    }, 400),
    [fetchTerraces] // fetchTerraces is stable
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return; // Prevent double init

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: true,
    });
    mapRef.current = map;

    map.on("load", async () => {
      const initialBounds = map.getBounds();
      // Fetch initial data (all time slots) for visible bounds
      const initialData = await fetchTerraces(initialBounds); // No timeKey needed
      // Convert to GeoJSON using the initial currentTimeKey from props
      const geojson = terracesToGeoJSON(initialData, currentTimeKey);

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 15, // Consider adjusting these based on MAP_SCALING_ANALYSIS.md
        clusterRadius: 40, // Consider adjusting
        promoteId: "id", // Important for setFeatureState: use 'id' from properties as feature id
      });

      // Cluster circles
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#F9A825",
            20,
            "#FFB300",
            100,
            "#FF7043",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            20,
            26,
            100,
            34,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Cluster count labels
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Noto Sans Regular"],
          "text-size": 18,
        },
        paint: {
          "text-color": "#22292f",
          "text-halo-color": "#fff",
          "text-halo-width": 3,
        },
      });

      // Unclustered terrace points
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!has", "point_count"],
        paint: {
          "circle-color": [
            "case",
            // Use feature-state for dynamic styling based on isSunlit
            ["boolean", ["feature-state", "isSunlit"], false], // Default to false if state is not set
            "#F9A825", // Sunlit color
            "#607D8B", // Shaded color
          ],
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    });

    // On map move/zoom, fetch new data for bounds
    map.on("moveend", () => {
      if (!mapRef.current) return;
      const bounds = mapRef.current.getBounds();
      // Pass the current currentTimeKey for generating GeoJSON with correct isSunlit
      debouncedFetchTerraces(bounds, currentTimeKey);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [fetchTerraces, debouncedFetchTerraces]); // Removed currentTimeKey from dependencies

  // Refetch data if time changes -- THIS WILL BE REPLACED
  useEffect(() => {
    if (
      !mapRef.current ||
      !mapRef.current.isStyleLoaded() ||
      !mapRef.current.getSource(SOURCE_ID)
    ) {
      // If map is not ready or source doesn't exist, wait for the main useEffect to handle it
      // Or if initial data is still being fetched by the load handler
      return;
    }

    // NEW LOGIC: Update feature states based on currentTimeKey, do NOT refetch.
    // This relies on terracesData containing all terraces for the current view
    // with all their time properties.

    // If terracesData is empty (e.g. initial load hasn't populated it via moveend/load),
    // this loop won't do anything, which is fine.
    // The main map load/move logic is responsible for fetching data.

    const source = mapRef.current.getSource(
      SOURCE_ID
    ) as maplibregl.GeoJSONSource;
    if (!source) return;

    // Get all features currently in the source. This might be tricky if they are heavily clustered.
    // `setFeatureState` works on original features, even if clustered.
    // We need to ensure that the `id` used here matches the `id` in `promoteId` and in `terracesData`.

    // The `MAP_SCALING_ANALYSIS.md` suggests iterating `terraces` (which I've named `terracesData`).
    // This is correct as `terracesData` holds the full data for the current viewport.

    terracesData.forEach((terrace) => {
      const isSunlit = !!terrace[currentTimeKey as keyof Terrace];
      if (mapRef.current && mapRef.current.getSource(SOURCE_ID)) {
        // Check again due to async nature
        mapRef.current.setFeatureState(
          { source: SOURCE_ID, id: terrace.id },
          { isSunlit: isSunlit }
        );
      }
    });

    // We also need to update the 'isSunlit' property in the GeoJSON data itself
    // if any layers directly use ['get', 'isSunlit'] from properties for existing features
    // that are NOT updated by feature state (e.g. if feature state is only for styling, not filtering).
    // The current 'unclustered-point' layer uses ['get', 'isSunlit'].
    // setFeatureState typically affects paint properties that use ['feature-state', 'isSunlit'].
    // So we need to update the layer paint rule for 'unclustered-point'.

    // Option 1: Update paint rule to use feature-state
    // mapRef.current.setPaintProperty('unclustered-point', 'circle-color', [
    //   'case',
    //   ['==', ['feature-state', 'isSunlit'], true],
    //   '#F9A825', // Sunlit color
    //   '#607D8B'  // Shaded color
    // ]);

    // Option 2: Regenerate GeoJSON and setData (less ideal, but simpler if feature-state is complex with clustering)
    // For now, let's stick to the setFeatureState approach and assume/ensure
    // the layer paint properties are updated to use feature state.
    // The 'unclustered-point' layer needs to be changed to use feature state.
  }, [currentTimeKey, terracesData]); // Depends on currentTimeKey and the currently loaded terracesData

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg shadow overflow-hidden"
    />
  );
};

export default MapView;
