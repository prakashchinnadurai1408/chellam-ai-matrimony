/**
 * Preference Match Score Calculator — PRD Section 5.2
 * 
 * Computes how well Candidate B meets Candidate A's stated partner preferences
 * across 10 weighted dimensions (total 100 points → normalized to 60% of final score).
 */

export interface PreferenceScoreBreakdown {
  religion: { points: number; max: 20; matched: boolean };
  age: { points: number; max: 15; matched: boolean };
  location: { points: number; max: 10; matched: boolean };
  caste: { points: number; max: 10; matched: boolean };
  education: { points: number; max: 10; matched: boolean };
  diet: { points: number; max: 5; matched: boolean };
  occupation: { points: number; max: 5; matched: boolean };
  income: { points: number; max: 5; matched: boolean };
  family_values: { points: number; max: 5; matched: boolean };
  height: { points: number; max: 5; matched: boolean };
}

export interface PreferenceScoreResult {
  total_raw: number;          // Out of 100
  contribution: number;       // Out of 60 (after 0.60 weight)
  breakdown: PreferenceScoreBreakdown;
}

export interface Preferences {
  religions?: string[];
  min_age?: number;
  max_age?: number;
  states?: string[];
  castes?: string[];
  education_min?: string;
  diet_prefs?: string[];
  employed_in?: string[];
  min_income?: string;
  max_income?: string;
  family_values?: string[];
  min_height?: string;
  max_height?: string;
}

export interface CandidateProfile {
  religion?: string;
  age?: number;
  state?: string;
  caste?: string;
  education?: string;
  diet?: string;
  employed_in?: string;
  income?: string;
  family_values?: string;
  height?: string;
}

const EDUCATION_HIERARCHY: Record<string, number> = {
  "Below 10th": 1, "10th Pass": 2, "12th Pass": 3, "Diploma": 4,
  "High School": 3, "Bachelor's": 5, "B.Tech/M.Tech": 5,
  "MBBS/MD": 6, "CA/CS/ICWA": 5, "MBA": 6, "Master's": 6,
  "Doctorate": 7, "PhD": 7
};

