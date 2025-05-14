# Quick Wins: Mobile Experience Enhancements (Desktop Priority)

This plan focuses on high-impact, low-effort improvements for the mobile usability of "Terrasse au Soleil," with the primary goal of not altering the existing desktop UI/UX.

---

## Priority 1: Critical Mobile Fixes & Enhancements

### 1.1. **Adapt Map Marker Popups for Mobile (Primary Concern)**

- **File(s):** Likely `src/components/map/MapView.tsx` and any component it uses for popup rendering.
- **Problem:** Popups are too large for mobile screens, hindering usability.
- **Action - Responsive Styling for Popups:**
  - **Container:** Apply classes for smaller screens (default/no prefix):
    - `max-w-[85vw]` (or similar to prevent edge bleeding)
    - `max-h-[60vh]` (or adjust based on typical content)
    - `p-2` or `p-3` (reduced padding)
    - `overflow-y-auto` (if content can exceed max height)
  - **Text:** Use smaller font sizes (e.g., `text-xs`, `text-sm`).
  - **Layout:** If content is complex, consider a more vertical stacking of elements within the popup on mobile.
  - **Close Button:** Ensure it's easily tappable and visible (e.g., `p-2` on the button or a larger icon).
- **Desktop Impact:** None. Use Tailwind's responsive prefixes (e.g., `sm:p-4`, `sm:text-base`) to restore/maintain current desktop styles.

### 1.2. **Implement Viewport Meta Tag**

- **File:** `src/app/layout.tsx`
- **Action:** Add `<meta name="viewport" content="width=device-width, initial-scale=1">` inside the `<head>`.
- **Desktop Impact:** None. Standard for all responsive sites.
- **Rationale:** Essential for correct scaling and touch interaction on mobile.

### 1.3. **Activate Mobile Navigation Menu**

- **File:** `src/components/layout/Header.tsx`
- **Problem:** Hamburger icon exists but is non-functional.
- **Action:**
  - Introduce a state variable (e.g., `const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);`).
  - Toggle this state on hamburger button click.
  - Create a simple menu panel (e.g., absolutely positioned, `bg-white`, `z-50`, `p-4`) that shows/hides based on `isMobileMenuOpen`.
  - Style this panel to be `block md:hidden`.
  - Ensure links inside are tappable and the menu is closable.
- **Desktop Impact:** None. The mobile menu remains hidden on `md:` screens and larger.

---

## Priority 2: Key Mobile Layout & Usability Adjustments

### 2.1. **Responsive Sizing for Floating Controls**

- **File:** `src/app/page.tsx` (and relevant components `SearchBar.tsx`, `TimeControl.tsx`)
- **Action - SearchBar (`fixed top-6 left-6`):**
  - Modify width class: from `w-[min(90vw,400px)]` to `w-[calc(100vw-2rem)] sm:w-[min(90vw,400px)]` (provides 1rem margin on each side on mobile).
- **Action - TimeControl container (`fixed bottom-6`):**
  - Add horizontal padding for mobile: `px-4 sm:px-0` to its parent div (`w-full max-w-lg px-0`) to prevent touching screen edges.
- **Desktop Impact:** None. `sm:` prefixes ensure changes are mobile-only.
- **Rationale:** Prevents overflow and improves aesthetics on small screens.

### 2.2. **Safe Area Padding for Floating Controls**

- **File:** `src/app/page.tsx` (containers for `SearchBar` and `TimeControl`)
- **Action:** On the fixed-positioned parent `div`s for `SearchBar` and `TimeControl`, add Tailwind's safe area padding classes:
  - For `SearchBar`: `pt-[env(safe-area-inset-top)]`
  - For `TimeControl`: `pb-[env(safe-area-inset-bottom)]`
- **Desktop Impact:** None. `env(safe-area-inset-*)` are zero on non-mobile/desktop.
- **Rationale:** Prevents critical controls from being obscured by notches or system bars.

### 2.3. **Responsive Modal Styling (`MethodologyModal.tsx`)**

- **File:** `src/components/ui/MethodologyModal.tsx`
- **Action:** Modify the main `motion.div` classes:
  - Width/Margins: from `max-w-2xl w-full mx-4` to `w-[calc(100%-2rem)] sm:w-full sm:max-w-2xl sm:mx-4`.
  - Rounding: from `rounded-2xl` to `rounded-lg sm:rounded-2xl`.
  - Height: from `style={{ maxHeight: "80vh" }}` to `className="h-auto max-h-[85vh] sm:max-h-[80vh]"`. (Using Tailwind classes for consistency if possible, otherwise keep style prop).
- **Desktop Impact:** None. `sm:` prefixes ensure desktop style retention.
- **Rationale:** Better use of screen real estate on mobile.

### 2.4. **Improve Tap Targets for Key Mobile Interactions**

- **Files:** `src/components/layout/Header.tsx` (mobile menu button), `src/components/ui/MethodologyModal.tsx` (close button).
- **Action:** Ensure these buttons have adequate touch area.
  - Example: Add `p-2` to the button wrapper or ensure the SVG icon is within a larger clickable area. Minimum effective size `w-10 h-10` (40px).
- **Desktop Impact:** Minimal; usually unnoticeable or slightly larger, acceptable hit areas.

---

## Priority 3: General Quick Enhancements

### 3.1. **Basic Loading Indicator for MapView**

- **File:** `src/components/map/MapView.tsx`
- **Action:** If a clear loading state isn't present while map tiles/data load, add a simple centered spinner or "Loading map..." text.
- **Desktop Impact:** Positive. Improves perceived performance for all.

### 3.2. **ARIA Attributes for New Mobile UI**

- **Files:** `src/components/layout/Header.tsx` (mobile menu, toggle button), any map popup components.
- **Action:** Add appropriate `aria-label`, `aria-expanded`, `aria-controls` for the mobile menu. Ensure popups are announced correctly by screen readers.
- **Desktop Impact:** Positive. Benefits all users.

---

**Guiding Principle:** All styling changes for mobile should use responsive prefixes (e.g., `sm:`, `md:`) to ensure desktop UI remains unchanged. Default styles (no prefix) will apply to mobile, and `sm:` or `md:` styles will override them for larger screens.
