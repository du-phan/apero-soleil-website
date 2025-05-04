# 🌞 BUILD ASSIGNMENT: "Terrasse au Soleil" - Discover Sun-Drenched Paris Terraces

Create a visually captivating yet intuitive web application that helps people find sun-soaked bar terraces in Paris. The experience should deliver an immediate "wow factor" while remaining focused on a single, essential user need.

## 📋 CORE MISSION

Help users answer one crucial question with delight and precision:
**"Where can I find a sunny terrace in Paris right now (or at my chosen time)?"**

## 🛠️ TECHNICAL FOUNDATION

- **Frontend**: Next.js 15 (App Router) with React Server Components for optimal performance
- **Data Storage**: Supabase with PostGIS spatial extensions
- **Map Visualization**: MapLibre GL with custom styling
- **Deployment**: Vercel with Edge Functions for location-based optimizations
- **Analytics**: Simple, privacy-focused page view tracking only

## 📊 DATA STRUCTURE

The application will use a pre-computed sunlight dataset (~700k rows) stored on Supabase with these fields:

- `terrace_id` (unique identifier, also serves as address)
- `terrace_lat`, `terrace_lon` (geographical coordinates)
- `date` (YYYY-MM-DD format)
- `time_slot` (HH:MM in 30-minute increments, ranging from 09:00-21:00)
- `is_sunlit` (boolean indicating sun presence)
- Additional metadata fields for calculations (sun altitude, azimuth, etc.)

For testing and development purposes, use the sample geojson dataset in `/src/data/`

## 🎨 DESIGN PRINCIPLES

### 1. Visual Clarity with Emotional Impact

