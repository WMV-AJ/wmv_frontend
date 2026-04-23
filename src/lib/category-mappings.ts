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

// Hex color mapping for UI — brightened palette for dark theme visibility
export const COLOR_HEX_MAP: Record<string, string> = {
  purple: "#E060A8",   // Ladies Night — bright magenta
  red: "#8FD14F",      // Sports Viewing — bright lime green
  yellow: "#FF6B4A",   // Day Party — bright coral-red
  orange: "#FFB020",   // Food & Dining — bright amber
  pink: "#9B72D0",     // Club Night — bright purple
  indigo: "#4BAEE8",   // Brunch — bright sky blue
  blue: "#2EC495",     // Pool Party — bright emerald
  green: "#3ECFCC",    // Live Performance — bright cyan-teal
  teal: "#FFD600",     // Happy Hour — bright yellow
  gray: "#AAAAAA"      // Comedy Night — lighter gray
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
