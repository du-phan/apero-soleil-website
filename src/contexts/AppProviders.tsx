"use client";

import { ReactNode } from "react";
import { TimeProvider } from "./TimeContext";

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return <TimeProvider>{children}</TimeProvider>;
}
