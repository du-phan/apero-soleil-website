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

const MAP_STYLE = "/map-styles/paris-light.json";
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

function terracesToGeoJSON(terraces: Terrace[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: terraces.map((terrace) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [terrace.lon, terrace.lat],
      },
      properties: {
        id: terrace.id,
        address: terrace.address,
        isSunlit: terrace.isSunlit,
      },
    })),
  };
}

const MapView: React.FC<MapViewProps> = ({ currentTimeKey }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [terraces, setTerraces] = useState<Terrace[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch terraces for the current bounds and time
  const fetchTerraces = useCallback(
    async (bounds: LngLatBounds, timeKey: string) => {
      setLoading(true);
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const params = new URLSearchParams({
        time: timeKey,
        swLng: sw.lng.toString(),
        swLat: sw.lat.toString(),
        neLng: ne.lng.toString(),
        neLat: ne.lat.toString(),
      });
      const res = await fetch(`/api/terraces?${params.toString()}`);
      const data = await res.json();
      setTerraces(data);
      setLoading(false);
      return data;
    },
    []
  );

  // Debounced fetch for map move/zoom
  const debouncedFetchTerraces = useCallback(
    debounce((bounds: LngLatBounds, timeKey: string) => {
      fetchTerraces(bounds, timeKey).then((data) => {
        // Update map source if map is ready
        if (mapRef.current && mapRef.current.getSource(SOURCE_ID)) {
          const geojson = terracesToGeoJSON(data);
          (
            mapRef.current.getSource(SOURCE_ID) as maplibregl.GeoJSONSource
          ).setData(geojson);
        }
      });
    }, 400),
    [fetchTerraces]
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
      // Initial fetch for visible bounds
      const bounds = map.getBounds();
      const data = await fetchTerraces(bounds, currentTimeKey);
      const geojson = terracesToGeoJSON(data);

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 40,
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
            ["==", ["get", "isSunlit"], true],
            "#F9A825",
            "#607D8B",
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
      debouncedFetchTerraces(bounds, currentTimeKey);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [currentTimeKey, fetchTerraces, debouncedFetchTerraces]);

  // Refetch data if time changes
  useEffect(() => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    debouncedFetchTerraces(bounds, currentTimeKey);
  }, [currentTimeKey, debouncedFetchTerraces]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg shadow overflow-hidden"
    />
  );
};

export default MapView;
