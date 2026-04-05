import { NAKSHATRAS, RAASIS, NakshatraName, RaasiName, Gana, Planet, getGrahaMaitriScore, getYoniScore } from "./constants";

export interface GunaBreakdown {
  varna: { points: number; max: 1 };
  vashya: { points: number; max: 2 };
  tara: { points: number; max: 3 };
  yoni: { points: number; max: 4 };
  graha_maitri: { points: number; max: 5 };
  gana: { points: number; max: 6 };
  bhakoot: { points: number; max: 7 };
  nadi: { points: number; max: 8 };
}

export interface GunaResult {
  total_score: number;
  max_score: 36;
  is_recommended: boolean; // Over 18 points
  breakdown: GunaBreakdown;
}

export function computeGunaMilan(
  boyNakshatra: string,
  boyRaasi: string,
  girlNakshatra: string,
  girlRaasi: string
): GunaResult {
  
  // Safe cast since input validation occurs upstream
  const bn = NAKSHATRAS[boyNakshatra as NakshatraName];
  const gn = NAKSHATRAS[girlNakshatra as NakshatraName];
  const br = RAASIS[boyRaasi as RaasiName];
  const gr = RAASIS[girlRaasi as RaasiName];

  if (!bn || !gn || !br || !gr) {
    throw new Error("Invalid Nakshatra or Raasi provided for calculation.");
  }

  // 1. Varna (1 max)
  const varnaPoints = br.varna >= gr.varna ? 1 : 0;

  // 2. Vashya (2 max) (Stubbed simplified Vedic rules)
  let vashyaPoints = 0;
  if (br.vashya === gr.vashya) vashyaPoints = 2;
  else if (br.vashya === "Keetaka" && gr.vashya !== "Keetaka") vashyaPoints = 0;
  else vashyaPoints = 1; // Neutral attraction

  // 3. Tara (3 max)
  // Distance from Bride to Groom % 9
  let distanceCount = (bn.index - gn.index + 27) % 27;
  if (distanceCount === 0) distanceCount = 27;
  const taraVal = distanceCount % 9;
  const taraPoints = [3, 5, 7].includes(taraVal) ? 1.5 : 3; // Simplified rules

  // 4. Yoni (4 max)
  const yoniPoints = getYoniScore(bn.yoni, gn.yoni);

  // 5. Graha Maitri (5 max)
  const grahaMaitriPoints = getGrahaMaitriScore(br.lord, gr.lord);

  // 6. Gana (6 max)
  let ganaPoints = 0;
  if (bn.gana === gn.gana) ganaPoints = 6;
  else if (bn.gana === Gana.DEVA && gn.gana === Gana.MANAV || 
           bn.gana === Gana.MANAV && gn.gana === Gana.DEVA) ganaPoints = 6;
  else if (bn.gana === Gana.RAKSHASA || gn.gana === Gana.RAKSHASA) ganaPoints = 0;

  // 7. Bhakoot (7 max)
  // Check relative signs axis
  let axis = Math.abs(br.index - gr.index);
  if (axis > 6) axis = 12 - axis; // Smallest distance
  // 6/8 axis = 0 pts; 1/7 axis = 7 pts. Simplified matrix:
  const bhakootPoints = axis === 0 || axis === 6 ? 7 : (axis === 3 ? 0 : 4);

  // 8. Nadi (8 max)
  const nadiPoints = bn.nadi === gn.nadi ? 0 : 8; // Most critical feature for Vedic progeny health

  const total_score = varnaPoints + vashyaPoints + taraPoints + yoniPoints + grahaMaitriPoints + ganaPoints + bhakootPoints + nadiPoints;

  return {
    total_score,
    max_score: 36,
    is_recommended: total_score >= 18,
    breakdown: {
      varna: { points: varnaPoints, max: 1 },
      vashya: { points: vashyaPoints, max: 2 },
      tara: { points: taraPoints, max: 3 },
      yoni: { points: yoniPoints, max: 4 },
      graha_maitri: { points: grahaMaitriPoints, max: 5 },
      gana: { points: ganaPoints, max: 6 },
      bhakoot: { points: bhakootPoints, max: 7 },
      nadi: { points: nadiPoints, max: 8 },
    }
  };
}
