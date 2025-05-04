"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import type { Terrace } from "@/app/page";

interface SearchBarProps {
  className?: string;
  flyTo?: (coords: [number, number], zoom?: number) => void; // Optional flyTo callback
  terraces: Terrace[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className = "",
  flyTo,
  terraces,
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; address: string }>
  >([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Simple search implementation - filter terraces by address containing the query
    const results = terraces
      .filter((terrace) =>
        terrace.address.toLowerCase().includes(value.toLowerCase())
      )
      .map((terrace) => ({
        id: terrace.id,
        address: terrace.address,
      }));

    setSearchResults(results.slice(0, 5)); // Limit to first 5 results
    setShowResults(true);
  };

  const handleSelectTerrace = (terraceId: string) => {
    setShowResults(false);
    const terrace = terraces.find((t) => t.id === terraceId);
    if (terrace && flyTo) {
      // Center map on the selected terrace
      flyTo([terrace.lon, terrace.lat], 16);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        placeholder="Search for a terrace..."
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

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-slate-200 max-h-80 overflow-y-auto">
          <ul className="py-1">
            {searchResults.map((result) => (
              <li
                key={result.id}
                className="px-4 py-2 hover:bg-amber-50 cursor-pointer text-sm text-slate-700"
                onClick={() => handleSelectTerrace(result.id)}
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
