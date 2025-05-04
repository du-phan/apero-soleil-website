# 🌞 Development Plan: "Terrasse au Soleil"

## 🎯 Overview

This development plan outlines the implementation strategy for the "Terrasse au Soleil" web application, which helps users find sun-soaked bar terraces in Paris. The plan follows a modular approach, breaking down components and features into manageable tasks while ensuring a cohesive user experience.

## 🧩 Tech Stack

### Core Technologies

- **Frontend Framework**: Next.js 15 (App Router) with React Server Components
- **Styling**: Tailwind CSS with custom design system tokens
  - **CSS Utilities**: `tailwind-merge` for conditional class merging
  - **Animation**: Framer Motion for advanced animations (Solar Flare effect)
- **Map Visualization**: MapLibre GL JS
  - **Marker Clustering**: Supercluster for efficient point clustering
  - **Geocoding**: Mapbox Geocoding API for search functionality
- **State Management**: React Context API + SWR for data fetching
- **Data Storage**: Direct GeoJSON usage for terrace data during development, Supabase with PostGIS (final integration)
- **Deployment**: Vercel with Edge Functions

### Key Dependencies

- `maplibre-gl`
- `tailwindcss`
- `swr`
- `framer-motion`
- `csv-parser`
- `supercluster`
- `@vercel/analytics`
- `date-fns`

## 📐 Project Structure

Under our `apero-soleil-website` folder:

```
public/
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── terraces/         # Terrace data endpoints
│   │   ├── sunshine/         # Sunshine calculation endpoints
│   │   └── sharing/          # Social sharing endpoints
│   ├── (routes)/             # Application routes
│   ├── layout.js             # Root layout
│   └── page.js               # Home page (map view)
├── components/               # Reusable components
│   ├── layout/               # Layout components
│   │   ├── Header.jsx        # Application header
│   │   ├── Footer.jsx        # Application footer
│   │   └── Container.jsx     # Responsive container
│   ├── map/                  # Map-related components
│   │   ├── MapView.jsx       # Primary map container
│   │   ├── MapControls.jsx   # Map navigation controls
│   │   ├── TerraceMarker.jsx # Individual terrace marker
│   │   ├── MarkerCluster.jsx # Clustering component
│   │   └── MapPopup.jsx      # Popup component for terraces
│   ├── controls/             # User control components
│   │   ├── TimeSlider.jsx    # Time selection slider
│   │   ├── DatePicker.jsx    # Date selection component
│   │   ├── NowButton.jsx     # Reset to current time
│   │   └── SearchBar.jsx     # Location search input
│   ├── terraces/             # Terrace-related components
│   │   ├── TerraceCard.jsx   # Terrace information card
│   │   ├── SunTimeline.jsx   # Timeline of sunshine periods
│   │   ├── ShareButton.jsx   # Social sharing component
│   │   └── TerraceList.jsx   # List view of terraces
│   ├── ui/                   # UI components
│   │   ├── Button.jsx        # Button component
│   │   ├── Card.jsx          # Card component
│   │   ├── Input.jsx         # Input component
│   │   ├── Toggle.jsx        # Toggle component
│   │   ├── Dropdown.jsx      # Dropdown component
│   │   ├── Modal.jsx         # Modal component
│   │   ├── Timeline.jsx      # Timeline component
│   │   └── Tooltip.jsx       # Tooltip component
│   └── effects/              # Visual effects (Solar Flare)
│       ├── SolarFlare.jsx    # Main Solar Flare effect container
│       ├── RadialGradient.jsx # Gradient propagation component
│       ├── LightRays.jsx     # Sun-angle light rays component
│       ├── InteractiveLight.jsx # Interactive light response
│       └── TimeTransition.jsx # Time-shift transition effect
├── lib/                      # Utilities and helpers
│   ├── api/                  # API client functions
│   │   ├── terraces.js       # Terrace data fetching
│   │   └── sunshine.js       # Sunshine data calculations
│   ├── hooks/                # Custom React hooks
│   │   ├── useMap.js         # MapLibre GL hook
│   │   ├── useSunshine.js    # Sunshine data hook
│   │   ├── useTerraces.js    # Terrace data hook
│   │   └── useTime.js        # Time/date management hook
│   ├── data/                 # Data processing utilities
│   │   ├── geoJson.js        # GeoJSON utilities and helpers
│   │   └── dataTransformers.js # Data transformation helpers
│   ├── mapUtils/             # Map utility functions
│   │   ├── clustering.js     # Marker clustering utilities
│   │   ├── markers.js        # Marker generation
│   │   ├── geocoding.js      # Geocoding utilities
│   │   └── styling.js        # Map style utilities
│   └── sunCalculations/      # Sunshine calculations
│       ├── sunPosition.js    # Solar position calculations
│       ├── sunTimeline.js    # Timeline generation
│       └── rayTracing.js     # Light ray visualization
├── styles/                   # Global styles
│   ├── globals.css           # Global CSS
│   └── tailwind.css          # Tailwind entry point
├── data/                     # Sample data (development)
│   └── sunlight_results_XXX.geojson  # Sample terrace data in GeoJSON format
└── contexts/                 # React Context providers
    ├── MapContext.jsx        # Map state context
    ├── TimeContext.jsx       # Time control context
    ├── TerraceContext.jsx    # Terrace data context
    └── UIContext.jsx         # UI state context
```

