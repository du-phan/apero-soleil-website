"use client";

import React from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/Card";

export const DateControl: React.FC = () => {
  // Get today's date formatted
  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy"); // e.g., "Monday, May 4, 2025"

  return (
    <Card className="p-4 flex-1">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-600">Date</h3>

        <div className="bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
          <p className="text-amber-800 font-medium text-sm">
            Today ({formattedDate})
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Data is only available for today
          </p>
        </div>
      </div>
    </Card>
  );
};

export default DateControl;
