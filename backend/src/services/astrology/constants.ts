// ==========================================
// VEDIC ASTROLOGY CONSTANT MATRICES
// Used for Ashtakoota (Guna Milan) computation
// ==========================================

export enum Nadi {
  AADI = "Aadi",
  MADHYA = "Madhya",
  ANTYA = "Antya",
}

export enum Gana {
  DEVA = "Deva",
  MANAV = "Manav",
  RAKSHASA = "Rakshasa",
}

export enum Varna {
  BRAHMIN = 4,
  KSHATRIYA = 3,
  VAISHYA = 2,
  SHUDRA = 1,
}

// Map each of the 27 Nakshatras to its Nadi and Gana properties.
// Arrays index matches standardized 1-27 sequence for the Tara (Distance) computation.
export const NAKSHATRAS = {
  "Ashwini": { index: 1, nadi: Nadi.AADI, gana: Gana.DEVA, yoni: "Horse" },
  "Bharani": { index: 2, nadi: Nadi.MADHYA, gana: Gana.MANAV, yoni: "Elephant" },
  "Krittika": { index: 3, nadi: Nadi.ANTYA, gana: Gana.RAKSHASA, yoni: "Sheep" },
  "Rohini": { index: 4, nadi: Nadi.ANTYA, gana: Gana.MANAV, yoni: "Serpent" },
  "Mrigashira": { index: 5, nadi: Nadi.MADHYA, gana: Gana.DEVA, yoni: "Serpent" },
  "Ardra": { index: 6, nadi: Nadi.AADI, gana: Gana.MANAV, yoni: "Dog" },
  "Punarvasu": { index: 7, nadi: Nadi.AADI, gana: Gana.DEVA, yoni: "Cat" },
  "Pushya": { index: 8, nadi: Nadi.MADHYA, gana: Gana.DEVA, yoni: "Sheep" },
  "Ashlesha": { index: 9, nadi: Nadi.ANTYA, gana: Gana.RAKSHASA, yoni: "Cat" },
  "Magha": { index: 10, nadi: Nadi.ANTYA, gana: Gana.RAKSHASA, yoni: "Rat" },
  "Purva Phalguni": { index: 11, nadi: Nadi.MADHYA, gana: Gana.MANAV, yoni: "Rat" },
  "Uttara Phalguni": { index: 12, nadi: Nadi.AADI, gana: Gana.MANAV, yoni: "Cow" },
  "Hasta": { index: 13, nadi: Nadi.AADI, gana: Gana.DEVA, yoni: "Buffalo" },
  "Chitra": { index: 14, nadi: Nadi.MADHYA, gana: Gana.RAKSHASA, yoni: "Tiger" },
  "Swati": { index: 15, nadi: Nadi.ANTYA, gana: Gana.DEVA, yoni: "Buffalo" },
  "Vishakha": { index: 16, nadi: Nadi.ANTYA, gana: Gana.RAKSHASA, yoni: "Tiger" },
  "Anuradha": { index: 17, nadi: Nadi.MADHYA, gana: Gana.DEVA, yoni: "Hare" },
  "Jyeshtha": { index: 18, nadi: Nadi.AADI, gana: Gana.RAKSHASA, yoni: "Hare" },
  "Mula": { index: 19, nadi: Nadi.AADI, gana: Gana.RAKSHASA, yoni: "Dog" },
  "Purva Ashadha": { index: 20, nadi: Nadi.MADHYA, gana: Gana.MANAV, yoni: "Monkey" },
  "Uttara Ashadha": { index: 21, nadi: Nadi.ANTYA, gana: Gana.MANAV, yoni: "Mongoose" },
  "Shravana": { index: 22, nadi: Nadi.ANTYA, gana: Gana.DEVA, yoni: "Monkey" },
  "Dhanishtha": { index: 23, nadi: Nadi.MADHYA, gana: Gana.RAKSHASA, yoni: "Lion" },
  "Shatabhisha": { index: 24, nadi: Nadi.AADI, gana: Gana.RAKSHASA, yoni: "Horse" },
  "Purva Bhadra": { index: 25, nadi: Nadi.AADI, gana: Gana.MANAV, yoni: "Lion" },
  "Uttara Bhadra": { index: 26, nadi: Nadi.MADHYA, gana: Gana.MANAV, yoni: "Cow" },
  "Revati": { index: 27, nadi: Nadi.ANTYA, gana: Gana.DEVA, yoni: "Elephant" }
} as const;