## 🎨 Design System

### Color Palette

- **Primary**: Warm amber (#F9A825) for sunlit areas
  - Light variant: #FFD54F (subtle highlights)
  - Dark variant: #F57F17 (emphasis)
- **Secondary**: Cool slate blue (#607D8B) for shaded areas
  - Light variant: #B0BEC5 (subtle highlights)
  - Dark variant: #455A64 (emphasis)
- **Accent**: Vibrant coral (#FF5252) for interactive elements
  - Light variant: #FF8A80 (hover states)
  - Dark variant: #D50000 (active states)
- **Background**: Clean white (#FFFFFF) with subtle off-white (#F5F7FA) variations
- **Text**: Dark slate (#1A2C42) for primary text, medium gray (#566B7F) for secondary
- **Success**: #43A047 (positive feedback)
- **Warning**: #FFA000 (warnings and alerts)
- **Error**: #E53935 (error states)

### Typography

- **Primary Font**: Inter (clean, modern sans-serif)
- **Secondary Font**: Playfair Display (for select headings to add Parisian charm)
- **Font Sizes**:
  - xs: 12px (0.75rem)
  - sm: 14px (0.875rem)
  - base: 16px (1rem)
  - lg: 18px (1.125rem)
  - xl: 20px (1.25rem)
  - 2xl: 24px (1.5rem)
  - 3xl: 30px (1.875rem)
  - 4xl: 36px (2.25rem)
- **Line Heights**: 1.5 for body text, 1.2 for headings
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Spacing System

- Base unit of 4px with increments:
  - 0: 0px
  - 1: 4px (0.25rem)
  - 2: 8px (0.5rem)
  - 3: 12px (0.75rem)
  - 4: 16px (1rem)
  - 5: 20px (1.25rem)
  - 6: 24px (1.5rem)
  - 8: 32px (2rem)
  - 10: 40px (2.5rem)
  - 12: 48px (3rem)
  - 16: 64px (4rem)
  - 20: 80px (5rem)

### Component Library

- Implement core UI components with Tailwind CSS:
  - **Button**: Primary, secondary, tertiary variants with hover/active states
  - **Card**: Standard, interactive, highlighted variants
  - **Input**: Text input, searchbox with clear button
  - **Toggle**: On/off state with animations
  - **Dropdown**: Simple select dropdown
  - **Modal**: Lightbox-style modal with backdrop
  - **Timeline**: Interactive timeline with markers
  - **Tooltip**: Information tooltip with arrow

## 🔄 State Management

### Application State

Create a central state management system using React Context API to handle:

1. **MapContext**

   - Current map view (center coordinates, zoom level)
   - Map interaction state (drag, zoom, click)
   - Map style configuration
   - Marker visibility and clustering thresholds

2. **TimeContext**

   - Selected date and time
   - Time control state (playing/paused)
   - Sunshine periods for the current day
   - Time format preferences

3. **TerraceContext**

   - Selected terrace
   - Terrace search results
   - Visible terraces in current view
   - Terrace filtering state (sunlit only, etc.)

4. **UIContext**
   - Mobile responsive state (current viewport size)
   - Modal visibility states
   - Sidebar/panel visibility
   - Animation preferences
   - Loading states

## 📑 Component Development Plan

### Phase 1: Foundation Components

#### 1. Core Layout (Days 1-2)

- ✅ Root layout with metadata and analytics setup
- ✅ Responsive container layout with mobile breakpoints
- ✅ Main app structure with header and footer
- ✅ Initial page routes setup

#### 2. GeoJSON Data Service (Days 2-3)

- ✅ Prepare sample terrace data in GeoJSON format
- ✅ Implement data access layer to read directly from GeoJSON
- ✅ Define data transformation functions for app consumption
- Set up in-memory caching for efficient data access

#### 3. Map Component (Days 3-5)

- ✅ Basic MapLibre GL integration
- ✅ Custom map styling based on design
- ✅ Initial map view configuration (Le Marais)
- ✅ Map controls (zoom, pan)
- ✅ Basic marker rendering

#### 4. Basic UI Elements (Days 5-7)

- ✅ Header component with navigation
- ✅ Footer component with attribution
- ✅ Core UI components library (buttons, inputs)
- Loading states and error handling
- Responsive layout adjustments

### Phase 2: Core Functionality

#### 5. Terrace Visualization (Days 8-10)

- ✅ Terrace marker component with conditional styling
- ✅ Differentiated sunny/shaded markers
- ✅ Basic clustering implementation
- Popup component for terrace info
- Le Marais points of interest

#### 6. Time Controls (Days 10-12)

- ✅ Time slider component with draggable interface
- ✅ Date selector component with calendar
- "Now" button functionality
- ✅ Time period visualization with sun indicators
- ✅ Time update handling for map display

#### 7. Terrace Information (Days 12-14)

- ✅ Terrace detail card with address and status
- ✅ Sunshine timeline component showing periods
- ✅ Basic information display with time-aware content
- ✅ Card transitions and animations

#### 8. Search Functionality (Days 14-16)

- ✅ Search input component with autocomplete
- Geocoding integration for locations
- ✅ Search results display with prioritization
- ✅ Map navigation on search selection
- Recent searches storage

### Phase 3: Solar Flare Effect Implementation

#### 9. Base Marker Enhancement (Days 17-18)

- Enhanced marker differentiation for sunny/shaded terraces
- SVG-based marker system with dynamic properties
- Basic sunshine indicator styling
- Performance monitoring and optimization

#### 10. Radial Gradient Propagation (Days 18-20)

- SVG gradient implementation with mask layer
- CSS animation for propagation effect
- Sun-angle calculation integration for direction
- Gradient intensity based on sun altitude
- Batched rendering for performance

#### 11. Sun-Angle Light Rays (Days 20-22)

- SVG path generation for light rays
- Dynamic ray direction based on sun position and azimuth
- Animation for ray intensity changes
- Ray length adjustment based on time of day
- Optimization for mobile devices

#### 12. Interactive Light Response (Days 22-24)

- Mouse/touch position tracking system
- Light intensity modulation based on proximity
- Debounced event handlers for performance
- Mobile-optimized touch interactions
- Fallback behaviors for low-end devices

#### 13. Time-Shift Transition (Days 24-26)

- Animation system for time changes
- Status change effects (sunny to shaded transitions)
- Geographic position-based timing for sun movement
- Staggered animations for natural effect
- Edge case handling for day boundaries

### Phase 4: Social Sharing Integration

#### 14. Share Functionality (Days 26-28)

- "Share this sunny spot" button implementation
- URL parameter generation with state encoding
- Web Share API integration for mobile devices
- Platform-specific sharing for desktop (Twitter/Facebook/WhatsApp)
- Fallback copy-to-clipboard with confirmation
- URL structure design for SEO benefits

#### 15. Social Sharing Metadata (Days 28-30)

- OpenGraph data generation for link previews
- Dynamic share text generation based on context
- Context-aware image generation for previews
- Branded hashtag integration
- Analytics event tracking for shares

### Phase 5: Polish and Optimization

#### 16. Performance Optimization (Days 30-32)

- Component lazy loading for non-critical elements
- Asset optimization (images, SVGs)
- Query optimization and caching strategies
- Animation performance tuning (requestAnimationFrame)
- Bundle size analysis and optimization

#### 17. Accessibility Enhancements (Days 32-34)

- Keyboard navigation for all interactive elements
- Screen reader compatibility testing and fixes
- Focus management and tab ordering
- Color contrast verification and adjustments
- ARIA attributes for custom components

#### 18. Responsive Refinements (Days 34-36)

- Mobile layout optimizations for smaller screens
- Touch interaction improvements for map navigation
- Device-specific enhancements (iOS/Android)
- Orientation change handling
- Final cross-browser testing

## 📱 Responsive Design Strategy

### Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Approach

- Mobile-first design with progressive enhancement
- Flexible layout with CSS Grid and Flexbox
- Conditional rendering for complex UI on smaller screens:
  - Simplified map controls on mobile
  - Bottom sheet for terrace details on mobile vs. sidebar on desktop
  - Collapsible time controls on mobile
- Touch-optimized interactions with larger hit areas on mobile
- Performance optimizations for mobile devices:
  - Reduced animation complexity
  - Lower clustering thresholds
  - Simplified Solar Flare effect

## 🌐 Data Handling Strategy

### Terrace Data Structure

Terrace data is now provided directly in [GeoJSON](https://geojson.org/) format. Each terrace is represented as a GeoJSON Feature with properties such as:

```
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [2.3572601351159532, 48.855649643100065]
  },
  "properties": {
    "terrace_id": "21 RUE FRANCOIS MIRON, 75004",
    "date": "2025-05-12",
    "time_slot": "10:00",
    "is_sunlit": true,
    "sun_altitude": 35.2,
    "sun_azimuth": 120.5,
    "h_terrace": 1.2,
    "distance_to_obstacle": 5.0, // optional
    "obstruction_height": 2.0,   // optional
    "ray_height_at_obstacle": 1.1, // optional
    "obstruction_lat": 48.8557,  // optional
    "obstruction_lon": 2.3573    // optional
  }
}
```

### Development Phase

1. **Direct GeoJSON Usage**:

   - Read the GeoJSON file directly for terrace data
   - Implement efficient access patterns for quick lookups and filtering

2. **Data Access Layer**:

   - Build API routes that read from GeoJSON file
   - Implement filtering by location, time, and sunshine status
   - Create in-memory caching for frequent queries

3. **Data Transformation**:
   - Use GeoJSON directly for map visualization
   - Create time-series data structures for timeline visualization
   - Aggregate sunshine data for heat indicators

### API Structure

- `/api/terraces` - Get all terraces
  - Query params: `date`, `time`, `sunlit`
- `/api/terraces/nearby` - Get terraces near coordinates
  - Query params: `lat`, `lon`, `radius`, `date`, `time`, `sunlit`
- `/api/terraces/[id]` - Get terrace details
  - Query params: `date` (for full day sunshine data)
- `/api/sunshine` - Get sunshine data for specified parameters
  - Query params: `date`, `time`, `bounds` (map boundaries)

### Production Integration (Post-MVP)

- Migrate from local GeoJSON to Supabase with PostGIS
- Implement spatial queries using PostGIS `ST_DWithin`
- Set up efficient caching strategies with SWR
- Implement incremental static regeneration for common queries

## ⚡ Solar Flare Effect Implementation Details

The Solar Flare effect will be implemented in stages, following these detailed technical approaches:

1. **Base Implementation**

   - Create SVG-based marker system using React components
   - Implement CSS variables for dynamic styling
   - Establish performance monitoring baselines
   - Build marker state transitions with CSS transitions

2. **Radial Gradient System**

   - Create SVG overlay layer for gradients
   - Implement radial gradients with customizable parameters:
     ```css
     .sunlit-gradient {
       background: radial-gradient(
         circle at center,
         rgba(249, 168, 37, 0.7) 0%,
         rgba(249, 168, 37, 0.3) 30%,
         rgba(249, 168, 37, 0) 70%
       );
     }
     ```
   - Dynamically position gradients based on marker locations
   - Apply SVG masks to control gradient shape and direction
   - Use CSS animations for expanding effect:
     ```css
     @keyframes expand {
       from {
         transform: scale(0.7);
         opacity: 0.3;
       }
       to {
         transform: scale(1.5);
         opacity: 0;
       }
     }
     ```
   - Calculate sun angle based on `sun_azimuth` field for proper direction

3. **Dynamic Light Rays**

   - Generate SVG paths dynamically based on sun position:
     ```javascript
     const createRay = (azimuth, altitude, length) => {
       const angle = (azimuth * Math.PI) / 180;
       const dx = Math.sin(angle) * length;
       const dy = Math.cos(angle) * length;
       return `M 0,0 L ${dx},${dy}`;
     };
     ```
   - Create multiple rays with varying lengths for natural effect
   - Apply animations with `stroke-dasharray` and `stroke-dashoffset`
   - Adjust ray opacity based on sun altitude
   - Implement staggered animation timings:
     ```javascript
     rays.forEach((ray, i) => {
       ray.style.animationDelay = `${i * 0.1}s`;
     });
     ```

4. **Interactive Light Response**

   - Track cursor position relative to markers:

     ```javascript
     const handleMouseMove = (e) => {
       const { clientX, clientY } = e;
       const markers = document.querySelectorAll(".terrace-marker");

       markers.forEach((marker) => {
         const rect = marker.getBoundingClientRect();
         const distance = getDistance(
           { x: clientX, y: clientY },
           { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
         );

         const intensity = Math.max(0, 1 - distance / 200);
         marker.style.setProperty("--intensity", intensity);
       });
     };
     ```

   - Implement throttled event handlers (max 60fps)
   - Use CSS variables to control intensity
   - Apply subtle scale and glow effects
   - Provide fallback for touch devices

5. **Time-Shift Transition**

   - Create transition manager to track state changes:

     ```javascript
     const handleTimeChange = (newTime) => {
       const prevSunlit = getTerracesByStatus(currentTime, true);
       const newSunlit = getTerracesByStatus(newTime, true);

       // Find terraces changing status
       const becoming = newSunlit.filter((t) => !prevSunlit.includes(t));
       const losing = prevSunlit.filter((t) => !newSunlit.includes(t));

       // Apply transitions
       applyTransitions(becoming, "become-sunlit");
       applyTransitions(losing, "become-shaded");

       // Trigger directional sweep
       triggerSweep(currentTime, newTime);
     };
     ```

   - Calculate geographic sweep based on sun movement
   - Apply brief golden flash effect for state changes
   - Use CSS transitions with geographic staggering
   - Optimize for simultaneous transitions across many elements

## 🧪 Testing Strategy

### Unit Testing

- Component testing with Jest and React Testing Library
  - UI component behavior verification
  - Time calculation function accuracy
  - Data transformation utilities
  - Context provider state management

### Integration Testing

- Map interaction testing
  - Marker click handling
  - Zoom level transitions
  - Clustering behavior
- Data flow testing
  - API request/response validation
  - State updates on user interactions
  - Data filtering operations
- Time control integration
  - Timeline manipulation
  - Date selector integration
  - "Now" button functionality

### Visual Testing

- Storybook for component visual testing
- Solar Flare effect rendering across devices
- Responsive layout verification
- Animation timing and smoothness

### Performance Testing

- Lighthouse performance profiling
  - Core Web Vitals monitoring
  - First Contentful Paint < 1.2s
  - Time to Interactive < 1.5s
- Animation frame rate monitoring (target: 60fps)
- Memory usage profiling
- Mobile device testing
  - Mid-tier Android devices
  - iOS devices

### Accessibility Testing

- WCAG AA compliance verification
- Screen reader compatibility
- Keyboard navigation testing
- Color contrast analysis

## 🚀 Development Milestones & Timeline

### Week 1: Foundation (Days 1-7)

- Project setup and repository configuration
- Core layout and UI component implementation
- GeoJSON data loading and basic API endpoints
- Initial map integration with styling

### Week 2: Core Functionality (Days 8-14)

- Terrace visualization with marker system
- Time and date controls
- Terrace information display
- Search functionality and map navigation

### Week 3: Solar Flare Effect (Days 15-21)

- Base marker enhancement
- Radial gradient implementation
- Sun-angle light rays
- Interaction foundations

### Week 4: Solar Flare & Sharing (Days 22-28)

- Interactive light response
- Time-shift transitions
- Share functionality
- Social sharing metadata

### Week 5: Polish & Finalization (Days 29-36)

- Performance optimization
- Accessibility improvements
- Responsive refinements
- Final testing and bug fixes

## 📊 Success Metrics

- Intuitive terrace discovery within 5 seconds of landing
- Solar Flare Effect successfully creates a "wow" reaction
- Mobile performance with <1.5s Time-to-Interactive
- WCAG AA accessibility compliance achieved
- Smooth animations (60fps) on target devices
- Sharing feature properly generates context-aware content

## 🔄 Iteration Strategy

- Implement daily builds with incremental feature additions
- Set up weekly review checkpoints
- Prioritize core functionality before visual enhancements
- Allow time for feedback-driven adjustments
- Focus on usability over feature completeness

---

This development plan serves as a blueprint for building the "Terrasse au Soleil" MVP while ensuring a focused implementation with special attention to the Solar Flare effect as the standout feature.
