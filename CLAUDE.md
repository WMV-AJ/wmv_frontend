# CLAUDE.md - AI Assistant Project Context
## Dubai Events Platform V2 (Where's My Vibe)

---

## 🚨 MULTI-CITY INVARIANTS (added 2026-05-21)

WMV is no longer Dubai-only. **Dubai, Bangalore, and Mumbai are live**, and
new cities onboard via the backend's `/api/admin/cities` workflow with
**zero frontend code edits**. Every frontend change must preserve this.

See `/Users/arpitjhamb/Desktop/WMV Prod/backend/CLAUDE.md` for the full
contract — frontend-specific rules below.

### Hard NOs

| ❌ | ✅ |
|---|---|
| `type CitySlug = 'dubai' \| 'bangalore'` | `type CitySlug = string` (already widened) |
| `import { CITIES } from '@/config/cities.config'` and treat as static | Same import, but know it mutates at runtime via `loadCitiesFromApi()` |
| `if (slug === 'dubai' \|\| slug === 'bangalore')` | `isValidCity(slug)` |
| Hardcoding Dubai's `+4` UTC offset in date math | `getCityConfig(slug).utcOffsetHours` |
| Removing `<CitiesProvider>` from `src/app/layout.tsx` | Keep it — it's how dynamic cities load on first paint |
| Removing or "simplifying" `src/middleware.ts:refreshDynamicCities` | It's the only thing preventing `/mumbai` from 307'ing to `/dubai/mumbai` |
| Adding a new top-level path (e.g. `/about`) without adding it to middleware's `PASSTHROUGH` | It'll 307 to `/<DEFAULT_CITY>/about` |
| Querying Supabase directly instead of `WMV_API_BASE` proxy routes | All data flows through the backend at `127.0.0.1:2300` |

### Build & deploy

