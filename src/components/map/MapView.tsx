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
import { motion, AnimatePresence } from "framer-motion";

const MAP_STYLE = "https://tiles.stadiamaps.com/styles/stamen_toner_lite.json";
const INITIAL_CENTER: [number, number] = [2.377211, 48.8489977]; // Centered on requested coordinate
const INITIAL_ZOOM = 17;
const SOURCE_ID = "terraces";

// Debounce utility (moved to top-level)
function debounce(func: (bounds: LngLatBounds) => void, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (bounds: LngLatBounds) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(bounds), waitFor);
  };
  return debounced;
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
    const [selectedTerrace, setSelectedTerrace] = useState<Terrace | null>(
      null
    );
    const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(
      null
    );

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
              "rgba(255,224,178,0.85)",
              5,
              "rgba(255,179,0,0.85)",
              15,
              "rgba(255,111,0,0.85)",
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
            "circle-stroke-width": 0,
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
            // Animated properties for sunlit markers (use feature-state)
            "circle-radius": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              ["feature-state", "__animated_radius"],
              10,
            ],
            "circle-blur": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              ["feature-state", "__animated_blur"],
              0,
            ],
            "circle-stroke-width": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              2,
              0,
            ],
            "circle-stroke-color": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              "#fff",
              "#fff",
            ],
            "circle-opacity": 1,
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
        // Set initial animation state for sunlit markers
        map.setFeatureState(
          { source: SOURCE_ID, id: terrace.id },
          isSunlit
            ? { isSunlit, __animated_radius: 15, __animated_blur: 0.75 }
            : { isSunlit, __animated_radius: 10, __animated_blur: 0 }
        );
      });
    }, [terracesData, currentTimeKey]);

    // Animation state for glowing effect
    const animationRef = useRef<number | null>(null);
    const animationPhase = useRef<number>(0);

    // Animate sunlit marker glow
    useEffect(() => {
      if (!mapRef.current) return;
      const map = mapRef.current;
      let running = true;

      function animate() {
        if (!running) return;
        animationPhase.current += 0.04; // Speed of pulse
        const pulse = (Math.sin(animationPhase.current) + 1) / 2; // 0..1
        // Glow parameters (sunlit always bigger than shaded)
        const minRadius = 13;
        const maxRadius = 22;
        const minBlur = 0.5;
        const maxBlur = 1.2;
        const animatedRadius = minRadius + (maxRadius - minRadius) * pulse;
        const animatedBlur = minBlur + (maxBlur - minBlur) * pulse;

        // For all features, update their feature-state for animation
        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource & {
          _data?: unknown;
        };
        const data = source && source._data;
        if (
          data &&
          typeof data === "object" &&
          data.type === "FeatureCollection" &&
          Array.isArray(data.features)
        ) {
          for (const feature of data.features) {
            if (
              feature.properties &&
              feature.properties.id !== undefined &&
              feature.properties.isSunlit
            ) {
              map.setFeatureState(
                { source: SOURCE_ID, id: feature.properties.id },
                {
                  isSunlit: true,
                  __animated_radius: animatedRadius,
                  __animated_blur: animatedBlur,
                }
              );
            } else if (
              feature.properties &&
              feature.properties.id !== undefined
            ) {
              map.setFeatureState(
                { source: SOURCE_ID, id: feature.properties.id },
                {
                  isSunlit: false,
                  __animated_radius: 10,
                  __animated_blur: 0,
                }
              );
            }
          }
        }
        animationRef.current = requestAnimationFrame(animate);
      }
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        running = false;
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [terracesData, currentTimeKey]);

    // Listen for marker clicks and map clicks
    useEffect(() => {
      if (!mapRef.current) return;
      const map = mapRef.current;
      // Handler for marker click
      const handleMarkerClick = (e: maplibregl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["unclustered-point"],
        });
        if (features.length > 0) {
          const feature = features[0];
          const id = feature.properties?.id;
          if (!id) return;
          // Find terrace by id
          const terrace = terracesData.find((t) => t.id === id);
          if (!terrace) return;
          setSelectedTerrace(terrace);
          // Project marker lng/lat to screen position
          let coords: [number, number] | null = null;
          if (
            feature.geometry?.type === "Point" &&
            Array.isArray(feature.geometry.coordinates)
          ) {
            coords = feature.geometry.coordinates as [number, number];
          }
          if (coords) {
            const point = map.project(coords);
            setPopupPos({ x: point.x, y: point.y });
          } else {
            setPopupPos({ x: e.point.x, y: e.point.y });
          }
        }
      };
      // Handler for map click (to close popup if clicking elsewhere)
      const handleMapClick = (e: maplibregl.MapMouseEvent) => {
        // Only close if not clicking a marker
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["unclustered-point"],
        });
        if (features.length === 0) {
          setSelectedTerrace(null);
          setPopupPos(null);
        }
      };
      map.on("click", "unclustered-point", handleMarkerClick);
      map.on("click", handleMapClick);
      return () => {
        map.off("click", "unclustered-point", handleMarkerClick);
        map.off("click", handleMapClick);
      };
    }, [terracesData]);

    // Reposition popup on map move/resize if open
    useEffect(() => {
      if (!mapRef.current || !selectedTerrace) return;
      const map = mapRef.current;
      const coords: [number, number] = [
        selectedTerrace.lon,
        selectedTerrace.lat,
      ];
      const point = map.project(coords);
      setPopupPos({ x: point.x, y: point.y });
    }, [selectedTerrace, currentTimeKey]);

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

    // Helper: adjust popup position to avoid overlapping screen edges (simplified)
    function getAdjustedPopupPos(x: number, y: number) {
      const popupWidth = 320;
      const popupHeight = 220; // estimate
      const pointerOffset = 16;
      const margin = 12;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let adjX = x;
      let adjY = y - pointerOffset;
      // Avoid left/right overflow
      if (x - popupWidth / 2 < margin) adjX = margin + popupWidth / 2;
      if (x + popupWidth / 2 > vw - margin) adjX = vw - margin - popupWidth / 2;
      // Avoid top overflow (just enough to keep visible)
      if (adjY - popupHeight < margin) adjY = margin + popupHeight;
      // Avoid bottom overflow
      if (adjY > vh - margin) adjY = vh - margin;
      return { x: adjX, y: adjY };
    }

    return (
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg shadow overflow-hidden relative"
      >
        {/* Floating marker info popup */}
        <AnimatePresence>
          {selectedTerrace &&
            popupPos &&
            (() => {
              const { x, y } = getAdjustedPopupPos(popupPos.x, popupPos.y);
              return (
                <motion.div
                  key={selectedTerrace.id}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y - 16, // offset above marker
                    transform: "translate(-50%, -100%)",
                    zIndex: 30,
                    pointerEvents: "auto",
                    minWidth: 260,
                    maxWidth: 340,
                  }}
                  className="bg-background/95 backdrop-blur-md rounded-xl shadow-xl border border-white/40 ring-1 ring-white/10 p-4 drop-shadow-xl"
                >
                  {/* Modern close button */}
                  <button
                    onClick={() => {
                      setSelectedTerrace(null);
                      setPopupPos(null);
                    }}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full p-1 bg-white/60 backdrop-blur"
                    aria-label="Close"
                    tabIndex={0}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M6 6l8 8M14 6l-8 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  {/* Popup content, minimalist and modern */}
                  <div className="flex flex-col gap-3">
                    <div className="text-base font-semibold text-foreground break-words leading-tight">
                      {selectedTerrace.address}
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      {selectedTerrace.isSunlit ? (
                        <svg
                          className="w-5 h-5 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <circle cx="12" cy="12" r="5" fill="#FFD600" />
                          <path
                            stroke="#FFB300"
                            strokeWidth="2"
                            strokeLinecap="round"
                            d="M12 2v2m0 16v2m10-10h-2M4 12H2m16.97 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.73 0l-1.41 1.41M6.34 17.66l-1.41 1.41"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke="#94A3B8"
                            strokeWidth="2"
                            strokeLinecap="round"
                            d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                          />
                        </svg>
                      )}
                      <span
                        className={
                          selectedTerrace.isSunlit
                            ? "text-amber-700 font-medium"
                            : "text-slate-500 font-medium"
                        }
                      >
                        {selectedTerrace.isSunlit ? "Sunny" : "In shade"}
                      </span>
                    </div>
                    <div className="border-t border-border/20 my-2" />
                    {/* Sunshine timeline (minimal, modern) */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Today&apos;s sunshine timeline:
                      </div>
                      {(() => {
                        const sunPeriods =
                          Array.isArray(
                            selectedTerrace as unknown as {
                              sunPeriods: { start: string; end: string }[];
                            }
                          ) &&
                          (
                            selectedTerrace as unknown as {
                              sunPeriods: { start: string; end: string }[];
                            }
                          ).sunPeriods.length > 0
                            ? (
                                selectedTerrace as unknown as {
                                  sunPeriods: { start: string; end: string }[];
                                }
                              ).sunPeriods
                            : [
                                { start: "09:00", end: "12:30" },
                                { start: "14:00", end: "18:30" },
                              ];
                        return (
                          <div className="flex flex-col gap-1">
                            {sunPeriods.map(
                              (
                                period: { start: string; end: string },
                                idx: number
                              ) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 backdrop-blur border border-slate-200/60 shadow-sm text-sm mb-2"
                                >
                                  <span className="text-amber-400">
                                    <svg
                                      className="w-5 h-5"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle cx="12" cy="12" r="5" />
                                      <g
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                      >
                                        <line x1="12" y1="2" x2="12" y2="4" />
                                        <line x1="12" y1="20" x2="12" y2="22" />
                                        <line x1="2" y1="12" x2="4" y2="12" />
                                        <line x1="20" y1="12" x2="22" y2="12" />
                                        <line
                                          x1="4.93"
                                          y1="4.93"
                                          x2="6.34"
                                          y2="6.34"
                                        />
                                        <line
                                          x1="17.66"
                                          y1="17.66"
                                          x2="19.07"
                                          y2="19.07"
                                        />
                                        <line
                                          x1="4.93"
                                          y1="19.07"
                                          x2="6.34"
                                          y2="17.66"
                                        />
                                        <line
                                          x1="17.66"
                                          y1="6.34"
                                          x2="19.07"
                                          y2="4.93"
                                        />
                                      </g>
                                    </svg>
                                  </span>
                                  <span className="text-slate-700 font-medium">
                                    {period.start} - {period.end}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Pointer triangle */}
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 w-4 h-4"
                    style={{ zIndex: 31 }}
                    aria-hidden="true"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      className="block"
                    >
                      <polygon
                        points="8,0 16,16 0,16"
                        fill="rgba(255,255,255,0.85)"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                </motion.div>
              );
            })()}
        </AnimatePresence>
      </div>
    );
  }
);

MapView.displayName = "MapView";

export type MapViewHandle = {
  flyTo: (coords: [number, number], zoom?: number) => void;
};

export default MapView;