// Types based on the keys
export type NakshatraName = keyof typeof NAKSHATRAS;

export enum Planet {
  SUN = "Sun", MOON = "Moon", MARS = "Mars",
  MERCURY = "Mercury", JUPITER = "Jupiter",
  VENUS = "Venus", SATURN = "Saturn"
}

// Map the 12 Raasis (Zodiac signs)
export const RAASIS = {
  "Mesha": { index: 1, lord: Planet.MARS, varna: Varna.KSHATRIYA, vashya: "Chatushpada" },
  "Vrishabha": { index: 2, lord: Planet.VENUS, varna: Varna.VAISHYA, vashya: "Chatushpada" },
  "Mithuna": { index: 3, lord: Planet.MERCURY, varna: Varna.SHUDRA, vashya: "Manav" },
  "Karka": { index: 4, lord: Planet.MOON, varna: Varna.BRAHMIN, vashya: "Jalchar" },
  "Simha": { index: 5, lord: Planet.SUN, varna: Varna.KSHATRIYA, vashya: "Vanchar" },
  "Kanya": { index: 6, lord: Planet.MERCURY, varna: Varna.VAISHYA, vashya: "Manav" },
  "Tula": { index: 7, lord: Planet.VENUS, varna: Varna.SHUDRA, vashya: "Manav" },
  "Vrischika": { index: 8, lord: Planet.MARS, varna: Varna.BRAHMIN, vashya: "Keetaka" },
  "Dhanu": { index: 9, lord: Planet.JUPITER, varna: Varna.KSHATRIYA, vashya: "Chatushpada" }, // First half
  "Makara": { index: 10, lord: Planet.SATURN, varna: Varna.VAISHYA, vashya: "Jalchar" }, // Second half
  "Kumbha": { index: 11, lord: Planet.SATURN, varna: Varna.SHUDRA, vashya: "Manav" },
  "Meena": { index: 12, lord: Planet.JUPITER, varna: Varna.BRAHMIN, vashya: "Jalchar" },
} as const;

export type RaasiName = keyof typeof RAASIS;

// Graha Maitri (Planetary Friendship) Matrix
// Returns: 5 (Best Friend), 4 (Friend), 3 (Neutral), 1 (Enemy), 0 (Best Enemy)
export function getGrahaMaitriScore(lordA: Planet, lordB: Planet): number {
  if (lordA === lordB) return 5;
  // Simplified generic mapping stub to represent Vedic friendship rules
  const friendGroups = [
    [Planet.SUN, Planet.MOON, Planet.MARS, Planet.JUPITER], // Deva Group
    [Planet.VENUS, Planet.SATURN, Planet.MERCURY]           // Asura Group
  ];
  const aInDeva = friendGroups[0].includes(lordA);
  const bInDeva = friendGroups[0].includes(lordB);

  if (aInDeva === bInDeva) return 4; // Same group = Friends
  if (lordA === Planet.MERCURY || lordB === Planet.MERCURY) return 3; // Mercury is somewhat neutral
  return 1; // Enemies
}

// Yoni Compatibility mapping (0 to 4 points)
export function getYoniScore(yoniA: string, yoniB: string): number {
  if (yoniA === yoniB) return 4; // Identical animal = Best match
  // Simplified Vedic Enemy Matrix
  const enemies: Record<string, string> = {
    "Horse": "Buffalo", "Elephant": "Lion", "Sheep": "Monkey", "Serpent": "Mongoose",
    "Dog": "Hare", "Cat": "Rat", "Tiger": "Cow"
  };
  
  if (enemies[yoniA] === yoniB || enemies[yoniB] === yoniA) return 0; // Natural sworn enemies
  return 2; // Average fallback for other animal interactions
}