- Use a **golden ratio-based layout** with the map as the central element
- Implement a **sunshine-inspired color palette**:
  - Primary: Warm amber (#F9A825) for sunlit areas
  - Secondary: Cool slate blue (#607D8B) for shaded areas
  - Accent: Vibrant coral (#FF5252) for interactive elements
- Apply **consistent visual hierarchy** with 8px spacing increments
- Ensure **accessibility compliance** with WCAG AA standards (contrast, focus states)

### 2. Focused User Experience for MVP

- Prioritize two main user journeys:
  - Searching for terraces near a specific location (search-first approach)
  - Browsing sunny terraces directly on the map (browse-first approach)
- Ensure each interaction provides immediate visual feedback
- Design the core search/browse experience to work within 3 clicks
- Maintain a simple, intuitive interface that requires no instructions

### 3. Performance-First Approach

- Achieve **Lighthouse performance score >95**
- Target **<1.5s Time to Interactive** on mobile devices
- Implement **spatial indexing** for lightning-fast queries
- Use **dynamic import boundaries** for code splitting
- Ensure smooth animations even on mid-tier mobile devices

## 🧩 CORE FEATURES (MVP Focus)

### 1. Streamlined Map Experience

- Full-viewport map with default focus on Le Marais neighborhood in Paris:
  - Fixed initial view on a popular central Parisian district
  - No geolocation tracking required
  - Simple, predictable starting point for all users
- **Clear visual differentiation** between sunny and shaded terraces:
  - Sunny terraces: warm amber markers with animated glow effects
  - Shaded terraces: cool slate blue markers with subtle visual treatment
  - Simple clustering system that preserves sunny/shaded status
- **Responsive zoom levels**:
  - Neighborhood overview at zoom levels 12-14
  - Individual terraces with detailed indicators at zoom levels 15+

### 2. Essential Time Controls

- **Simplified timeline** with:
  - Current time indicator with prominent visual treatment
  - Easy-to-use slider for time selection
  - Visual highlighting of peak sunshine periods
- **Basic date selector** focusing on:
  - Today/Tomorrow quick selection
  - Calendar picker with simple heat indicators for sunny days
  - Weekend quick-jump functionality
- **"Now" button** that:
  - Returns to current time with a smooth transition
  - Shows countdown to sunset or next sunshine period

### 3. Focused Terrace Information

- **Streamlined information cards** showing:
  - Terrace name and address
  - Current sun status (sunny/shaded)
  - Timeline showing sunshine periods for the day
- **Enhanced Social Sharing** for viral discovery:
  - Prominent "Share this sunny spot ☀️" CTA button with sunshine animation on hover
  - Smart URL generation capturing:
    - Current map view (location and zoom level)
    - Selected time and date
    - Specific terrace details (if one is selected)
  - Platform-optimized sharing:
    - Web Share API for mobile devices (native sharing sheet)
    - Direct social media sharing for desktop (Twitter/Facebook/WhatsApp)
    - Fallback to copy-to-clipboard with visual confirmation
  - Engaging, auto-generated share text:
    - Time-aware messaging (e.g., "I found this sun-soaked terrace for this evening in Paris! ☀️")
    - Terrace-specific details when applicable (e.g., "Le Perchoir Marais gets sunshine until 19:30 today!")
    - Branded hashtag (#TerrasseAuSoleil) for tracking
  - OpenGraph metadata for rich link previews:
    - Dynamic map thumbnail showing the terrace location
    - Custom title and description based on context
    - Sunshine status indicator in preview image

## ✨ THE "WOW MOMENT": Solar Flare Effect

The standout visual feature that creates an instant emotional connection while remaining technically feasible:

### The Solar Flare Effect

A dynamic, responsive visual system that intuitively communicates sunshine patterns across Paris:

- **Radial Gradient Propagation**:

  - When users change time settings or initially load the map, sunny terraces emit expanding radial gradients in warm amber
  - The propagation follows the actual sun angle for that time of day, matching real-world light direction
  - Implementation via CSS radial gradients and animations with SVG masks to control effect shape

- **Sun-Angle Light Rays**:

  - Sunny terraces display subtle, animated light rays extending from their position
  - Rays are angled and sized based on the actual sun position and altitude for the selected time
  - Longer, softer rays appear at sunset/sunrise periods
  - Implementation via simple SVG paths with CSS animations

- **Interactive Light Response**:

  - As users hover near sunny terraces, the light effect subtly intensifies (like clouds parting)
  - Effect responds to cursor/finger position, creating a sense of "discovering" sunshine
  - Implementation via mouse/touch position tracking with CSS variable updates

- **Time-Shift Transition**:
  - When changing times, a subtle "sweep" of light moves across the map in the direction of the sun's movement
  - Terraces changing from sunny to shaded (or vice versa) emit a brief golden flash
  - Implementation via CSS transitions with timing based on geographic position

This effect provides immediate feedback on sunshine patterns while creating an emotional connection to the experience of seeking sunshine in Paris. It's technically feasible through standard web technologies (SVG, CSS animations) without requiring WebGL, making it broadly compatible while still delivering visual impact.

## 🚫 BOUNDARIES FOR MVP

To maintain focus and performance, avoid:

1. **Feature Overreach**

   - User accounts or authentication systems
   - Reviews, ratings, or user-generated content
   - Complex filtering beyond basic time/location
   - Detailed weather forecasting beyond sunshine data

2. **Technical Complexity**

   - 3D rendering or WebGL-dependent features
   - Excessive DOM elements (>1000) for visual effects
   - Unnecessary third-party dependencies
   - Backend-heavy processing that impacts response time

3. **UX Complications**
   - Multi-step processes or wizards
   - Modal dialogs that interrupt the flow
   - Information overload on the initial view
   - Complex features requiring explanation

## 🚀 DEVELOPMENT WORKFLOW

1. **Foundation Phase**

   - Set up Next.js project with optimized build configuration
   - Implement MapLibre GL with custom base map styling
   - Create Supabase data structure with spatial indexes
   - Establish basic API endpoints for terrace data

2. **Core Functionality Phase**

   - Build the map component with basic terrace visualization
   - Implement simplified time/date controls
   - Create responsive layout for desktop and mobile
   - Set up essential state management

3. **Solar Flare Implementation**

   - Start with basic marker differentiation (sunny vs. shaded)
   - Add the radial gradient propagation effect
   - Implement the sun-angle light rays
   - Add interactive light response
   - Fine-tune time-shift transitions

4. **Polish Phase**

   - Optimize animations for performance
   - Implement responsive behavior for all screen sizes
   - Create elegant loading states and transitions
   - Ensure smooth performance on target devices

5. **Testing & Optimization**
   - Conduct performance testing on various devices
   - Implement data pre-fetching and caching strategies
   - Optimize bundle size and resource loading
   - Ensure accessibility compliance

## 📐 DEFINING SUCCESS

The MVP will be successful when:

1. Users can find sunny terraces intuitively within 5 seconds of landing
2. The Solar Flare Effect creates a genuine "wow" reaction while enhancing usability
3. The application performs well on mobile devices (Time-to-Interactive <1.5s)
4. Users can easily change time/date and see updated results
5. The experience feels cohesive, thoughtful, and distinctly Parisian

Remember: This MVP focuses on creating a joyful, focused experience that solves a specific problem beautifully. The Solar Flare Effect should enhance the core functionality of finding sunny terraces, not distract from it.

---

**Technical Implementation Notes:**

- Use PostGIS `ST_DWithin` for efficient proximity queries
- Consider using React Suspense boundaries around dynamic map components
- Leverage SWR for data fetching with optimistic UI updates
- Use CSS variables for dynamic animation control
- Implement progressive enhancement for animations
- Apply IntersectionObserver for performance-optimized rendering
