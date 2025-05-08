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
    // Use 24-hour French style: HH:mm
    return format(date, "HH:mm");
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
    <div className="w-full max-w-xl flex flex-col items-center">
      <div className="flex flex-row flex-wrap items-baseline mb-3 w-full justify-center">
        <span className="text-lg font-medium text-slate-800 drop-shadow-sm">
          Où boire un coup et se bronzer à{" "}
          {formatTimeDisplay(sortedTimes[sliderValue])} ?
        </span>
      </div>
      <div className="w-full flex flex-col items-center">
        <div className="relative w-full max-w-2xl px-2">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-6"
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
            <Slider.Track className="bg-slate-300 dark:bg-slate-700 relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-amber-400 rounded-full h-2" />
            </Slider.Track>
            {/* Thumb */}
            <Slider.Thumb
              className="block w-6 h-6 bg-amber-400 border-4 border-white shadow-lg rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400 transition-transform duration-150"
              aria-label="Selected time"
            />
          </Slider.Root>
          {/* Ticks/Labels */}
          <div className="flex justify-between text-xs text-slate-800 drop-shadow-sm w-full mt-2 px-1 select-none">
            <span className="w-16 text-left">
              {formatTimeDisplay(sortedTimes[0])}
            </span>
            <span className="w-16 text-center">
              {formatTimeDisplay(
                sortedTimes[Math.floor(sortedTimes.length / 2)]
              )}
            </span>
            <span className="w-16 text-right">
              {formatTimeDisplay(sortedTimes[sortedTimes.length - 1])}
            </span>
          </div>
        </div>
      </div>
    </div>
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