function heightToInches(h?: string): number {
  if (!h) return 0;
  const match = h.match(/(\d+)'(\d+)/);
  if (match) return parseInt(match[1]) * 12 + parseInt(match[2]);
  return 0;
}

function isAnyOrEmpty(arr?: string[]): boolean {
  return !arr || arr.length === 0 || arr.includes("Any");
}

export function computePreferenceScore(
  preferences: Preferences,
  candidate: CandidateProfile
): PreferenceScoreResult {

  // 1. Religion (20 pts)
  const religionMatched = isAnyOrEmpty(preferences.religions) ||
    (candidate.religion ? preferences.religions?.includes(candidate.religion) ?? false : false);

  // 2. Age (15 pts)
  const ageMatched = !preferences.min_age || !preferences.max_age || !candidate.age ||
    (candidate.age >= preferences.min_age && candidate.age <= preferences.max_age);

  // 3. Location (10 pts)
  const locationMatched = isAnyOrEmpty(preferences.states) ||
    (candidate.state ? preferences.states?.includes(candidate.state) ?? false : false);

  // 4. Caste (10 pts)
  const casteMatched = isAnyOrEmpty(preferences.castes) ||
    (candidate.caste ? preferences.castes?.includes(candidate.caste) ?? false : false);

  // 5. Education (10 pts)
  const eduMinLevel = EDUCATION_HIERARCHY[preferences.education_min || ""] || 0;
  const candidateEduLevel = EDUCATION_HIERARCHY[candidate.education || ""] || 0;
  const educationMatched = eduMinLevel === 0 || candidateEduLevel >= eduMinLevel;

  // 6. Diet (5 pts)
  const dietMatched = isAnyOrEmpty(preferences.diet_prefs) ||
    (candidate.diet ? preferences.diet_prefs?.includes(candidate.diet) ?? false : false);

  // 7. Occupation (5 pts)
  const occupationMatched = isAnyOrEmpty(preferences.employed_in) ||
    (candidate.employed_in ? preferences.employed_in?.includes(candidate.employed_in) ?? false : false);

  // 8. Income (5 pts)
  const INCOME_ORDER = [
    "No Income", "Below 1 Lakh", "1-2 Lakhs", "2-3 Lakhs", "3-5 Lakhs",
    "5-7 Lakhs", "7-10 Lakhs", "10-15 Lakhs", "15-20 Lakhs", "20-30 Lakhs",
    "30-50 Lakhs", "50 Lakhs - 1 Crore", "1 Crore+",
  ];
  const candidateIncomeIdx = candidate.income ? INCOME_ORDER.indexOf(candidate.income) : -1;
  const minIncomeIdx = preferences.min_income ? INCOME_ORDER.indexOf(preferences.min_income) : -1;
  const maxIncomeIdx = preferences.max_income ? INCOME_ORDER.indexOf(preferences.max_income) : -1;
  const incomeMatched = !preferences.min_income || candidateIncomeIdx < 0 ||
    (candidateIncomeIdx >= (minIncomeIdx >= 0 ? minIncomeIdx : 0) &&
     (maxIncomeIdx < 0 || candidateIncomeIdx <= maxIncomeIdx));

  // 9. Family Values (5 pts)
  const valuesMatched = isAnyOrEmpty(preferences.family_values) ||
    (candidate.family_values ? preferences.family_values?.includes(candidate.family_values) ?? false : false);

  // 10. Height (5 pts)
  const candH = heightToInches(candidate.height);
  const minH = heightToInches(preferences.min_height);
  const maxH = heightToInches(preferences.max_height);
  const heightMatched = (minH === 0 && maxH === 0) ||
    (candH >= (minH || 0) && (maxH === 0 || candH <= maxH));

  const breakdown: PreferenceScoreBreakdown = {
    religion: { points: religionMatched ? 20 : 0, max: 20, matched: religionMatched },
    age: { points: ageMatched ? 15 : 0, max: 15, matched: ageMatched },
    location: { points: locationMatched ? 10 : 0, max: 10, matched: locationMatched },
    caste: { points: casteMatched ? 10 : 0, max: 10, matched: casteMatched },
    education: { points: educationMatched ? 10 : 0, max: 10, matched: educationMatched },
    diet: { points: dietMatched ? 5 : 0, max: 5, matched: dietMatched },
    occupation: { points: occupationMatched ? 5 : 0, max: 5, matched: occupationMatched },
    income: { points: incomeMatched ? 5 : 0, max: 5, matched: incomeMatched },
    family_values: { points: valuesMatched ? 5 : 0, max: 5, matched: valuesMatched },
    height: { points: heightMatched ? 5 : 0, max: 5, matched: heightMatched },
  };

  const total_raw = Object.values(breakdown).reduce((sum, v) => sum + v.points, 0);
  const contribution = parseFloat((total_raw * 0.60).toFixed(2));

  return { total_raw, contribution, breakdown };
}

/**
 * Compute the final combined match score per PRD Section 5.1:
 * Final Score = (Preference Score × 0.60) + (Horoscope Score × 0.40)
 * 
 * If horoscope data is unavailable, preference score is normalized to 100%.
 */
export function computeFinalMatchScore(
  preferenceContribution: number,  // Out of 60
  gunaScore?: number,              // Out of 36 (raw Guna Milan)
  hasHoroscope: boolean = true
): number {
  if (!hasHoroscope || gunaScore === undefined || gunaScore === null) {
    // Normalize preference to 100%
    return Math.round((preferenceContribution / 60) * 100);
  }
  const horoscopeContribution = (gunaScore / 36) * 40;
  return Math.round(preferenceContribution + horoscopeContribution);
}
