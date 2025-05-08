"use client";

import React from "react";
import * as Slider from "@radix-ui/react-slider";
import { format } from "date-fns";
import { Card } from "@/components/ui/Card";
import { useTime } from "@/contexts/TimeContext";

// Generate time slots from 9:00 to 21:00 with 30-minute intervals
const availableTimes = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9;
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
});

const sortedTimes = [...availableTimes];

function formatTimeDisplay(timeString: string) {
  try {
    const [h, m] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m);
    return format(date, "h:mm a");
  } catch {
    return timeString;
  }
}

export const TimeControl: React.FC = () => {
  const { currentTime, setTime } = useTime();
  const [sliderValue, setSliderValue] = React.useState(
    sortedTimes.indexOf(currentTime)
  );

  // Keep slider in sync with context
  React.useEffect(() => {
    setSliderValue(sortedTimes.indexOf(currentTime));
  }, [currentTime]);

  // Debounce setTime for performance
  const debouncedSetTime = React.useRef(
    debounce((index: number) => {
      setTime(sortedTimes[index]);
    }, 200)
  ).current;

  return (
    <Card className="p-8 flex flex-col gap-4 items-center w-full max-w-3xl mx-auto">
      <h3 className="text-base font-semibold text-slate-700 mb-2">
        Time of Day
      </h3>
      <div className="w-full flex flex-col gap-4 items-center">
        <div className="relative w-full px-2">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-8"
            min={0}
            max={sortedTimes.length - 1}
            step={1}
            value={[sliderValue]}
            onValueChange={([val]) => {
              setSliderValue(val);
              debouncedSetTime(val);
            }}
            aria-label="Time of day"
          >
            {/* Track */}
            <Slider.Track className="bg-gray-200 relative grow rounded-full h-3">
              <Slider.Range className="absolute bg-amber-400 rounded-full h-3" />
            </Slider.Track>
            {/* Thumb */}
            <Slider.Thumb
              className="block w-8 h-8 bg-amber-400 border-4 border-white shadow-lg rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 transition-transform duration-150"
              aria-label="Selected time"
            />
          </Slider.Root>
          {/* Ticks/Labels */}
          <div className="flex justify-between text-xs text-slate-500 w-full mt-2 px-1 select-none">
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
        {/* Prominent current time below */}
        <div
          className="mt-2 text-2xl font-bold text-amber-700"
          aria-live="polite"
        >
          {formatTimeDisplay(sortedTimes[sliderValue])}
        </div>
      </div>
    </Card>
  );
};

// Debounce utility
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

export default TimeControl;
