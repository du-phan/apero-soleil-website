"use client";

import React from "react";
import * as Slider from "@radix-ui/react-slider";
import { format } from "date-fns";
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
  // Fallback to 17:00 if currentTime is not in sortedTimes
  const fallbackTime = "17:00";
  const initialIndex = sortedTimes.includes(currentTime)
    ? sortedTimes.indexOf(currentTime)
    : sortedTimes.indexOf(fallbackTime);
  const [sliderValue, setSliderValue] = React.useState(initialIndex);

  // Keep slider in sync with context, fallback to 17:00 if out of range
  React.useEffect(() => {
    if (sortedTimes.includes(currentTime)) {
      setSliderValue(sortedTimes.indexOf(currentTime));
    } else {
      setSliderValue(sortedTimes.indexOf(fallbackTime));
      setTime(fallbackTime);
    }
  }, [currentTime, setTime]);

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
          Où trouver une terrasse au soleil à{" "}
          {formatTimeDisplay(sortedTimes[sliderValue])} aujourd&#39;hui ?
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
            <Slider.Track className="bg-[#607D8B] relative grow rounded-full h-2">
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
function debounce(func: (index: number) => void, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (index: number) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(index), waitFor);
  };
  return debounced;
}

export default TimeControl;
