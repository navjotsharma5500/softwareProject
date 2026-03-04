/**
 * Shared application-level constants and pure helper functions.
 * Used by both report.controller.js and admin.controller.js.
 * Keep this file free of DB / cache / network imports.
 */

// Canonical category slugs — must match frontend constants.js and all models.
export const VALID_CATEGORIES = [
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

// Human-readable display names keyed by slug (backward-compat input normalisation).
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

/**
 * Normalise a raw category string from request input:
 *  - numeric index  → VALID_CATEGORIES[index]  (backward compat)
 *  - display name   → canonical slug            (backward compat)
 *  - anything else  → trimmed value (accepted as-is, max 50 chars)
 *
 * @param {string} raw
 * @returns {{ valid: true, category: string } | { valid: false, error: string }}
 */
export const sanitizeCategory = (raw) => {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return { valid: false, error: "Category must be a non-empty string" };
  }
  let cat = raw.trim();

  if (/^\d+$/.test(cat)) {
    const idx = parseInt(cat, 10);
    if (!isNaN(idx) && VALID_CATEGORIES[idx]) cat = VALID_CATEGORIES[idx];
  }

  const matched = Object.keys(CATEGORY_DISPLAY_NAMES).find(
    (k) => CATEGORY_DISPLAY_NAMES[k].toLowerCase() === cat.toLowerCase(),
  );
  if (matched) cat = matched;

  if (cat.length > 50) {
    return { valid: false, error: "Category must not exceed 50 characters" };
  }
  return { valid: true, category: cat };
};

/**
 * Build the standard pagination envelope for list responses.
 *
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 * @returns {{ page, limit, total, totalPages, hasNext, hasPrev }}
 */
export const paginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});
