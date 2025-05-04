"use client";

import React from "react";
import { format, parse } from "date-fns";
import { Card } from "@/components/ui/Card";
import { useTime } from "@/contexts/TimeContext";

export const TimeControl: React.FC = () => {
  const { currentTime, setTime } = useTime();

  // Generate time slots from 9:00 to 21:00 with 30-minute intervals
  // In a real app, this would come from the backend
  const availableTimes = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  });

  // Sort times chronologically
  const sortedTimes = [...availableTimes].sort((a, b) => {
    const parseTime = (time: string) => {
      const [hour, minute] = time.split(":").map(Number);
      return hour * 60 + minute;
    };

    return parseTime(a) - parseTime(b);
  });

  // Format the time for display
  const formatTimeDisplay = (timeString: string) => {
    try {
      const timeParts = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(timeParts[0], 10));
      date.setMinutes(parseInt(timeParts[1], 10));

      return format(date, "h:mm a"); // e.g., "9:30 AM"
    } catch (error) {
      return timeString;
    }
  };

  return (
    <Card className="p-4 flex-1">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-600">Time of Day</h3>

        <div className="relative pb-4">
          <input
            type="range"
            min={0}
            max={sortedTimes.length - 1}
            value={sortedTimes.indexOf(currentTime)}
            step={1}
            onChange={(e) => {
              const index = parseInt(e.target.value, 10);
              setTime(sortedTimes[index]);
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-600"
          />

          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-600 px-1">
            <span>{formatTimeDisplay(sortedTimes[0])}</span>
            <span>
              {formatTimeDisplay(
                sortedTimes[Math.floor(sortedTimes.length / 2)]
              )}
            </span>
            <span>
              {formatTimeDisplay(sortedTimes[sortedTimes.length - 1])}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            {formatTimeDisplay(currentTime)}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default TimeControl;
