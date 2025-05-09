"use client";

import React, { useRef } from "react";
import MapView, { MapViewHandle } from "@/components/map/MapView";
import SearchBar from "@/components/controls/SearchBar";
import TimeControl from "@/components/controls/TimeControl";
import { useTime } from "@/contexts/TimeContext";

export type Terrace = {
  id: string;
  lat: number;
  lon: number;
  address: string;
  isSunlit?: boolean; // Will be derived on the client from time slot properties
  sunAzimuth?: number;
  sunAltitude?: number;
  // New: sunshine intervals for the day
  sunlit_intervals?: { start: string; end: string }[];
  // Index signature for time slot properties, e.g., t0900, t0930, etc.
  [key: `t${string}`]: boolean | number | string | undefined;
};

export default function Home() {
  const mapRef = useRef<MapViewHandle>(null);
  const { currentTime } = useTime();

  // Format current time to the format expected by the API (tHHMM)
  const formatTimeForAPI = (time: string): string => {
    // Expecting time in format "HH:MM"
    if (!time || !time.includes(":")) return "t1200"; // Default to noon if invalid

    const [hours, minutes] = time.split(":");
    // Remove the colon and prefix with 't'
    return `t${hours}${minutes}`;
  };

  const handleFlyTo = (coords: [number, number], zoom?: number) => {
    mapRef.current?.flyTo(coords, zoom);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Map as absolute background */}
      <div className="absolute inset-0 z-0">
        <MapView ref={mapRef} currentTimeKey={formatTimeForAPI(currentTime)} />
      </div>
      {/* Floating SearchBar */}
      <div className="fixed top-6 left-6 z-10 w-[min(90vw,400px)]">
        <SearchBar terraces={[]} flyTo={handleFlyTo} />
      </div>
      {/* Floating TimeControl only */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-xl px-2">
        <div className="bg-background/95 backdrop-blur-md rounded-xl shadow-xl border border-white/40 ring-1 ring-white/10 p-3 z-10 w-full flex items-center justify-center">
          <TimeControl />
        </div>
      </div>
    </div>
  );
}