- `npm run build` automatically runs `npm run sync-standalone` (copies
  `.next/static` and `public` into `.next/standalone/` because Next.js
  doesn't do this in standalone mode). Skipping the sync = every JS/CSS
  asset 404s.
- Never run `pm2 restart wmv-frontend` after only `next build` — always use
  the full `npm run build` script.

### Adding a new page

- Server-side renders use the **static** `CITIES` (Dubai + Bangalore only)
  because the runtime fetcher only runs in the browser. New cities like
  Mumbai will render with the DEFAULT_CITY config on SSR, then re-render
  on hydration once `loadCitiesFromApi()` populates the cache.
- This briefly shows the wrong city's config on first paint for non-static
  cities. If that's a problem for your page, fetch `/api/cities` directly
  in a server component and pass the config as props.

### Verifying multi-city after any frontend change

```bash
# Each active city renders the [city] page (no 307)
for c in dubai bangalore mumbai; do
  echo -n "$c: "; curl -sI "https://wheresmyvibe.com/$c" | head -1
done

# /api/cities proxy still works
curl -s https://wheresmyvibe.com/api/cities | jq '.cities[].slug'

# Static assets serve (catches the sync-standalone regression)
curl -sI https://wheresmyvibe.com/_next/static/css/$(curl -s https://wheresmyvibe.com/dubai | grep -oE '/_next/static/css/[^"]+\.css' | head -1 | xargs basename)
```

---


> **Purpose**: This file provides comprehensive context for AI assistants (Claude, GPT, etc.) working on this project.
> **Last Updated**: December 2025
> **Project Status**: V1.0 Production Ready, V2.0 Planning

---

## 🎯 Project Overview

**Dubai Events Platform** (internally: "Where's My Vibe") is a sophisticated event discovery web application that helps users find venues and events in Dubai through an interactive map interface with advanced filtering capabilities.

### Quick Facts
- **Tech Stack**: Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, Supabase
- **Codebase Size**: 65+ components, 387-line type system, 552-line filtering hook
- **Documentation**: 30,000+ words across comprehensive docs
- **Current Version**: V1.0 (Production Ready)
- **Deployment**: Vercel (primary), supports Docker

---

## 📁 Project Structure

```
dubai-events-v6/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── page.tsx            # Home (Map View)
│   │   ├── list/               # List View
│   │   ├── login/              # Authentication
│   │   └── api/                # API Routes (5 endpoints)
│   ├── components/             # 65+ React components
│   │   ├── auth/               # Google/Email/Phone auth
│   │   ├── filters/            # Hierarchical filter system
│   │   ├── map/                # Google Maps integration
│   │   ├── navigation/         # Top/Bottom nav
│   │   ├── venue/              # Venue details
│   │   └── ui/                 # Shadcn UI (20+ components)
│   ├── hooks/                  # 7 custom hooks
│   ├── contexts/               # React Context (Auth, Theme, BulkEvents)
│   ├── stores/                 # Zustand stores
│   ├── lib/                    # Utilities & config
│   └── types/                  # TypeScript definitions
├── docs/                       # Comprehensive documentation
│   ├── INDEX.md                # Documentation index
│   ├── FRONTEND_ARCHITECTURE.md  # Frontend deep dive
│   └── BACKEND_API.md          # Backend deep dive
├── README.md                   # Project overview
├── V1_FEATURES.md              # Feature documentation
├── TECHNICAL_IMPLEMENTATION.md # Implementation guide
└── V2_ROADMAP.md              # Future plans
```

---

## 🔑 Key Technologies & Versions

### Core Framework
```json
{
  "next": "15.5.2",
  "react": "19.1.0",
  "typescript": "5.0",
  "tailwindcss": "4.0"
}
```

### Critical Dependencies
```json
{
  "@supabase/supabase-js": "2.57.2",
  "@googlemaps/js-api-loader": "2.20.7",
  "zustand": "5.0.8",
  "@tanstack/react-query": "5.87.1",
  "framer-motion": "12.23.12",
  "lucide-react": "0.542.0"
}
```

### Authentication
- **Supabase Auth** with multi-provider support
- Google OAuth 2.0
- Email/Password
- Phone OTP (SMS)

---

## 🏗️ Architecture Decisions

### 1. Client-Side Filtering Strategy
**Why**: Instant performance without API round-trips
**How**:
- Load all venues once on mount (GET /api/venues)
- Filter 100% client-side using `useMemo` in `useClientSideVenues` hook
- 552-line filtering logic handles 10+ filter types
- No server calls during filter changes

**Key File**: `src/hooks/useClientSideVenues.ts`

### 2. Hierarchical Filter Structure
**Why**: Support complex categorization (Primary → Secondary)
**How**:
```typescript
{
  selectedPrimaries: {
    genres: ["Electronic", "Live"],
    vibes: ["Energy", "Atmosphere"]
  },
  selectedSecondaries: {
    genres: {
      "Electronic": ["Techno", "House"],
      "Live": ["Jazz", "Acoustic"]
    },
    vibes: {
      "Energy": ["High Energy", "Nightclub"],
      "Atmosphere": ["Rooftop", "Lounge"]
    }
  }
}
```

**Key File**: `src/types/index.ts` (HierarchicalFilterState interface)

### 3. Single Unified Table
**Why**: Simplify queries, reduce joins
**Table**: `final_1` in Supabase
**Contains**: Both venue AND event data (denormalized)
**Deduplication**: By `venue_id` after filtering

**Schema Location**: See `docs/BACKEND_API.md` - Database Schema section

### 4. Serverless API Routes
**Why**: Automatic scaling, zero config
**Routes** (5 total):
1. `GET /api/venues` - All venues (client-side filtering)
2. `GET /api/filter-options` - Available filter values
3. `GET /api/events` - Events for specific venue
4. `POST /api/events-bulk` - Batch event fetching
5. `GET /api/venue-names` - Autocomplete search

**Location**: `src/app/api/*/route.ts`

---

## 🎨 Design System

### Color Palette (Dubai Retro Theme)
```css
--venue-nightclub: #f8c967;   /* Gold - Premium venues */
--venue-restaurant: #a5b076;  /* Green - Dining */
--venue-bar: #e98d58;         /* Orange - Bars/Lounges */
--venue-beach: #b9d3c2;       /* Blue-green - Beach/Pool */
--venue-rooftop: #db8555;     /* Dark orange - Rooftops */
--venue-hotel: #dfd2ae;       /* Beige - Hotels */
```

### Glass Morphism Pattern
```css
background: rgba(0, 0, 0, 0.75);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.06);
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.4),
  0 4px 16px rgba(0, 0, 0, 0.3),
  inset 0 1px 0 rgba(255, 255, 255, 0.08);
```

### Responsive Breakpoints
```typescript
mobile: "< 768px"    // Bottom nav, full-width sidebar
tablet: "768px - 1024px"  // Horizontal nav, partial sidebar
desktop: "> 1024px"  // Full horizontal nav, fixed sidebar
```

---

## 🗺️ Google Maps Integration

### Custom Styling
- **Retro Dubai Theme**: Custom color palette matching venue types
- **POI Hiding**: Clean map without default Points of Interest
- **Custom Controls**: Zoom controls only, gesture handling: 'greedy'

### Venue Markers
- **Color-coded by category**: Nightclub (gold), Restaurant (green), etc.
- **Clustering**: Venues within 100m grouped at higher zoom levels
- **Animations**: Bounce effect on hover/click

**Config File**: `src/lib/maps-config.ts`

---

## 🔍 Filtering System Deep Dive

### Filter Types (10+ categories)

1. **Hierarchical Genres** (Music styles)
   - Primary: Electronic, Live, Cultural, Hip-Hop/R&B, etc.
   - Secondary: Techno, House, Jazz, Rock, etc.
   - Color-coded for visual distinction

2. **Hierarchical Vibes** (Atmosphere)
   - Primary: Energy, Atmosphere, Event Type, Music Style
   - Secondary: High Energy, Rooftop, Beach, VIP, etc.

3. **Areas** (Geographic)
   - 11 major Dubai areas
   - Special handling for JBR (Jumeirah Beach Residence)

4. **Dates**
   - Format: "17 Sept 25"
   - Historical + future events
   - Chronologically sorted

5. **Event Times** (Categorized)
   - Morning (6 AM - 12 PM)
   - Afternoon (12 PM - 6 PM)
   - Evening (6 PM - 10 PM)
   - Night (10 PM - 6 AM)

6. **Venue Categories**
   - Bar, Lounge, Restaurant, Beach Club, Nightclub, etc.

7. **Ticket Prices** (AED ranges)
   - Free, AED 0-50, AED 50-100, AED 100-200, AED 200+

8. **Venue Prices**
   - Exact values from database (e.g., "AED", "AED AED")

9. **Atmospheres**
   - High Energy, Intimate, Rooftop, Beach, etc.

10. **Event Categories**
    - Music Events, Nightlife, Sports & Viewing, etc.

11. **Ratings**
    - 1-5 stars filtering

12. **Special Offers**
    - Free Entry, VIP, Ladies Night, etc.

### Filter Logic (OR-based)
```typescript
// ANY selected filter value matches (inclusive OR)
if (activeGenres.length > 0) {
  const anyGenreMatches = activeGenres.some(selectedGenre =>
    venue.music_genre_processed.primaries.includes(selectedGenre) ||
    Object.values(venue.music_genre_processed.secondariesByPrimary)
      .some(secondaries => secondaries.includes(selectedGenre))
  );

  if (!anyGenreMatches) return false; // Exclude venue
}
```

**Key Implementation**: `src/hooks/useClientSideVenues.ts` (lines 99-544)

---

## 🔧 Filter Bottom Sheet Refinements (December 2025)

### Overview
A comprehensive series of UX and layout improvements to the FilterBottomSheet component, fixing critical issues with z-index layering, vertical spacing, and missing filter options.

### 1. Z-Index & TopNav Visibility Fix
**Problem**: FilterBottomSheet backdrop was covering TopNav, making it invisible when filters opened.

**Solution**: Adjusted z-index hierarchy to maintain proper layering:
```typescript
// Before
FilterBottomSheet backdrop: z-40
FilterBottomSheet container: z-50
TopNav: z-50 (conflict!)

// After
FilterBottomSheet backdrop: z-30
FilterBottomSheet container: z-40
TopNav: z-50 (always visible)
```

**Files Modified**: `src/components/filters/FilterBottomSheet.tsx`

### 2. Vertical Height & Positioning Fix
**Problem**: Filter had visible gap at bottom and wasn't extending from bottom edge to just below category pills.

**Root Cause**: Hard-coded `max-height: 65vh` constraint in CSS file prevented full-height expansion.

**Solution Implemented** (3-part fix):

#### A. CSS Update (`src/styles/horizontal-nav.css` lines 246-247)
```css
/* Changed from fixed viewport units to flexible height */
/* Before */
min-height: 65vh;
max-height: 65vh;

/* After */
min-height: 100%;
height: 100%;
```

#### B. Container Layout (FilterBottomSheet.tsx line 390)
```tsx
/* Added h-full flex flex-col for full-height flexbox */
<div className="filter-bottom-sheet rounded-t-3xl shadow-2xl relative h-full flex flex-col">
```

#### C. Scrollable Area (FilterBottomSheet.tsx line 472)
```tsx
/* Changed from fixed viewport calculation to flexible flex child */
/* Before */
<div className="px-4 py-3 pb-32 h-[calc(100vh-420px)] overflow-y-auto">

/* After */
<div className="px-4 py-3 pb-32 flex-1 overflow-y-auto scrollbar-thin">
```

#### D. Precise Container Positioning (FilterBottomSheet.tsx lines 387-388)
```tsx
/* Fixed positioning from top of category pills to bottom edge */
className="fixed left-0 right-0 z-40"
style={{ top: '180px', bottom: 0 }}
```

**Result**: Filter now extends seamlessly from bottom (0px) to just below category pills (180px from top), matching expected full-screen expanding panel behavior.

### 3. Missing Filter Sections Added
**Problem**: FilterBottomSheet was missing three important filter types that were available in the filtering logic but not exposed in the UI.

**Filters Added**:
1. **Special Offers** (`activeOffers`)
   - Badge color: Orange (`#fb923c`)
   - Examples: Free Entry, VIP, Ladies Night, Happy Hour

2. **Venue Categories** (`selectedVenueCategories`)
   - Badge color: Indigo (`#818cf8`)
   - Examples: Nightclub, Bar, Lounge, Restaurant, Beach Club

3. **Event Categories** (`selectedEventCategories`)
   - Badge color: Pink (`#f472b6`)
   - Examples: Music Events, Nightlife, Sports & Viewing, Dining

**Implementation Details**:

#### Interface Updates (FilterBottomSheet.tsx)
```typescript
interface FilterBottomSheetProps {
  // ... existing props ...
  activeOffers: string[];
  selectedVenueCategories: string[];
  selectedEventCategories: string[];
  onOffersChange: (offers: string[]) => void;
  onVenueCategoriesChange: (categories: string[]) => void;
  onEventCategoriesChange: (categories: string[]) => void;
}
```

#### Filter Options Hook Update (`src/hooks/useFilterOptions.ts`)
```typescript
// Added initialization for new filter data
offers: [],
venueCategories: [],
eventCategories: []
```

#### Clear All Function Update
```typescript
const handleClearAll = () => {
  // ... existing clears ...
  onOffersChange([]);
  onVenueCategoriesChange([]);
  onEventCategoriesChange([]);
};
```

#### Selected Count Calculation
```typescript
const selectedCount =
  selectedAreas.length +
  selectedDates.length +
  selectedRatings.length +
  selectedTimes.length +
  selectedPrices.length +
  selectedAtmospheres.length +
  activeOffers.length +           // New
  selectedVenueCategories.length + // New
  selectedEventCategories.length;  // New
```

#### Tag Display in getAllSelectedFilters()
```typescript
// Special Offers tags
activeOffers.forEach(offer => {
  filters.push({ label: offer, color: '#fb923c', type: 'offer' });
});

// Venue Categories tags
selectedVenueCategories.forEach(category => {
  filters.push({ label: category, color: '#818cf8', type: 'venueCategory' });
});

// Event Categories tags
selectedEventCategories.forEach(category => {
  filters.push({ label: category, color: '#f472b6', type: 'eventCategory' });
});
```

### 4. Calendar Component Created
**Problem**: Missing UI component causing build errors when DatePickerModal imported calendar.

**Solution**: Created `/src/components/ui/calendar.tsx` following Shadcn UI pattern:
- Installed dependency: `react-day-picker@^8.10.0`
- Implemented Calendar component using DayPicker
- Added proper TypeScript types and className utilities

### 5. UI/UX Improvements
**Additional Enhancements**:
- Filter section order: Areas now appears before Atmospheres (user requested)
- Removed tip/help section (confirmed already removed in current version)
- Improved scrollbar styling with `scrollbar-thin` utility
- Proper badge color coordination across all filter types

### Files Modified Summary
1. `/src/components/filters/FilterBottomSheet.tsx` - Main component refinements
2. `/src/hooks/useFilterOptions.ts` - Added new filter data initialization
3. `/src/styles/horizontal-nav.css` - Fixed height constraints
4. `/src/components/ui/calendar.tsx` - Created new component
5. `/package.json` - Added react-day-picker dependency

### Testing Checklist
- [x] TopNav remains visible when filters open
- [x] Filter extends full height (bottom to ~180px from top)
- [x] No visible gaps at bottom of filter panel
- [x] All 9 filter sections display correctly (Areas, Dates, Ratings, Times, Prices, Atmospheres, Offers, Venue Categories, Event Categories)
- [x] Clear all button resets all filter types
- [x] Selected count badge reflects all filter selections
- [x] Filter tags display with correct colors
- [x] Scrolling works smoothly within filter content area
- [x] Dev server runs without errors (http://localhost:3001)

### Known Behavior
- Filter container positioned at `top: 180px` to sit just below category pills
- Uses flexbox layout for responsive height calculation
- CSS file controls base filter panel styling
- Component props control dynamic filter behavior

### Future Considerations
- Consider adding filter preset saving/loading
- Potential UX improvement: sticky filter section headers during scroll
- Analytics tracking for most-used filter combinations

---

## 🔄 List View & Map Panel Data Parity (December 2025)

### Overview
Successfully implemented complete data parity between the List View cards (StackedEventCards) and Map Panel (VenueDetailsSidebar) by adding all missing Supabase fields to both views. This ensures users see consistent, comprehensive information regardless of which view they're using.

### Implementation Scope
Added 13 new fields from Supabase `final_1` table to both views, including artist information, music genres, event vibes, AI confidence scores, analysis notes, and detailed venue information.

### Files Modified (7 total)

#### 1. `/src/lib/stacked-card-adapter.ts`
**Purpose**: Data transformation layer between Supabase and UI components

**Event Interface Extensions**:
```typescript
interface Event {
  // ... existing fields ...
  artist?: string;              // Performing artist(s)
  music_genre?: string;         // Music genre(s)
  event_vibe?: string;          // Event atmosphere/vibe
  confidence_score?: number;    // AI classification confidence
  analysis_notes?: string;      // AI-generated notes
  website_social?: string;      // Event website/social links
  event_categories?: string;    // Event category classifications
}
```

**Venue Interface Extensions**:
```typescript
interface Venue {
  // ... existing fields ...
  venue_website?: string;       // Venue official website
  venue_address?: string;       // Full street address
  venue_highlights?: string;    // Key venue features
  venue_atmosphere?: string;    // Venue ambiance description
  attributes?: string;          // Venue attributes (JSON)
}
```

**Transformation Function Updates**:
- Updated `transformSupabaseDataToStackedCards()` to map all 13 new fields
- Handles comma-separated lists (artists, genres)
- Handles pipe-separated lists (vibes)
- Properly parses JSON fields (attributes, event_categories)

#### 2. `/src/components/events/StackedEventCards.tsx`
**Purpose**: List view card component displaying event details

**New Icon Imports** (8 icons):
```typescript
import {
  Music as MusicIcon,
  Sparkles as SparklesIcon,
  Target as TargetIcon,
  FileText as FileTextIcon,
  MapPin as MapPinIcon,
  Star as StarIcon,
  Link as LinkIcon,
  ExternalLink as ExternalLinkIcon
} from 'lucide-react';
```

**Collapsed State Additions** (lines 338-349):
- **Artists badges**: Purple badges showing comma-separated artist names
- Uppercase text styling for visual prominence
- Only renders when artist data exists

**Expanded State Additions** (lines 386-503):

1. **Music Genres Section**:
   - Blue badges (`rgba(59, 130, 246)`)
   - Comma-separated genre list
   - Music icon indicator

2. **Event Vibes Section**:
   - Pink badges (`rgba(236, 72, 153)`)
   - Pipe-separated vibe list
   - Sparkles icon indicator

3. **AI Confidence Score**:
   - Green badge (`rgba(34, 197, 94)`)
   - Percentage display (e.g., "85%")
   - Target icon indicator

4. **Analysis Notes**:
   - Orange italic text (`rgba(251, 191, 36)`)
   - AI-generated event insights
   - FileText icon indicator

5. **Venue Details Section**:
   - **Address**: MapPin icon + full street address
   - **Highlights**: Star icon + key venue features
   - **Atmosphere**: Sparkles icon + ambiance description
   - **Website/Social**: Link icon + clickable links

6. **Visit Website Button**:
   - Blue background with hover effects
   - External link icon
   - Opens in new tab (`target="_blank"`)

#### 3. `/src/components/events/StackedEventCards.css`
**Purpose**: Styling for all new card sections

**New CSS Classes** (170+ lines, lines 470-644):

```css
/* Artists Badges */
.artists-badges {
  background: rgba(147, 51, 234, 0.15);
  color: rgb(147, 51, 234);
  /* Uppercase, bold styling */
}

/* Genre Badges */
.genre-badge {
  background: rgba(59, 130, 246, 0.15);
  color: rgb(59, 130, 246);
}

/* Vibe Badges */
.vibe-badge {
  background: rgba(236, 72, 153, 0.15);
  color: rgb(236, 72, 153);
}

/* Confidence Score */
.confidence-badge {
  background: rgba(34, 197, 94, 0.15);
  color: rgb(34, 197, 94);
}

/* Analysis Notes */
.analysis-notes {
  color: rgba(251, 191, 36, 0.9);
  font-style: italic;
}

/* Venue Details Grid */
.venue-details-grid {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Visit Website Button */
.visit-website-btn {
  background: rgba(59, 130, 246, 0.9);
  color: white;
  /* Hover and transition effects */
}
```

**Responsive Mobile Adjustments**:
- Smaller badge font sizes on mobile
- Adjusted grid layouts for narrow screens
- Optimized spacing and padding

#### 4. `/src/components/venue/VenueDetailsSidebar.tsx`
**Purpose**: Map panel sidebar showing venue details

**Venue Rating Display** (lines 252-275):

```typescript
{/* Venue Rating */}
{venue.venue_rating && (
  <div className="flex items-center gap-2 mb-2">
    <div className="flex items-center gap-1 px-2 py-1 rounded-md"
         style={{ background: 'rgba(244, 196, 48, 0.15)' }}>
      <Star className="w-4 h-4" style={{ color: '#f4c430' }} fill="#f4c430" />
      <span className="text-sm font-semibold" style={{ color: '#f4c430' }}>
        {venue.venue_rating.toFixed(1)}
      </span>
    </div>
    {venue.venue_review_count && (
      <span className="text-sm text-gray-400">
        ({venue.venue_review_count.toLocaleString()} reviews)
      </span>
    )}
  </div>
)}
```

**Features**:
- Yellow star badge with rating (0.0-5.0 format)
- Review count with proper number formatting
- Conditional rendering (only shows if data exists)
- Dark mode compatible styling

#### 5. `/src/app/api/venues/route.ts`
**Purpose**: Supabase API endpoint for venue data

**Extended SELECT Query** (lines 41-76):
```typescript
const { data, error } = await supabase
  .from('final_1')
  .select(`
    venue_id,
    venue_name_original,
    venue_area,
    venue_category,
    venue_lat,
    venue_lng,
    venue_rating,
    venue_review_count,
    venue_price,
    venue_highlights,        // NEW
    venue_atmosphere,        // NEW
    event_id,                // NEW
    event_name,              // NEW
    event_date,
    event_time,              // NEW
    artist,                  // NEW
    music_genre,             // NEW
    music_genre_processed,
    event_vibe,              // NEW
    event_vibe_processed,
    ticket_price,            // NEW
    special_offers,          // NEW
    website_social,          // NEW
    confidence_score,        // NEW
    analysis_notes,          // NEW
    attributes,
    event_categories,
    metadata                 // NEW
  `);
```

**Updated Venue Transformation** (lines 183-218):
- Maps all 13 new fields to venue objects
- Handles null/undefined values gracefully
- Preserves existing data structure
- Maintains backward compatibility

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Supabase final_1 Table (35+ fields)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ GET /api/venues                                         │
│ - Queries all venue/event fields                       │
│ - Returns 504 records → 68 unique venues               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ stacked-card-adapter.ts                                │
│ - Transforms Supabase data to UI-friendly format       │
│ - Handles data parsing (JSON, arrays, null values)     │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ StackedEventCards│    │VenueDetailsSidebar│
│ (List View)      │    │ (Map Panel)       │
└──────────────────┘    └──────────────────┘
```

### Color Coding System

Complete badge color palette used across both views:

| Data Type | Color | RGB Value | Usage |
|-----------|-------|-----------|-------|
| **Artists** | Purple | `rgba(147, 51, 234)` | Artist badges (collapsed state) |
| **Music Genres** | Blue | `rgba(59, 130, 246)` | Genre badges (expanded state) |
| **Event Vibes** | Pink | `rgba(236, 72, 153)` | Vibe badges (expanded state) |
| **Confidence Score** | Green | `rgba(34, 197, 94)` | AI confidence percentage |
| **Analysis Notes** | Orange | `rgba(251, 191, 36)` | AI-generated insights |
| **Star Ratings** | Yellow | `#f4c430` | Venue rating stars |

### New Fields Reference

#### Event-Level Fields (7 fields)
1. **artist** (string) - Performing artist name(s), comma-separated
2. **music_genre** (string) - Music genre(s), comma-separated
3. **event_vibe** (string) - Event atmosphere/vibe, pipe-separated
4. **confidence_score** (number) - AI classification confidence (0-100)
5. **analysis_notes** (string) - AI-generated event analysis
6. **website_social** (string) - Event website/social media links
7. **event_categories** (string/JSON) - Event category classifications

#### Venue-Level Fields (6 fields)
1. **venue_website** (string) - Venue official website URL
2. **venue_address** (string) - Full street address
3. **venue_highlights** (string) - Key venue features/highlights
4. **venue_atmosphere** (string) - Venue ambiance description
5. **venue_rating** (number) - Rating score (0.0-5.0)
6. **venue_review_count** (number) - Total number of reviews

### UI/UX Enhancements

#### List View Cards
**Collapsed State**:
- Shows essential info: event name, date, venue, category
- **NEW**: Artist badges for quick identification
- Maintains compact, scannable layout

**Expanded State**:
- Reveals comprehensive event details
- **NEW**: 8 additional information sections
- Organized in logical groups with icons
- Color-coded badges for quick scanning
- Clickable website button for external links

#### Map Panel
**Header Section**:
- Venue name and category
- **NEW**: Star rating badge with review count
- Proper number formatting for large review counts
- Consistent styling with dark mode support

### Build & Testing Status

**Build Status**:
- ✅ All routes compiling successfully
- ✅ No TypeScript errors
- ✅ No runtime errors
- ✅ Dev server running on http://localhost:3000

**API Performance**:
- ✅ Returning 504 records from Supabase
- ✅ Transforming to 68 unique venues
- ✅ All 35+ fields mapping correctly

**Testing Checklist**:
- [x] List cards display all new fields when data available
- [x] Artists badges appear in collapsed state
- [x] Expanded state shows all 8 detail sections
- [x] Map panel shows venue rating and review count
- [x] All badge colors match design specifications
- [x] Mobile responsive layout works correctly
- [x] Data loads correctly from Supabase API
- [x] No console errors or warnings
- [x] Null/undefined values handled gracefully
- [x] Website buttons open in new tabs
- [x] Number formatting (ratings, review counts) displays properly

### Technical Implementation Notes

#### Data Parsing Strategy
```typescript
// Comma-separated lists (artists, genres)
const artists = event.artist?.split(',').map(a => a.trim()) || [];

// Pipe-separated lists (vibes)
const vibes = event.event_vibe?.split('|').map(v => v.trim()) || [];

// JSON fields (attributes, categories)
const attributes = typeof event.attributes === 'string'
  ? JSON.parse(event.attributes)
  : event.attributes;
```

#### Conditional Rendering Pattern
```typescript
{/* Only render section if data exists */}
{event.artist && (
  <div className="artists-section">
    {/* ... */}
  </div>
)}
```

#### Accessibility Considerations
- All icons have proper aria-labels
- Color is not sole indicator (icons + text)
- External links have `rel="noopener noreferrer"`
- Proper heading hierarchy maintained

### Performance Impact

**Minimal Performance Overhead**:
- Data already loaded via existing API call
- No additional network requests
- CSS-only animations (GPU accelerated)
- Conditional rendering prevents unnecessary DOM nodes
- Mobile-optimized styles reduce layout complexity

**Bundle Size Impact**:
- +8 Lucide icon imports (~2KB gzipped)
- +170 lines CSS (~3KB gzipped)
- Total impact: <5KB (negligible for modern web apps)

### Future Considerations

#### Potential Enhancements
1. **Lazy Loading**: Consider lazy loading expanded content sections for very large lists
2. **Loading States**: Add skeleton loaders for website button clicks
3. **Tooltips**: Add hover tooltips explaining icon meanings for new users
4. **Analytics**: Track which fields users interact with most
5. **Caching**: Cache venue details to reduce API calls on view switches

#### Data Quality Improvements
1. **Validation**: Add data quality checks for malformed fields
2. **Fallbacks**: Provide default text when optional fields are empty
3. **Formatting**: Standardize date/time formats across all displays
4. **Links**: Validate and auto-format website URLs

#### User Experience Polish
1. **Animations**: Add subtle entrance animations for expanded sections
2. **Copy Actions**: Enable copying venue addresses/links
3. **Share Buttons**: Add social sharing for individual events
4. **Favorites**: Allow users to save preferred events (V2 feature)

### Related Components

**Components Using This Data**:
- `/src/components/events/StackedEventCards.tsx` - List view
- `/src/components/venue/VenueDetailsSidebar.tsx` - Map panel
- `/src/lib/stacked-card-adapter.ts` - Data transformation

**API Endpoints**:
- `GET /api/venues` - Primary data source
- `GET /api/events` - Individual event details
- `POST /api/events-bulk` - Batch event fetching

**Type Definitions**:
- `/src/types/index.ts` - Venue and Event interfaces

### Known Limitations

1. **Data Completeness**: Not all events have all fields populated
2. **String Parsing**: Relies on consistent delimiter usage (commas, pipes)
3. **URL Validation**: Website links not validated before rendering
4. **Mobile Truncation**: Very long text may need ellipsis on small screens
5. **RTL Support**: Right-to-left languages not currently optimized

### Migration Notes

**Backward Compatibility**:
- ✅ All existing fields preserved
- ✅ New fields optional (graceful degradation)
- ✅ No breaking changes to existing components
- ✅ API response structure unchanged

**Deployment Checklist**:
- [x] Database schema verified (all fields exist in `final_1`)
- [x] API route tested with production data
- [x] Type definitions updated and validated
- [x] CSS compiled without errors
- [x] Mobile responsiveness verified
- [x] Cross-browser testing (Chrome, Safari, Firefox)

---

## 🔐 Authentication Flow

### Providers
1. **Google OAuth** - Most common, one-click sign-in
2. **Email/Password** - Traditional auth with password reset
3. **Phone OTP** - SMS-based verification for UAE numbers

### Session Management
- **Supabase Auth** handles JWT tokens
- **LocalStorage** persistence
- **Auto-refresh** on tab/window change
- **Auth Context** (`src/contexts/AuthContext.tsx`) provides global state

### Protected Routes (Future V2)
Currently all routes public; V2 will add:
- User profiles
- Saved favorites
- Event history
- Personalized recommendations

---

## 📊 Data Model

### Main Table: `final_1`

**Venue Fields**:
```typescript
venue_id: number              // Primary key
venue_name_original: string
venue_area: string            // Geographic area
venue_lat: decimal            // Latitude
venue_lng: decimal            // Longitude
venue_category: string        // Can be JSON array
venue_rating: decimal(3,2)    // 0.00-5.00
venue_price: string           // Price level
```

**Event Fields**:
```typescript
event_id: string
event_name: string
event_date: date
event_time: string            // "08:00 PM - 03:00 AM"
ticket_price: decimal(10,2)
special_offers: string[]
```

**Processed Fields** (JSON):
```typescript
music_genre_processed: {
  primaries: string[];
  secondariesByPrimary: Record<string, string[]>;
  colorFamilies: string[];
}

event_vibe_processed: {
  // Same structure as music_genre_processed
}

event_categories: {
  primary: string;
  secondary: string;
  confidence: number;
}[]

attributes: {
  venue: string[];     // ["Rooftop", "Open-air"]
  energy: string[];    // ["High Energy", "Packed"]
  timing: string[];    // ["Night", "Late Night"]
  status: string[];    // ["VIP", "Exclusive"]
}
```

**Indexes for Performance**:
```sql
CREATE INDEX idx_final_1_lat_lng ON final_1 (venue_lat, venue_lng);
CREATE INDEX idx_final_1_area ON final_1 (venue_area);
CREATE INDEX idx_final_1_date ON final_1 (event_date);
CREATE INDEX idx_final_1_venue_id ON final_1 (venue_id);
```

---

## 🎣 Custom Hooks Reference

### 1. `useClientSideVenues` ⭐ MOST IMPORTANT
**File**: `src/hooks/useClientSideVenues.ts` (552 lines)
**Purpose**: Client-side venue filtering
**Returns**:
```typescript
{
  allVenues: Venue[];
  filteredVenues: Venue[];
  isLoading: boolean;
  error: string | null;
}
```
**How it works**:
1. Loads all venues once on mount
2. Filters using `useMemo` (instant updates)
3. Applies all 10+ filter types sequentially
4. Returns deduplicated venues

### 2. `useFilterOptions`
**File**: `src/hooks/useFilterOptions.ts`
**Purpose**: Load available filter options from API
**Returns**: All possible values for each filter type

### 3. `useEvents`
**File**: `src/hooks/useEvents.ts`
**Purpose**: Fetch events for specific venue
**Uses**: React Query for caching

### 4. `useBulkEvents`
**File**: `src/hooks/useBulkEvents.ts`
**Purpose**: Batch event fetching (100+ venues)
**Optimization**: Reduces API calls

---

## 🎭 Component Hierarchy

### Top-Level Pages
```
App (ThemeProvider, AuthProvider)
└── page.tsx (Home - Map View)
    └── MapContainer
        ├── TopNav / BottomNav (responsive)
        ├── Google Maps
        │   └── VenuePin[] (with clustering)
        └── VenueDetailsSidebar
            └── EventSection[]
                └── EventCard[]
```

### Filter Components
```
FilterSection
├── CategoryPills (genres/vibes)
│   ├── PrimaryPill[]
│   └── SecondaryPill[][]
├── AttributePills
│   ├── VenueAttributes[]
│   ├── EnergyAttributes[]
│   ├── TimingAttributes[]
│   └── StatusAttributes[]
└── FilterActionBar
    ├── ClearButton
    └── ApplyButton
```

### Navigation Components
```
Desktop: TopNav
Mobile: BottomNav
Both contain:
├── AreaFilter
├── GenreFilter (hierarchical)
├── VibeFilter (hierarchical)
├── DateFilter
├── OffersFilter
└── AdditionalFilters (7+ more types)
```

---

## 🚀 Performance Optimizations

### 1. Client-Side Filtering
- **Zero API calls** during filter changes
- **Instant updates** via `useMemo`
- **Efficient algorithms** - O(n) filtering

### 2. React Optimizations
```typescript
// Memoized calculations
const filteredVenues = useMemo(() => {...}, [allVenues, filters]);

// Memoized callbacks
const handleFilterChange = useCallback((newFilters) => {...}, []);

// Component memoization
const EventCard = React.memo(({ event }) => {...});
```

### 3. Map Performance
- **Venue clustering** - Reduces marker count
- **Debounced updates** - 300ms delay on filter changes
- **Lazy loading** - Components load when needed

### 4. Code Splitting
```typescript
// Dynamic imports for route components
const ListViewPage = dynamic(() => import('./list/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

---

## 🔧 Development Workflow

### Environment Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Add: NEXT_PUBLIC_SUPABASE_URL
#      NEXT_PUBLIC_SUPABASE_ANON_KEY
#      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# 3. Start development server
npm run dev  # http://localhost:3000
```

### Available Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit"
}
```

### Code Quality
- **ESLint**: Code linting with Next.js config
- **Prettier**: Code formatting (`.prettierrc.json`)
- **TypeScript**: Full type checking (`tsconfig.json`)
- **Playwright**: E2E testing framework

---

## 🐛 Common Issues & Solutions

### Issue 1: Filters Not Working
**Symptom**: Selecting filter doesn't update venues
**Cause**: Filter state not updating or filtering logic error
**Debug**: Check console logs in `useClientSideVenues.ts`
**Fix**: Verify filter state structure matches `HierarchicalFilterState`

### Issue 2: Map Not Loading
**Symptom**: Blank map or error message
**Cause**: Missing/invalid Google Maps API key
**Debug**: Check browser console for API errors
**Fix**: Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`

### Issue 3: No Venues Showing
**Symptom**: Map loads but no venue pins
**Cause**: API error or data not loaded
**Debug**: Check `/api/venues` endpoint response
**Fix**: Verify Supabase credentials and `final_1` table has data

### Issue 4: Authentication Fails
**Symptom**: Login doesn't work or redirects fail
**Cause**: Supabase auth configuration
**Debug**: Check Supabase dashboard → Authentication → Settings
**Fix**: Add redirect URLs to allowed list

---

## 📝 Code Style Guidelines

### TypeScript
```typescript
// Always use interfaces for data structures
interface Venue {
  venue_id: number;
  name: string;
  // ...
}

// Use type for unions/intersections
type FilterState = HierarchicalFilterState | FlatFilterState;

// Explicit return types for functions
function getVenues(): Promise<Venue[]> {
  // ...
}
```

### Component Structure
```typescript
'use client'; // Add for client components

import { useState, useEffect } from 'react';
import type { ComponentProps } from './types';

interface MyComponentProps {
  // Props definition
}

export default function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. Effects
  useEffect(() => {...}, []);

  // 3. Event handlers
  const handleClick = () => {...};

  // 4. Render
  return (
    <div>...</div>
  );
}
```

### Naming Conventions
- **Components**: PascalCase (`VenueCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useClientSideVenues.ts`)
- **Utils**: camelCase (`category-utils.ts`)
- **Types**: PascalCase interfaces (`Venue`, `FilterState`)
- **Constants**: UPPER_SNAKE_CASE (`DUBAI_CENTER`, `RETRO_MAP_STYLE`)

---

## 🎯 V2 Roadmap Priorities

### Phase 1: UI/UX (Weeks 1-2)
- Welcome tutorial (3-step onboarding)
- Help center & tooltips
- Dark/Light mode toggle
- Enhanced loading states

### Phase 2: AI Enhancement (Weeks 2-3)
- Intelligent genre classification
- Vibe matching algorithm
- Natural language search
- Personalized recommendations

### Phase 3: Maps & List (Weeks 3-4)
- Heat maps for event density
- 3D building views
- Advanced list view with infinite scroll
- Event timeline view

### Phase 4: Infrastructure (Weeks 4-5)
- Redis caching for filter options
- WebSocket for real-time updates
- API rate limiting
- Performance monitoring (Sentry)

### Phase 5: Social Features (Weeks 5-6)
- User profiles & favorites
- Social sharing
- Event reminders
- Push notifications

**Full Roadmap**: See `V2_ROADMAP.md`

---

## 📚 Documentation Quick Links

### For Development
1. **[Frontend Architecture](./docs/FRONTEND_ARCHITECTURE.md)** - Complete component guide
2. **[Backend & API](./docs/BACKEND_API.md)** - API routes & database
3. **[Type System](./docs/FRONTEND_ARCHITECTURE.md#type-system)** - TypeScript types reference

### For Features
1. **[V1 Features](./V1_FEATURES.md)** - What the platform does
2. **[Filtering System](./docs/FRONTEND_ARCHITECTURE.md#filtering-system)** - How filters work
3. **[Authentication](./docs/FRONTEND_ARCHITECTURE.md#authentication-flow)** - Auth implementation

### For Deployment
1. **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment
2. **[Database Setup](./DATABASE_SETUP.md)** - Supabase configuration
3. **[Environment Variables](./docs/BACKEND_API.md#security)** - Required env vars

---

## 💡 Tips for AI Assistants

### When Working with This Codebase

1. **Always check types first**
   - Location: `src/types/index.ts`
   - 387 lines of comprehensive type definitions
   - Reference before creating new interfaces

2. **Understand the filter flow**
   - User selects filter → State updates in `page.tsx`
   - `useClientSideVenues` filters all venues client-side
   - No API calls during filter changes
   - Results deduplicated by `venue_id`

3. **Follow existing patterns**
   - Component structure: hooks → effects → handlers → render
   - API routes: try-catch → query → transform → return
   - Types: interface for objects, type for unions

4. **Test filtering logic carefully**
   - ANY selected value matches (OR logic)
   - Hierarchical filters check both primary AND secondary
   - Special handling for pipe-separated values (vibes)
   - Date parsing supports multiple formats

5. **Performance matters**
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers
   - Avoid unnecessary re-renders
   - Client-side filtering is intentional (don't move to server)

6. **Maintain documentation**
   - Update relevant .md files when changing architecture
   - Add comments for complex logic
   - Update type definitions when data structure changes

### Common AI Tasks

**Adding a new filter type:**
1. Add to `HierarchicalFilterState` in `src/types/index.ts`
2. Update filtering logic in `useClientSideVenues.ts`
3. Add UI component in `src/components/filters/`
4. Update `filter-options` API to return new options
5. Document in `docs/FRONTEND_ARCHITECTURE.md`

**Adding a new API route:**
1. Create `src/app/api/[name]/route.ts`
2. Follow existing error handling pattern
3. Add TypeScript types for request/response
4. Document in `docs/BACKEND_API.md`
5. Create custom hook if needed

**Modifying database schema:**
1. Update Supabase schema (SQL migrations)
2. Update types in `src/types/index.ts`
3. Update API routes that query affected tables
4. Update documentation in `docs/BACKEND_API.md`
5. Test thoroughly with real data

---

## 🔍 Debugging Tips

### Frontend Issues
```typescript
// Enable detailed filter logging
// In useClientSideVenues.ts, logs are already extensive
console.log('🔍 CLIENT FILTER - Starting filter with:', filters);
```

### API Issues
```typescript
// Check API route logs
console.log('📊 SUPABASE QUERY - Raw records returned:', data?.length);
```

### Map Issues
```typescript
// Check map initialization
console.log('🗺️ Map loaded with venues:', venues.length);
```

### State Issues
```typescript
// Use React DevTools
// Install: https://react.dev/learn/react-developer-tools
// Inspect: Component tree, Props, State, Hooks
```

---

## 🎉 Project Milestones

### ✅ Completed (V1.0)
- [x] Interactive map with custom Dubai theme
- [x] 10+ filter types with hierarchical structure
- [x] Client-side filtering for instant performance
- [x] Multi-provider authentication
- [x] Responsive design (mobile/tablet/desktop)
- [x] Venue-event data integration
- [x] Glass morphism UI design
- [x] Comprehensive documentation (30,000+ words)

### 🚧 In Progress
- [ ] User testing and feedback collection
- [ ] Performance monitoring setup
- [ ] V2 planning and design

### 📋 Planned (V2.0)
- [ ] AI-powered recommendations
- [ ] Social features (profiles, favorites)
- [ ] Dark/Light mode
- [ ] Push notifications
- [ ] Advanced search with NLP

---

## 📞 Support & Resources

### Documentation
- Start here: `README.md`
- Frontend: `docs/FRONTEND_ARCHITECTURE.md`
- Backend: `docs/BACKEND_API.md`
- Features: `V1_FEATURES.md`
- All docs: `docs/INDEX.md`

### External Resources
- Next.js 15: https://nextjs.org/docs
- React 19: https://react.dev
- Supabase: https://supabase.com/docs
- Google Maps API: https://developers.google.com/maps
- Tailwind CSS: https://tailwindcss.com/docs

### Project Links
- GitHub: https://github.com/jhamb285/WMV
- Deployment: Vercel (primary)

---

## 🏁 Quick Start for AI Assistants

**If you're helping with this project:**

1. **Read this file first** (you're here! ✓)
2. **Check the specific area**:
   - Frontend work? → `docs/FRONTEND_ARCHITECTURE.md`
   - Backend/API? → `docs/BACKEND_API.md`
   - Features? → `V1_FEATURES.md`
3. **Understand the types**: `src/types/index.ts`
4. **Follow existing patterns**: Look at similar components/routes
5. **Test thoroughly**: Filters are complex, test edge cases
6. **Update docs**: Keep documentation in sync with code

**Golden Rules:**
- ✅ Client-side filtering is intentional (don't change to server-side)
- ✅ Always use TypeScript types (defined in `src/types/index.ts`)
- ✅ Follow the hierarchical filter structure
- ✅ Maintain backward compatibility when possible
- ✅ Update documentation when changing architecture
- ❌ Don't add unnecessary dependencies
- ❌ Don't remove comprehensive logging (helpful for debugging)
- ❌ Don't change filter logic without understanding full flow

---

**Last Updated**: December 2025 | **Version**: 1.0 | **Status**: Production Ready

**Made with ❤️ by the Where's My Vibe Team**

---

*This file serves as the single source of truth for AI assistants working on the Dubai Events Platform. Keep it updated as the project evolves.*
