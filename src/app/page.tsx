"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import DateControl from "@/components/controls/DateControl";
import TimeControl from "@/components/controls/TimeControl";
import TerraceInfoCard from "@/components/terraces/TerraceInfoCard";
import { useTime } from "@/contexts/TimeContext";
import { Button } from "@/components/ui/Button";
import SearchBar from "@/components/controls/SearchBar";
import MapView from "@/components/map/MapView";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export type Terrace = {
  id: string;
  lat: number;
  lon: number;
  address: string;
  isSunlit: boolean;
};

export default function Home() {
  const { formattedDate, currentTime, resetToNow } = useTime();
  const [sunlitOnly, setSunlitOnly] = React.useState(false);
  const [selectedTerraceId, setSelectedTerraceId] = React.useState<
    string | null
  >(null);

  // Fetch terrace data from API
  const { data: terraces = [], isLoading } = useSWR<Terrace[]>(
    `/api/terraces?date=${formattedDate}&time=${currentTime}`,
    fetcher
  );

  const filteredTerraces = sunlitOnly
    ? terraces.filter((t) => t.isSunlit)
    : terraces;
  const sunnyTerraceCount = terraces.filter(
    (terrace) => terrace.isSunlit
  ).length;
  const selectedTerrace = selectedTerraceId
    ? terraces.find((t) => t.id === selectedTerraceId)
    : null;

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
            <div className="flex flex-row gap-2 items-center">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sunlitOnly}
                  onChange={() => setSunlitOnly(!sunlitOnly)}
                  className="accent-amber-500"
                />
                <span className="text-sm text-slate-700">Sunlit only</span>
              </label>
            </div>
          </div>
        </Container>
        <Container className="pb-4">
          <SearchBar terraces={filteredTerraces} />
        </Container>
        {/* Main content with map */}
        <Container className="flex-grow pb-8" fullWidth>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-[calc(100vh-400px)] min-h-[500px]">
              <MapView
                terraces={filteredTerraces}
                isLoading={isLoading}
                onSelectTerrace={setSelectedTerraceId}
              />
            </div>
            <div className="h-[calc(100vh-400px)] min-h-[500px] overflow-y-auto">
              {selectedTerrace ? (
                <TerraceInfoCard
                  terrace={selectedTerrace}
                  onClose={() => setSelectedTerraceId(null)}
                />
              ) : (
                <Card className="h-full p-6 flex flex-col items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-12 h-12 text-amber-500 mb-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                    />
                  </svg>
                  <h3 className="text-xl font-medium text-slate-800 mb-2">
                    No terrace selected
                  </h3>
                  <p className="text-slate-600 text-center mb-4">
                    Click on a terrace marker on the map to see detailed
                    information about it.
                  </p>
                  <p className="text-amber-700 font-medium">
                    {sunnyTerraceCount} sunny terraces available
                  </p>
                </Card>
              )}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
