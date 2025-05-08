# Immersive Map UI Implementation Plan

**Goal:** Redesign the app interface for a beautiful, immersive, and simple map-centric experience, inspired by Google Maps and Shadowmap. The map should fill the viewport, with minimal, elegantly styled floating controls. This plan details concrete steps using the existing tech stack: Next.js 15 (App Router), React, Tailwind CSS, MapLibre GL JS, framer-motion, and integrating `shadcn/ui` for UI components.

---

## 1. Analyze & Document Current UI

The current UI, primarily structured in `src/app/page.tsx`, presents several opportunities for achieving full immersion:

- **Layout (`src/app/page.tsx`):** Employs a standard flex column (`<div className="flex flex-col min-h-screen">`) containing a `<Header />`, `<main>`, and `<Footer />`. This structure inherently limits map viewport space.
- **Header (`src/components/layout/Header.tsx`):** A conventional header occupying significant vertical space with branding and navigation. This will be removed in the new immersive design.
- **Map Container (`src/app/page.tsx`):** The `<MapView />` is currently constrained within a `div` with a calculated height (e.g., `h-[calc(100vh-300px)]`). This is the primary element to change for full-screen immersion.
- **Controls (`src/components/controls/TimeControl.tsx`, `src/app/page.tsx`):**
  - `TimeControl` (using `@radix-ui/react-slider`) is embedded within the main content flow, styled as a card. This will be detached and floated.
  - A "Now" button and potentially other controls are also part of the static layout.
- **Footer (`src/components/layout/Footer.tsx`):** A standard footer, which will be removed from the map view.
- **Pain Points for Immersion:**
  - Fixed `Header` and `Footer` consuming valuable screen real estate.
  - Map view not occupying the full viewport height and width.
  - Controls are part of the page flow rather than floating above the map.

## 2. Design the New Layout

- **Core Principle:** The map is the absolute background, filling 100% of the viewport width and height.
- **Floating Elements:**
  - **Time Slider:** Positioned bottom-center (e.g., `fixed bottom-6 left-1/2 -translate-x-1/2`). Consider alternatives like bottom-right if less intrusive.
  - **Search Bar:** Positioned top-left (e.g., `fixed top-6 left-6`) or top-center (e.g., `fixed top-6 left-1/2 -translate-x-1/2`).
  - **Branding:** A very small, subtle logo or app name (e.g., "☀️ TS"), positioned top-left (if search is elsewhere) or top-right (e.g., `fixed top-6 right-6`).
- **Visual Hierarchy:** Floating elements should be distinct but not visually overwhelming, using consistent styling (see Section 4).
- **Responsive Behavior:**
  - **Desktop:** Optimized for mouse interaction, potentially wider controls.
  - **Mobile:** Controls might stack vertically (e.g., search above slider if both are centered) or have reduced padding/size to be thumb-friendly and not obscure too much map area. Consider placing controls closer to the bottom edge for easier reach.

## 3. Refactor Layout Structure

- **Target File:** Primarily `src/app/page.tsx` (or a new dedicated layout component for the map view if preferred).
- **Steps:**
  - Remove the existing `<Header />` and `<Footer />` components from the `src/app/page.tsx` render output.
  - Modify the root element in `src/app/page.tsx` to be the main full-screen container: `<div className="relative w-screen h-screen overflow-hidden">`.
  - Place `<MapView className="absolute inset-0 z-0" />` directly within this container, ensuring it acts as the base layer.
  - The global layout `src/app/layout.tsx` should remain for providing global context (like `AppProviders`) and base HTML structure, but the visual page structure for the map view will be dictated by `src/app/page.tsx`.

## 4. Implement Floating Controls

- **General Styling for Floating Elements:**
  - Apply consistent styling using Tailwind CSS for a cohesive, modern look.
  - Example: `bg-background/80 backdrop-blur-md rounded-lg shadow-xl border border-border/20 p-3 md:p-4 z-10`. This creates a "glassmorphism" effect that adapts to light/dark themes if `bg-background` is theme-aware.
- **Time Slider:**
  - **Component:** Adapt the existing `TimeControl.tsx`. Since it already uses `@radix-ui/react-slider`, focus on restyling it to match `shadcn/ui` Slider aesthetics or replace it with the `shadcn/ui` Slider component directly for consistency.
  - **Positioning:** `fixed bottom-6 left-1/2 -translate-x-1/2` (or alternative).
  - **Animation (framer-motion):** Smooth entrance (e.g., slide in from bottom, fade in): `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}`.
