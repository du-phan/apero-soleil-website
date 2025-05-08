"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import DateControl from "@/components/controls/DateControl";
import TimeControl from "@/components/controls/TimeControl";
import { useTime } from "@/contexts/TimeContext";
import { Button } from "@/components/ui/Button";
import MapView from "@/components/map/MapView";

export type Terrace = {
  id: string;
  lat: number;
  lon: number;
  address: string;
  isSunlit: boolean;
  sunAzimuth?: number;
  sunAltitude?: number;
};

export default function Home() {
  const { formattedDate, currentTime, resetToNow } = useTime();

  // Format current time to the format expected by the API (tHHMM)
  const formatTimeForAPI = (time: string): string => {
    // Expecting time in format "HH:MM"
    if (!time || !time.includes(":")) return "t1200"; // Default to noon if invalid

    const [hours, minutes] = time.split(":");
    // Remove the colon and prefix with 't'
    return `t${hours}${minutes}`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col">
        <Container className="pt-4 pb-2 flex flex-col gap-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex flex-row gap-2 items-center">
              <DateControl />
              <TimeControl />
              <Button variant="secondary" size="sm" onClick={resetToNow}>
                Now
              </Button>
            </div>
          </div>
        </Container>
        <Container className="flex-grow pb-8" fullWidth>
          <div className="w-full h-[calc(100vh-300px)] min-h-[500px]">
            <MapView currentTimeKey={formatTimeForAPI(currentTime)} />
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
