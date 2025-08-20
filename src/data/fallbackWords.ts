/**
 * Curated fallback words used when no other candidates fit.
 *
 * Guidelines for these lists:
 * - single words only (no spaces or punctuation)
 * - family‑friendly and non‑offensive
 * - avoid abbreviations, slang, and proper nouns
 *
 * Lists are intentionally small; puzzle generation will fail if too many
 * slots of a given length rely on fallbacks.
 */
const fallbackWords = [
  // Short, common nouns for 3‑letter slots.
  "CAT",
  "DOG",
  "SUN",
  "BEE",
  "FOX",
  "HAT",
  "INK",
  "JAM",
  "KEY",
  "OWL",

  // Assorted neutral 13‑letter words.
  "UNDERSTANDING",
  "KNOWLEDGEABLE",
  "DETERMINATION",
  "APPRECIATIONS",
  "COMMUNICATION",

  // Assorted neutral 15‑letter words.
  "CONGRATULATIONS",
  "ACKNOWLEDGMENTS",
  "UNDERSTATEMENTS",
  "MICROSCOPICALLY",
  "RECOMMENDATIONS",
];

export default fallbackWords;