- **Search Bar:**
  - **Component:** Implement using `shadcn/ui` Combobox (`@/components/ui/combobox`). This provides a rich, accessible autocomplete experience.
  - **Positioning:** `fixed top-6 left-6` or `fixed top-6 left-1/2 -translate-x-1/2`.
  - **Styling:** Apply the general floating element style.
  - **Animation (framer-motion):** Smooth entrance (e.g., slide in from top, fade in): `initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}`.
- **Branding:**
  - **Element:** A small SVG logo or a stylized text component for "☀️ TS".
  - **Positioning:** `fixed top-6 right-6 z-10` (or `top-6 left-6` if search is centered/right).
  - **Styling:** Minimalist and subtle, possibly just text with a specific font/color or a small icon.
  - **Animation (framer-motion):** Gentle fade-in.

## 5. Responsive & Accessibility

- Ensure all floating controls are touch-friendly: adequate tap target sizes, no accidental map interaction when using controls.
- `shadcn/ui` components are built with accessibility in mind; ensure ARIA roles, keyboard navigation, and focus states are correctly implemented and tested.
- On mobile:
  - Controls may need to stack vertically to save horizontal space.
  - Reduce padding or font sizes within controls if necessary.
  - Test ergonomics: ensure controls are easily reachable, especially if placed near the bottom.

## 6. Map Interaction & State

- The map must remain fully interactive (zoom, pan, marker clicks) even with floating controls.
- Use `z-index` carefully: map at `z-0`, controls at `z-10` (or higher if other layers like popups exist).
- Ensure controls do not permanently obscure critical map information or interactions. Consider auto-hiding less critical controls after a period of inactivity on mobile (advanced feature, optional).

## 7. Animation & Visual Polish

- **Framer Motion for Controls:**
  - Use for initial appearance/disappearance of controls (fade, slide, scale).
  - Example: `initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}`.
  - Use `layout` prop on `motion.div` elements if their size or position might change, to animate those changes smoothly.
- **Glassmorphism:** Utilize Tailwind's `backdrop-blur-md` and semi-transparent backgrounds (e.g., `bg-background/80` or `bg-slate-900/70` for a dark theme explicit control) for the floating UI elements.
- **Subtle Hover/Focus States:** Enhance interactivity with subtle scale or brightness changes on hover/focus for floating controls.
- **Marker Transitions:** Retain smooth marker color transitions on time change, as this is a key visual cue.

## 8. Remove Unnecessary UI

- Explicitly remove the current `<Header />` and `<Footer />` components from rendering on the map page (`src/app/page.tsx`).
- Critically evaluate any other UI elements. If they don't directly support the map interaction, time selection, or search, they should be removed or moved to a separate informational page/modal.

---

## Example Layout Code (Tailwind + React for `src/app/page.tsx`)

```jsx
// src/app/page.tsx
"use client";

import { MapView } from "@/components/map/MapView"; // Adjusted import path
import { TimeControl } from "@/components/controls/TimeControl"; // Adjusted import path
import { SearchBar } from "@/components/search/SearchBar"; // Assuming new component
import { AppLogo } from "@/components/ui/AppLogo"; // Assuming new component
import { motion } from "framer-motion";

export default function ImmersiveMapPage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-800">
      {" "}
      {/* Added overflow-hidden and a fallback bg */}
      <MapView className="absolute inset-0 z-0" />
      <motion.div
        className="fixed top-6 left-6 z-10" // Example: SearchBar top-left
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <SearchBar /> {/* Uses shadcn/ui Combobox */}
      </motion.div>
      <motion.div
        className="fixed top-6 right-6 z-10" // Example: Logo top-right
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <AppLogo />
      </motion.div>
      <motion.div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4 sm:max-w-lg md:max-w-xl" // Responsive width
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <TimeControl /> {/* Uses shadcn/ui Slider or restyled Radix */}
      </motion.div>
    </div>
  );
}

// Note: SearchBar, AppLogo would be new components.
// TimeControl would be the refactored existing component.
// All floating components would use the shared styling (bg-background/80, backdrop-blur, etc.)
```

---

**References:**

- [Google Maps UI](https://www.google.com/maps)
- [Shadowmap](https://app.shadowmap.org/)
- [Tailwind CSS Position](https://tailwindcss.com/docs/position)
- [Tailwind CSS Z-Index](https://tailwindcss.com/docs/z-index)
- [Tailwind CSS Filters (for backdrop-blur)](https://tailwindcss.com/docs/backdrop-blur)
- [Framer Motion](https://www.framer.com/motion/)
- [shadcn/ui](https://ui.shadcn.com/)
  - [shadcn/ui Slider](https://ui.shadcn.com/docs/components/slider)
  - [shadcn/ui Combobox](https://ui.shadcn.com/docs/components/combobox)
- `@radix-ui/react-slider` (current base for TimeControl)
- Inspiration Screenshots (as provided by user)
