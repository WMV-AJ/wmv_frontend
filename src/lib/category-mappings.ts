// Category Mappings - Database names to UI display names and colors
// Keys MUST exactly match the `primary` values stored in Supabase final_1.event_categories

export interface CategoryConfig {
  display: string;  // Display name for UI
  color: string;    // Color name for styling
}

// Map database primary category names to UI display names and colors
// DB primaries (from event_categories[].primary) - verified against live data
export const PRIMARY_CATEGORY_MAP: Record<string, CategoryConfig> = {
  "Food & Dining": {
    display: "Food & Dining",
    color: "orange"
  },
  "Sports Viewing": {
    display: "Sports",
    color: "red"
  },
  "Live Performance": {
    display: "Live Music",
    color: "green"
  },
  "Club Night": {
    display: "Club Night",
    color: "pink"
  },
  "Day Party & Afterwork": {
    display: "Day Party",
    color: "yellow"
  },
  "Happy Hour": {
    display: "Happy Hour",
    color: "teal"
  },
  "Pool Party": {
    display: "Pool Party",
    color: "blue"
  },
  "Ladies Night": {
    display: "Ladies Night",
    color: "purple"
  },
  "Brunch": {
    display: "Brunch",
    color: "indigo"
  },
  "Comedy Night": {
    display: "Comedy",
    color: "gray"
  }
};

// Secondary categories grouped by primary (exact values from Supabase event_categories[].secondary)
export const SECONDARY_CATEGORIES_MAP: Record<string, string[]> = {
  "Food & Dining": [
    "Dining Experience",
    "Set Menu"
  ],
  "Sports Viewing": [
    "Football",
    "Rugby",
    "Cricket"
  ],
  "Live Performance": [
    "Solo Artist",
    "Guest DJ",
    "Live Band"
  ],
  "Club Night": [
    "Open Format",
    "Latin"
  ],
  "Day Party & Afterwork": [
    "Afternoon",
    "Sundowner",
    "Sunset"
  ],
  "Happy Hour": [
    "Daily",
    "Weekdays Only",
    "Specific Hours",
    "After Office"
  ],
  "Pool Party": [
    "Daytime"
  ],
  "Ladies Night": [
    "Complimentary Drinks"
  ],
  "Brunch": [
    "Live Entertainment",
    "Bottomless",
    "Free-Flow"
  ],
  "Comedy Night": [
    "Open Mic"
  ]
};

// Hex color mapping for UI — palette: #5F4690 #1D6996 #38A6A5 #0F8554 #73AF48 #EDAD08 #E17C05 #CC503E #94346E #666666
export const COLOR_HEX_MAP: Record<string, string> = {
  purple: "#94346E",   // Ladies Night — magenta
  red: "#73AF48",      // Sports Viewing — green
  yellow: "#CC503E",   // Day Party — warm red
  orange: "#E17C05",   // Food & Dining — amber orange
  pink: "#5F4690",     // Club Night — deep purple
  indigo: "#1D6996",   // Brunch — ocean blue
  blue: "#0F8554",     // Pool Party — dark green
  green: "#38A6A5",    // Live Performance — teal
  teal: "#EDAD08",     // Happy Hour — golden yellow
  gray: "#666666"      // Comedy Night — neutral gray
};

// Google Maps marker color mapping
export const GOOGLE_MAPS_COLOR_MAP: Record<string, string> = {
  purple: "purple",
  red: "red", 
  yellow: "yellow",
  orange: "orange",
  pink: "pink",
  indigo: "blue",
  blue: "blue",
  green: "green",
  teal: "blue",
  gray: "red" // fallback
};

// Get display name from database primary name
export function getDisplayName(dbPrimary: string): string {
  return PRIMARY_CATEGORY_MAP[dbPrimary]?.display || dbPrimary;
}

// Get color from database primary name
export function getCategoryColor(dbPrimary: string): string {
  return PRIMARY_CATEGORY_MAP[dbPrimary]?.color || "gray";
}

// Get hex color from color name
export function getHexColor(colorName: string): string {
  return COLOR_HEX_MAP[colorName] || COLOR_HEX_MAP.gray;
}

// Get all primary categories (database names)
export function getAllPrimaryCategories(): string[] {
  return Object.keys(PRIMARY_CATEGORY_MAP);
}

// Get secondary categories for a primary (database name)
export function getSecondaryCategories(dbPrimary: string): string[] {
  return SECONDARY_CATEGORIES_MAP[dbPrimary] || [];
}

// Get Google Maps marker color from category
export function getGoogleMapsColor(colorName: string): string {
  return GOOGLE_MAPS_COLOR_MAP[colorName] || "red";
}

// Get light background color for cards based on category (8% opacity tint)
export function getCategoryLightBg(categoryPrimary: string): { bg: string; border: string } {
  const colorName = getCategoryColor(categoryPrimary);
  const hex = getHexColor(colorName);
  // Parse hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    bg: `rgba(${r},${g},${b},0.08)`,
    border: `rgba(${r},${g},${b},0.35)`,
  };
}
