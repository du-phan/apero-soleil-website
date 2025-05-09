"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/Input";
import type { Terrace } from "@/app/page";

interface SearchBarProps {
  className?: string;
  flyTo?: (coords: [number, number], zoom?: number) => void; // Optional flyTo callback
  terraces: Terrace[];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const PARIS_BBOX = "2.2241,48.8156,2.4699,48.9022"; // minLon,minLat,maxLon,maxLat

// Add type for Mapbox feature
interface MapboxFeature {
  id: string;
  place_name: string;
  center?: [number, number];
}

function debounce(fn: (value: string) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (value: string) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(value), delay);
  };
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className = "",
  flyTo,
  terraces,
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; address: string; coords?: [number, number] }>
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchId = useRef(0);

  // Debounced search handler
  const debouncedSearch = useRef(
    debounce(async (value: string) => {
      if (value.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      const fetchId = ++lastFetchId.current;
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=fr&bbox=${PARIS_BBOX}&types=address,place,locality,neighborhood,poi`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Mapbox error");
        const data = await res.json();
        // Only update if this is the latest fetch
        if (fetchId !== lastFetchId.current) return;
        if (Array.isArray(data.features) && data.features.length > 0) {
          setSearchResults(
            data.features.map((feature: MapboxFeature) => ({
              id: feature.id,
              address: feature.place_name,
              coords: feature.center
                ? [feature.center[0], feature.center[1]]
                : undefined,
            }))
          );
          setShowResults(true);
          setLoading(false);
          return;
        } else {
          setSearchResults([]);
          setShowResults(true);
          setLoading(false);
          setError(null); // No error, just no results
          return;
        }
      } catch {
        setError("Erreur de géocodage Mapbox. Essayez encore.");
        setSearchResults([]);
        setShowResults(true);
        setLoading(false);
      }
    }, 400)
  ).current;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setError(null);
    debouncedSearch(value);
    // If Mapbox returns no results, fallback to local terrace search
    if (value.length >= 2 && terraces.length > 0) {
      const results = terraces
        .filter((terrace) =>
          terrace.address.toLowerCase().includes(value.toLowerCase())
        )
        .map((terrace) => ({
          id: terrace.id,
          address: terrace.address,
          coords: [terrace.lon, terrace.lat] as [number, number],
        }));
      if (results.length > 0) {
        setSearchResults(results.slice(0, 5));
        setShowResults(true);
        setLoading(false);
      }
    }
  };

  const handleSelectResult = (result: {
    id: string;
    address: string;
    coords?: [number, number];
  }) => {
    setShowResults(false);
    setQuery(result.address);
    if (result.coords && flyTo) {
      flyTo(result.coords, 18);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
    setError(null);
  };

  return (
    <div
      className={
        `relative ${className} ` +
        "bg-background/95 backdrop-blur-md rounded-xl shadow-xl border border-white/40 ring-1 ring-white/10 p-3 z-10 w-full"
      }
    >
      <Input
        placeholder="Rechercher une adresse, un quartier..."
        value={query}
        onChange={handleSearch}
        onClear={handleClear}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-slate-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        }
        className="w-full"
        inputClassName="py-2 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
        onFocus={() => setShowResults(searchResults.length > 0)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />
      {loading && (
        <div className="absolute right-4 top-3">
          <svg
            className="animate-spin h-5 w-5 text-amber-500"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        </div>
      )}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      {showResults && !loading && searchResults.length === 0 && !error && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-slate-200 max-h-80 overflow-y-auto">
          <div className="py-2 px-4 text-sm text-slate-500">
            Aucun résultat trouvé.
          </div>
        </div>
      )}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-slate-200 max-h-80 overflow-y-auto">
          <ul className="py-1">
            {searchResults.map((result) => (
              <li
                key={result.id}
                className="mx-1 px-4 py-2 cursor-pointer text-sm text-slate-700 rounded-lg transition hover:bg-slate-100 hover:text-slate-900"
                onClick={() => handleSelectResult(result)}
              >
                {result.address}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
