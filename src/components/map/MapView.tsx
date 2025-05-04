"use client";

import React, { useEffect, useRef } from "react";
import maplibregl, { Map, LngLatLike, MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Terrace } from "@/app/page";

const MAP_STYLE = "/map-styles/paris-light.json";
const INITIAL_CENTER: [number, number] = [2.3622, 48.859]; // Le Marais
const INITIAL_ZOOM = 15;

interface MapViewProps {
  terraces: Terrace[];
  onSelectTerrace?: (terraceId: string) => void;
  isLoading?: boolean;
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

export default function MapView({
  terraces,
  onSelectTerrace,
  isLoading,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const sourceId = "terraces";

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: INITIAL_CENTER as LngLatLike,
      zoom: INITIAL_ZOOM,
      attributionControl: true as any, // Acceptable for MapLibre
    });
    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.on("load", () => {
      // Add terrace source and layer
      map.addSource(sourceId, {
        type: "geojson",
        data: terracesToGeoJSON(terraces),
        cluster: terraces.length > 1000,
        clusterMaxZoom: 16,
        clusterRadius: 40,
      });

      if (terraces.length > 1000) {
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: sourceId,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#F9A825",
              10,
              "#FFD54F",
              50,
              "#F57F17",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              16,
              10,
              24,
              50,
              32,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: sourceId,
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 14,
          },
          paint: {
            "text-color": "#1A2C42",
          },
        });
      }

      // Add terrace points as a circle layer (no image needed)
      map.addLayer({
        id: "terrace-points",
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": ["case", ["==", ["get", "isSunlit"], true], 9, 7],
          "circle-color": [
            "case",
            ["==", ["get", "isSunlit"], true],
            "#F9A825", // sunlit: gold
            "#CBD5E1", // unlit: slate-200
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      map.on("click", "terrace-points", (e: MapLayerMouseEvent) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          if (onSelectTerrace && feature.properties && feature.properties.id) {
            onSelectTerrace(feature.properties.id as string);
          }
        }
      });

      map.on("mouseenter", "terrace-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "terrace-points", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectTerrace, terraces]);

  // Update terrace markers when terraces prop changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.isStyleLoaded() && map.getSource(sourceId)) {
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
      source.setData(terracesToGeoJSON(terraces));
    }
  }, [terraces]);

  return (
    <div className="relative w-full h-full rounded-lg shadow overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
          <svg
            className="animate-spin h-8 w-8 text-amber-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
