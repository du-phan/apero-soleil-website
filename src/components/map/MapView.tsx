"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import maplibregl, { Map, LngLatBounds } from "maplibre-gl";
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
          // but omit 'id' and 'address' to avoid duplicates
          ...Object.fromEntries(
            Object.entries(terrace).filter(
              ([key]) => key !== "id" && key !== "address"
            )
          ),
        },
      };
    }),
  };
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(
  ({ currentTimeKey }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const [terracesData, setTerracesData] = useState<Terrace[]>([]); // Stores raw terrace data with all time slots

    // Fetch terraces for the current bounds (all time data for them)
    const fetchTerraces = useCallback(async (bounds: LngLatBounds) => {
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const params = new URLSearchParams({
        swLng: sw.lng.toString(),
        swLat: sw.lat.toString(),
        neLng: ne.lng.toString(),
        neLat: ne.lat.toString(),
      });
      const res = await fetch(`/api/terraces?${params.toString()}`);
      const data: Terrace[] = await res.json();
      setTerracesData(data);
      return data;
    }, []);

    // Debounced fetch for map move/zoom (fetches new terrace data for visible bounds)
    const debouncedFetchTerraces = useCallback(
      debounce((bounds: LngLatBounds) => {
        fetchTerraces(bounds);
      }, 400),
      [fetchTerraces]
    );

    // Initialize map and layers only once
    useEffect(() => {
      if (!mapContainer.current) return;
      if (mapRef.current) return; // Prevent double init

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.on("load", async () => {
        const initialBounds = map.getBounds();
        // Fetch initial data (all time slots) for visible bounds
        await fetchTerraces(initialBounds);
        // Source and layers will be added by the next effect
      });

      map.on("moveend", () => {
        if (!mapRef.current) return;
        const bounds = mapRef.current.getBounds();
        debouncedFetchTerraces(bounds);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }, [debouncedFetchTerraces, fetchTerraces]);

    // Add source and layers only once, after map is ready and style is loaded
    useEffect(() => {
      if (!mapRef.current) return;
      const map = mapRef.current;
      if (map.getSource(SOURCE_ID)) return; // Already added

      function addSourceAndLayers() {
        if (map.getSource(SOURCE_ID)) return; // Defensive: don't add twice
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: 15,
          clusterRadius: 40,
          promoteId: "id",
          clusterProperties: {
            sunlit_count: [
              "+",
              ["case", ["boolean", ["get", "isSunlit"], false], 1, 0],
            ],
            total_count: ["+", 1],
          },
        });
        // Add cluster circles
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: SOURCE_ID,
          filter: [
            "all",
            ["has", "point_count"],
            [">", ["get", "sunlit_count"], 0],
          ],
          paint: {
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "sunlit_count"],
              1,
              "#FFE0B2",
              5,
              "#FFB300",
              15,
              "#FF6F00",
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
        // Add cluster count labels
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: SOURCE_ID,
          filter: [
            "all",
            ["has", "point_count"],
            [">", ["get", "sunlit_count"], 0],
          ],
          layout: {
            "text-field": "{sunlit_count}",
            "text-font": ["Noto Sans Regular"],
            "text-size": 16,
          },
          paint: {
            "text-color": "#22292f",
            "text-halo-color": "#fff",
            "text-halo-width": 0,
          },
        });
        // Add unclustered terrace points
        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: SOURCE_ID,
          filter: ["!has", "point_count"],
          paint: {
            "circle-color": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              "#F9A825",
              "#607D8B",
            ],
            "circle-radius": 8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });
      }

      if (map.isStyleLoaded()) {
        addSourceAndLayers();
      } else {
        map.once("load", addSourceAndLayers);
      }

      // Cleanup: remove event listener if effect is cleaned up before load
      return () => {
        map.off("load", addSourceAndLayers);
      };
    }, []);

    // Whenever either terracesData or currentTimeKey changes, update the source in-place
    useEffect(() => {
      if (!mapRef.current) return;
      const map = mapRef.current;
      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
      if (!source) return;
      // Regenerate GeoJSON for current time
      const geojson = terracesToGeoJSON(terracesData, currentTimeKey);
      source.setData(geojson);
      // Optionally, update feature state for unclustered points
      terracesData.forEach((terrace) => {
        const isSunlit = !!terrace[currentTimeKey as keyof Terrace];
        map.setFeatureState(
          { source: SOURCE_ID, id: terrace.id },
          { isSunlit }
        );
      });
    }, [terracesData, currentTimeKey]);

    useImperativeHandle(
      ref,
      () => ({
        flyTo: (coords: [number, number], zoom?: number) => {
          if (mapRef.current) {
            mapRef.current.jumpTo({
              center: coords,
              zoom: zoom ?? mapRef.current.getZoom(),
              // No duration for jumpTo; it's instant
            });
          }
        },
      }),
      []
    );

    return (
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg shadow overflow-hidden"
      />
    );
  }
);

export type MapViewHandle = {
  flyTo: (coords: [number, number], zoom?: number) => void;
};

export default MapView;
