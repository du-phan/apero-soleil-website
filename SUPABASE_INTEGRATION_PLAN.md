# Supabase Integration Plan for Terrasse au Soleil

## Objective

Integrate Supabase as the primary data source for terrace GeoJSON data, replacing the current local file-based approach. Implement a robust caching strategy to ensure fast, up-to-date data delivery in a serverless environment (Vercel), while keeping the data secure in a **private Supabase bucket**.

---

## 1. **Current State Analysis**

- **Data Source:** Local GeoJSON file (`src/data/sunlight_results.geojson`).
- **Backend:** API route (`/api/terraces`) loads the file into memory on cold start.
- **Frontend:** Fetches terrace data from the API, which filters and returns terrace objects.
- **Limitation:** Data is only updated on serverless cold start; daily updates require redeploy or manual intervention.

---

## 2. **Target State**

- **Data Source:** **Supabase private Storage bucket** hosts the latest GeoJSON file, updated daily.
- **Backend:** API route fetches from the private bucket using the Supabase JS client and a service role key, with in-memory caching and expiry (**1 hour TTL**).
- **Frontend:** No change needed; continues to fetch from `/api/terraces`.
- **Benefits:**
  - Always up-to-date within an hour.
  - No need to redeploy for new data.
  - Fast responses via cache.
  - Data is protected from unauthorized access.

---

## 3. **Implementation Steps**

### 3.1. **Supabase Setup**

- [x] Create a Supabase project (if not already done).
- [x] Create a **private Storage bucket**: `apero-soleil`
- [x] Upload the daily-updated `sunlight_results.geojson` to this bucket.
- [x] Ensure the bucket/file is **private** (not public).
- [x] Note the bucket name and file path: `apero-soleil/sunlight_results.geojson`
- [x] Obtain the Supabase project URL and **service role key** (for backend use only).

* supabase project url is already stored in .env.local as `SUPABASE_URL`
* the service role key is already stored in .env.local as `SUPABASE_SERVICE_ROLE_KEY`

### 3.2. **Backend Refactor**

- [x] Install Supabase JS client (`@supabase/supabase-js`).
- [x] Refactor `src/lib/data/csvParser.ts` (or the API route):
  - Replace `fs.readFileSync` logic with a function to fetch the file from the private bucket using the Supabase JS client and service role key.
  - Parse the downloaded file as JSON.
- [x] Move cache logic to the API route (`/api/terraces`):
  - Use module-level variables for cache and timestamp.
  - Set a cache TTL (**1 hour**).
  - On each request, check if cache is valid:
    - If valid, serve from cache.
    - If expired or empty, fetch from Supabase, update cache, and serve.
- [x] Add error handling:
  - If fetch fails and cache exists, serve stale cache with a warning.
  - If no cache and fetch fails, return a 500 error.

### 3.3. **Environment Variables & Security**

- [x] Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Vercel/Next.js environment variables.
- [ ] **Never expose the service role key to the client or frontend code.**
- [ ] Use these variables only in server-side code (API routes, server components).

### 3.4. **Testing**

- [ ] Test locally with the Supabase credentials and a sample file.
- [ ] Deploy to Vercel and verify:
  - Data is fetched from Supabase on first request or after cache expiry (**1 hour**).
  - Data is served from cache on subsequent requests.
  - Data updates after daily file change in Supabase.
- [ ] Test error scenarios (Supabase unavailable, invalid file, etc.).

### 3.5. **Documentation**

- [ ] Document the new data flow in `DEV_PLAN.md` and/or `PROJECT_DESCRIPTION.md`.
- [ ] Add instructions for updating the daily GeoJSON file in Supabase and ensuring the bucket remains private.

---

## 4. **Code Example: Caching Pattern with Private Bucket (1 hour TTL)**

```ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side
);

const BUCKET = "apero-soleil";
const FILE_PATH = "sunlight_results.geojson";

let cachedGeoJson: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function fetchFromSupabase() {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(FILE_PATH);
  if (error || !data)
    throw new Error("Failed to fetch GeoJSON from Supabase private bucket");
  const text = await data.text();
  return JSON.parse(text);
}

export async function GET(request: NextRequest) {
  if (!cachedGeoJson || Date.now() - cacheTimestamp > CACHE_TTL) {
    cachedGeoJson = await fetchFromSupabase();
    cacheTimestamp = Date.now();
  }
  return NextResponse.json(cachedGeoJson);
}
```

---

## 5. **Future Enhancements**

- [ ] Add manual cache invalidation (e.g., via a query param or admin endpoint).
- [ ] Use a CDN or Supabase Edge Functions for even faster delivery if needed.
- [ ] Add logging/metrics for cache hits/misses.

---

## 6. **Checklist**

- [x] Supabase private Storage set up and file uploaded
- [ ] Backend fetches from private bucket using Supabase JS client
- [ ] Caching logic implemented (**1 hour TTL**)
- [ ] Environment variables for Supabase URL and service role key configured
- [ ] Tested locally and on Vercel
- [ ] Documentation updated

---

**Owner:** @yourname  
**Date:** YYYY-MM-DD
