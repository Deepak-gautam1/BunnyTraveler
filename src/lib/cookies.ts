// src/lib/cookies.ts
import Cookies from "js-cookie";

export const COOKIE_KEYS = {
  // Search & Filters
  SEARCH_FILTERS: "safar_search_filters",
  SHOW_ADVANCED_FILTERS: "safar_show_advanced",
  VIEW_MODE: "safar_view_mode",
  MAP_FILTERS: "safar_map_filters",
  SORT_PREFERENCE: "safar_sort_preference",
  RECENT_SEARCHES: "safar_recent_searches",

  // User Preferences
  LANGUAGE: "safar_language",
  CURRENCY: "safar_currency",
  THEME: "safar_theme",

  // Navigation & History
  LAST_PAGE: "safar_last_page",
  RECENTLY_VIEWED_TRIPS: "safar_recent_trips",
  TAB_PREFERENCE: "safar_tab_pref",

  // Drafts & Temporary Data
  TRIP_DRAFT: "safar_trip_draft",

  // UI States
  BOOKMARKS_SORT: "safar_bookmarks_sort",
  BOOKMARKS_VIEW: "safar_bookmarks_view",
  PROFILE_TAB: "safar_profile_tab",
  WELCOME_DISMISSED: "safar_welcome_dismissed",

  // ✅ Image Caching
  IMAGES_CACHED: "safar_images_cached",
  LAST_IMAGE_CHECK: "safar_last_image_check",

  // System
  CONSENT: "safar_cookie_consent",
  FIRST_VISIT: "safar_first_visit",
  NOTIFICATIONS: "safar_notifications",
} as const;

export const setCookie = (key: string, value: unknown, days = 30) => {
  Cookies.set(key, JSON.stringify(value), { expires: days });
};

export const getCookie = <T = unknown>(key: string): T | null => {
  const value = Cookies.get(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const removeCookie = (key: string) => {
  Cookies.remove(key);
};

export const hasCookie = (key: string): boolean => {
  return Cookies.get(key) !== undefined;
};

export const clearAllAppCookies = () => {
  Object.values(COOKIE_KEYS).forEach((key) => {
    Cookies.remove(key);
  });
};
