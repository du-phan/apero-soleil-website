import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { addMinutes, parseISO, format, isValid } from "date-fns";

interface TimeState {
  currentDate: Date;
  currentTime: string; // Format: "HH:MM"
  setDate: (date: Date) => void;
  setTime: (time: string) => void; // Format: "HH:MM"
  resetToNow: () => void;
  formattedDate: string; // Format: "YYYY-MM-DD"
}

// Round the current time to the nearest 30-minute interval
const roundToNearestHalfHour = (date: Date): string => {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 30) * 30;
  const adjustedDate = addMinutes(
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      0
    ),
    roundedMinutes
  );
  return format(adjustedDate, "HH:mm");
};

const now = new Date();
const defaultTime = roundToNearestHalfHour(now);

const TimeContext = createContext<TimeState>({
  currentDate: now,
  currentTime: defaultTime,
  setDate: () => {},
  setTime: () => {},
  resetToNow: () => {},
  formattedDate: format(now, "yyyy-MM-dd"),
});

export function TimeProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDate] = useState<Date>(now);
  const [currentTime, setCurrentTime] = useState<string>(defaultTime);

  const formattedDate = format(currentDate, "yyyy-MM-dd");

  const setDate = (date: Date) => {
    if (isValid(date)) {
      setCurrentDate(date);
    }
  };

  const setTime = (time: string) => {
    // Validate time format
    if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      setCurrentTime(time);
    }
  };

  const resetToNow = () => {
    const newNow = new Date();
    setCurrentDate(newNow);
    setCurrentTime(roundToNearestHalfHour(newNow));
  };

  return (
    <TimeContext.Provider
      value={{
        currentDate,
        currentTime,
        setDate,
        setTime,
        resetToNow,
        formattedDate,
      }}
    >
      {children}
    </TimeContext.Provider>
  );
}

export const useTime = () => useContext(TimeContext);
