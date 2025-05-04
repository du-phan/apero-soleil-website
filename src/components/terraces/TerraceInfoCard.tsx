"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Terrace } from "@/contexts/TerraceContext";
import { useTime } from "@/contexts/TimeContext";

interface TerraceInfoCardProps {
  terrace: Terrace;
  className?: string;
  onClose?: () => void; // Optional close handler
}

export const TerraceInfoCard: React.FC<TerraceInfoCardProps> = ({
  terrace,
  className = "",
  onClose,
}) => {
  const { currentTime } = useTime();

  // Format terrace ID as an address (replacing underscores with spaces)
  const formatAddress = (id: string) => {
    return id.replace(/_/g, " ");
  };

  // Format a time string from 24h to 12h format
  const formatTime = (timeString: string) => {
    try {
      const [hour, minute] = timeString.split(":").map(Number);
      const period = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  // For demo purposes, create some mock sun periods
  // In a real app, this would come from the API
  const sunPeriods = terrace.sunPeriods || [
    { start: "09:00", end: "12:30" },
    { start: "14:00", end: "18:30" },
  ];

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleShare = () => {
    // Create a shareable URL with the terrace info
    const shareUrl = `${window.location.origin}?terrace=${terrace.id}&lat=${terrace.lat}&lon=${terrace.lon}`;

    // Use Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: `Terrasse au Soleil - ${formatAddress(terrace.id)}`,
          text: `Check out this ${
            terrace.isSunlit ? "sunny" : "shaded"
          } terrace in Paris!`,
          url: shareUrl,
        })
        .catch(console.error);
    } else {
      // Fallback to clipboard copy
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          alert("Link copied to clipboard!");
        })
        .catch(console.error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className={`w-full ${className}`}
    >
      <Card variant="highlighted">
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-800">
            {formatAddress(terrace.address || terrace.id)}
          </h3>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </CardHeader>

        <CardBody className="space-y-6">
          <div className="flex items-center space-x-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                terrace.isSunlit
                  ? "bg-amber-600 text-white"
                  : "bg-slate-600 text-white"
              }`}
            >
              {terrace.isSunlit ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </div>
            <div>
              <p className="text-lg font-medium">
                {terrace.isSunlit
                  ? "Currently sunny! ☀️"
                  : "Currently in shade 🌥️"}
              </p>
              <p className="text-sm text-slate-600">
                {currentTime ? `at ${formatTime(currentTime)}` : ""}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">
              Today's sunshine timeline:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {sunPeriods.map((period, index) => (
                <div
                  key={index}
                  className="px-3 py-2 rounded-md bg-amber-50 border border-amber-200"
                >
                  <div className="flex justify-between">
                    <span className="text-amber-700 font-medium">☀️ Sunny</span>
                    <span className="text-slate-600">
                      {formatTime(period.start)} - {formatTime(period.end)}
                    </span>
                  </div>
                </div>
              ))}

              {sunPeriods.length === 0 && (
                <p className="text-sm text-slate-500 italic">
                  No sunshine data available for today.
                </p>
              )}
            </div>
          </div>
        </CardBody>

        <CardFooter className="flex justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.open(
                `https://maps.google.com/?q=${terrace.lat},${terrace.lon}`,
                "_blank"
              );
            }}
          >
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                />
              </svg>
              Directions
            </span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleShare}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z"
                />
              </svg>
              Share this spot
            </span>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default TerraceInfoCard;
