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
import { Button } from "@/components/ui/Button";

const MAP_STYLE = "https://tiles.stadiamaps.com/styles/stamen_toner_lite.json";
const INITIAL_CENTER: [number, number] = [2.377211, 48.8489977]; // Centered on requested coordinate
const INITIAL_ZOOM = 17;
const SOURCE_ID = "terraces";
const NOTION_URL =
  "https://duphan.notion.site/Yet-another-blog-on-climate-change-408ac84658894230a4a0f0924d3dc568";

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
  onShowMethodology?: () => void;
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
  ({ currentTimeKey, onShowMethodology }, ref) => {
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
              "rgba(255,249,196,0.85)", // #FFF9C4 (light yellow)
              5,
              "rgba(255,224,102,0.85)", // #FFE066 (yellow)
              15,
              "rgba(255,214,0,0.85)", // #FFD600 (deep yellow)
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
        // Add unclustered terrace points (animated glow layer)
        map.addLayer({
          id: "unclustered-point-glow",
          type: "circle",
          source: SOURCE_ID,
          filter: ["!has", "point_count"],
          paint: {
            "circle-color": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              "#F9A825",
              "rgba(96,125,139,0.32)",
            ],
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
            "circle-stroke-width": 0,
            "circle-opacity": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              0.85,
              0.55,
            ],
          },
        });
        // Add unclustered terrace points (static sun core layer)
        map.addLayer({
          id: "unclustered-point-core",
          type: "circle",
          source: SOURCE_ID,
          filter: ["!has", "point_count"],
          paint: {
            "circle-color": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              "#FFD600",
              "rgba(96,125,139,0.32)",
            ],
            "circle-radius": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              7,
              7,
            ],
            "circle-blur": 0,
            "circle-stroke-width": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              1.2,
              0,
            ],
            "circle-stroke-color": "rgba(255,255,255,0.65)",
            "circle-opacity": [
              "case",
              ["boolean", ["feature-state", "isSunlit"], false],
              1,
              0.55,
            ],
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
        animationPhase.current += 0.03; // Faster speed of pulse
        const pulse = (Math.sin(animationPhase.current) + 1) / 2; // 0..1
        // Glow parameters (sunlit always bigger than shaded)
        const minRadius = 15;
        const maxRadius = 32; // Larger pulse
        const minBlur = 0.7;
        const maxBlur = 2.0; // More blur
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
          layers: ["unclustered-point-glow"],
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
          layers: ["unclustered-point-glow"],
        });
        if (features.length === 0) {
          setSelectedTerrace(null);
          setPopupPos(null);
        }
      };
      map.on("click", "unclustered-point-glow", handleMarkerClick);
      map.on("click", handleMapClick);
      return () => {
        map.off("click", "unclustered-point-glow", handleMarkerClick);
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

    // Helper to format tHHMM to HH:MM
    function formatTimeKeyToHuman(timeKey: string): string {
      if (!timeKey.startsWith("t") || timeKey.length < 5) return "";
      const hour = timeKey.slice(1, 3);
      const min = timeKey.slice(3, 5);
      return `${hour}:${min}`;
    }

    function DropdownMenu() {
      const [open, setOpen] = useState(false);
      return (
        <div className="absolute top-4 right-4 z-40">
          <button
            className="bg-background/95 backdrop-blur-md rounded-full shadow-xl border border-white/40 ring-1 ring-white/10 p-2 flex items-center justify-center hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-slate-300"
            onClick={() => setOpen((v) => !v)}
            aria-label="Options"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-slate-500"
            >
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
            </svg>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 min-w-[280px] bg-background/95 backdrop-blur-md rounded-xl shadow-xl border border-white/40 ring-1 ring-white/10 p-2 flex flex-col gap-1 z-50"
                onMouseLeave={() => setOpen(false)}
              >
                <button
                  className="w-full text-left px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition text-base font-medium"
                  onClick={() => {
                    setOpen(false);
                    if (onShowMethodology) onShowMethodology();
                  }}
                >
                  C&apos;est quoi cette magie noire ?
                </button>
                <a
                  href="https://buymeacoffee.com/duphan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition text-base font-medium"
                  onClick={() => setOpen(false)}
                >
                  Buy me a 🍻
                </a>
                <a
                  href={NOTION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition text-base font-medium"
                  onClick={() => setOpen(false)}
                >
                  À propos
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg shadow overflow-hidden relative"
      >
        {/* Dropdown option button */}
        <DropdownMenu />
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
                  className={`${
                    selectedTerrace &&
                    !!selectedTerrace[
                      currentTimeKey as keyof typeof selectedTerrace
                    ]
                      ? "bg-amber-50"
                      : "bg-background/95"
                  } backdrop-blur-md rounded-xl shadow-xl border border-white/40 ring-1 ring-white/10 p-4 drop-shadow-xl`}
                >
                  {/* Popup content, minimalist and modern */}
                  <div className="flex flex-col space-y-3">
                    {/* Address */}
                    <div className="text-lg font-semibold text-slate-900 break-words leading-tight">
                      {selectedTerrace.address}
                    </div>
                    {/* Status (sunny/shade) */}
                    <div className="flex items-center gap-2 text-base font-normal text-slate-600">
                      {selectedTerrace &&
                      !!selectedTerrace[
                        currentTimeKey as keyof typeof selectedTerrace
                      ] ? (
                        <>
                          <svg
                            className="w-5 h-5 text-amber-400"
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
                          <span>{`Ensoleillé à ${formatTimeKeyToHuman(
                            currentTimeKey
                          )}`}</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M2 13.5C2 15.433 3.567 17 5.5 17H18c2.209 0 4-1.791 4-4s-1.791-4-4-4h-1.5C16.5 6.5 14 4 11 4 7.5 4 5 6.5 5 9.5v.5C3.343 10 2 11.343 2 13.5z"
                            />
                          </svg>
                          <span>{`À l'ombre à ${formatTimeKeyToHuman(
                            currentTimeKey
                          )}`}</span>
                        </>
                      )}
                    </div>
                    <div className="border-t border-border/20" />
                    {/* Sunshine timeline (minimal, modern) */}
                    <div className="flex flex-col space-y-2">
                      <div className="text-sm font-normal text-slate-500">
                        Périodes d&apos;ensoleillement aujourd&apos;hui :
                      </div>
                      {(() => {
                        if (!selectedTerrace) return null;
                        const sunPeriods =
                          Array.isArray(selectedTerrace.sunlit_intervals) &&
                          selectedTerrace.sunlit_intervals.length > 0
                            ? selectedTerrace.sunlit_intervals
                            : null;
                        return (
                          <div className="flex flex-col gap-1">
                            {sunPeriods ? (
                              sunPeriods.map((period, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 pl-4 py-1 pr-2 rounded bg-[#FFF7D1] text-sm text-slate-600"
                                >
                                  <svg
                                    className="w-5 h-5 text-amber-400"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle cx="12" cy="12" r="5" />
                                    <g stroke="currentColor" strokeWidth="1.5">
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
                                  <span>
                                    {period.start} - {period.end}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-2 pl-4 py-2 pr-3 rounded bg-slate-100 text-sm text-slate-600">
                                <svg
                                  className="w-5 h-5 text-slate-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M2 13.5C2 15.433 3.567 17 5.5 17H18c2.209 0 4-1.791 4-4s-1.791-4-4-4h-1.5C16.5 6.5 14 4 11 4 7.5 4 5 6.5 5 9.5v.5C3.343 10 2 11.343 2 13.5z"
                                  />
                                </svg>
                                <span>
                                  Pas de bronzage possible aujourd&apos;hui!
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    {/* Google Maps bar search button */}
                    <Button
                      variant="secondary"
                      size="md"
                      className="mt-3 w-full flex items-center gap-2 pl-4 bg-amber-200 text-amber-900 text-base font-semibold shadow-lg rounded-lg hover:bg-amber-300 hover:text-amber-900 hover:scale-[1.03] transition-transform focus:ring-2 focus:ring-amber-300/70"
                      onClick={() => {
                        const lat = selectedTerrace.lat;
                        const lng = selectedTerrace.lon;
                        const url = `https://www.google.com/maps/search/bar+restaurant/@${lat},${lng},21z`;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-amber-900"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
                        />
                      </svg>
                      <span>Voir la terrasse sur Maps</span>
                    </Button>
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
