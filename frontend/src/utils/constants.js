/**
 * @file constants.js
 * @description Shared enumerations used for item categories, campus locations,
 * time-period filters, and their display-name mappings.
 *
 * These arrays are consumed by item-creation forms, filter UIs, and the
 * backend's Joi validation schemas (kept in sync manually).
 */

/**
 * All valid item category slugs accepted by the API.
 * @type {string[]}
 */
export const CATEGORIES = [
  "bottle",
  "earpods",
  "watch",
  "phone",
  "wallet",
  "id_card",
  "keys",
  "bag",
  "laptop",
  "charger",
  "books",
  "stationery",
  "glasses",
  "jewelry",
  "clothing",
  "electronics",
  "other",
];

/**
 * All campus location names shown in dropdowns and filter UIs.
 * @type {string[]}
 */
export const LOCATIONS = [
  "COS",
  "Library",
  "LT",
  "near HOSTEL O C D M",
  "near HOSTEL A B J H",
  "near HOSTEL Q PG",
  "near HOSTEL E N G I",
  "near HOSTEL K L",
  "SBI LAWN",
  "G BLOCK",
  "SPORTS AREA",
  "Auditorium",
  "Main Gate",
  "Jaggi",
  "B Block",
  "Other",
];

/**
 * Time-period filter options for the item search.
 * @type {Array<{value: string, label: string}>}
 */
export const TIME_PERIODS = [
  { value: "yesterday", label: "Yesterday" },
  { value: "day_before_yesterday", label: "Day Before Yesterday" },
  { value: "last_week", label: "Last Week" },
  { value: "last_month", label: "Last Month" },
  { value: "last_3_months", label: "Last 3 Months" },
];

/**
 * Human-readable display names for each category slug.
 * @type {Object.<string, string>}
 */
export const CATEGORY_DISPLAY_NAMES = {
  bottle: "Water Bottle",
  earpods: "Earpods",
  watch: "Watch",
  phone: "Phone",
  wallet: "Wallet",
  id_card: "ID Card",
  keys: "Keys",
  bag: "Bag",
  laptop: "Laptop",
  charger: "Charger",
  books: "Books",
  stationery: "Stationery",
  glasses: "Glasses",
  jewelry: "Jewelry",
  clothing: "Clothing",
  electronics: "Electronics",
  other: "Other",
};
