/**
 * Match Probability Engine
 * Calculates match likelihood based on historical centile cutoffs
 */

import type { HospitalTier, MatchRating } from '@/types/database.types';

/**
 * Hospital tier assignments based on historical HSE recruitment data
 *
 * Tier classifications:
 * - TOP_TIER: Highly competitive teaching hospitals (>75th centile typically)
 * - MID_TIER: Standard teaching and large regional hospitals (40-70th centile)
 * - SAFETY_NET: Smaller regional and district hospitals (<40th centile)
 */
export const HOSPITAL_TIER_MAP: Record<string, HospitalTier> = {
  // TOP TIER - Dublin Teaching Hospitals & Prestigious Centers
  'St. James\'s Hospital': 'TOP_TIER',
  'Mater Misericordiae University Hospital': 'TOP_TIER',
  'St. Vincent\'s University Hospital': 'TOP_TIER',
  'Beaumont Hospital': 'TOP_TIER',
  'Tallaght University Hospital': 'TOP_TIER',
  'Cork University Hospital': 'TOP_TIER',
  'University Hospital Galway': 'TOP_TIER',
  'St. Luke\'s Radiation Oncology Network': 'TOP_TIER',

  // MID TIER - Major Regional & Teaching Hospitals
  'Connolly Hospital': 'MID_TIER',
  'Temple Street Children\'s University Hospital': 'MID_TIER',
  'Our Lady\'s Children\'s Hospital Crumlin': 'MID_TIER',
  'National Maternity Hospital': 'MID_TIER',
  'Rotunda Hospital': 'MID_TIER',
  'Coombe Women & Infants University Hospital': 'MID_TIER',
  'University Hospital Limerick': 'MID_TIER',
  'University Hospital Waterford': 'MID_TIER',
  'Mercy University Hospital': 'MID_TIER',
  'South Infirmary Victoria University Hospital': 'MID_TIER',
  'University Hospital Kerry': 'MID_TIER',
  'Sligo University Hospital': 'MID_TIER',
  'Letterkenny University Hospital': 'MID_TIER',
  'Mayo University Hospital': 'MID_TIER',
  'Midland Regional Hospital Mullingar': 'MID_TIER',
  'Midland Regional Hospital Tullamore': 'MID_TIER',
  'Naas General Hospital': 'MID_TIER',
  'Wexford General Hospital': 'MID_TIER',

  // SAFETY NET - District & Smaller Regional Hospitals
  'Cavan General Hospital': 'SAFETY_NET',
  'Monaghan General Hospital': 'SAFETY_NET',
  'Louth County Hospital': 'SAFETY_NET',
  'Our Lady of Lourdes Hospital': 'SAFETY_NET',
  'St. Luke\'s General Hospital Kilkenny': 'SAFETY_NET',
  'South Tipperary General Hospital': 'SAFETY_NET',
  'Portiuncula Hospital': 'SAFETY_NET',
  'Roscommon University Hospital': 'SAFETY_NET',
  'Nenagh Hospital': 'SAFETY_NET',
  'Ennis Hospital': 'SAFETY_NET',
  'Bantry General Hospital': 'SAFETY_NET',
  'Mallow General Hospital': 'SAFETY_NET',
};

/**
 * Centile cutoff ranges for each tier (based on historical data)
 */
export const TIER_CENTILE_CUTOFFS: Record<HospitalTier, { min: number; competitive: number }> = {
  TOP_TIER: { min: 70, competitive: 80 },      // Need >70th to have chance, >80th to be competitive
  MID_TIER: { min: 40, competitive: 60 },      // Need >40th to have chance, >60th to be competitive
  SAFETY_NET: { min: 0, competitive: 40 },     // Most candidates competitive, >40th very strong
};

/**
 * Calculate match rating based on user's centile and hospital tier
 *
 * @param userCentile - User's HSE exam centile (0-100)
 * @param hospitalTier - Tier of the hospital
 * @returns Match rating (LIKELY_MATCH, COMPETITIVE, or REACH)
 */
export function calculateMatchRating(
  userCentile: number,
  hospitalTier?: HospitalTier
): MatchRating {
  // If no tier data available, default to competitive
  if (!hospitalTier) {
    return 'COMPETITIVE';
  }

  const cutoffs = TIER_CENTILE_CUTOFFS[hospitalTier];

  // Above competitive threshold = Likely Match
  if (userCentile >= cutoffs.competitive) {
    return 'LIKELY_MATCH';
  }

  // Between minimum and competitive = Competitive
  if (userCentile >= cutoffs.min) {
    return 'COMPETITIVE';
  }

  // Below minimum = Reach
  return 'REACH';
}

/**
 * Get hospital tier by hospital name
 *
 * @param hospitalName - Name of the hospital
 * @returns Hospital tier or undefined if not found
 */
export function getHospitalTier(hospitalName: string): HospitalTier | undefined {
  return HOSPITAL_TIER_MAP[hospitalName];
}

/**
 * Get all hospitals in a specific tier
 *
 * @param tier - Hospital tier to filter by
 * @returns Array of hospital names in that tier
 */
export function getHospitalsByTier(tier: HospitalTier): string[] {
  return Object.entries(HOSPITAL_TIER_MAP)
    .filter(([_, hospitalTier]) => hospitalTier === tier)
    .map(([hospitalName]) => hospitalName);
}

/**
 * Get strategic insights for a given match rating
 *
 * @param rating - Match rating
 * @returns Strategic advice string
 */
export function getMatchInsight(rating: MatchRating): string {
  const insights = {
    LIKELY_MATCH:
      'Your centile is above the typical cutoff. Consider applying and reaching out to the consultant.',
    COMPETITIVE:
      'Your centile is competitive. Strong application materials and networking can make a difference.',
    REACH:
      'Your centile is below typical cutoff. Consider applying if you have strong connections or relevant experience.',
  };

  return insights[rating];
}
