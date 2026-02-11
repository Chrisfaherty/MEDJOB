/**
 * Hospital Matcher Utility
 * Resolves hospital names from scraped text to our canonical hospital database.
 * Used by all scrapers for consistent hospital/group/county resolution.
 */

import hospitalsData from '@/data/hospitals.json';
import type { HospitalGroup } from '@/types/database.types';

const hospitals = hospitalsData.hospitals;

export interface MatchedHospital {
  id: string;
  name: string;
  shortName: string;
  county: string;
  hospitalGroup: HospitalGroup;
}

/** Common abbreviations and aliases for Irish hospitals */
const HOSPITAL_ALIASES: Record<string, string> = {
  // Dublin
  'mmuh': 'mater',
  'mater': 'mater',
  'mater misericordiae': 'mater',
  'beaumont': 'beaumont',
  'connolly': 'connolly',
  'blanchardstown': 'connolly',
  'st james': 'stjames',
  'st. james': 'stjames',
  "st james's": 'stjames',
  "st. james's": 'stjames',
  'james hospital': 'stjames',
  'svuh': 'stvincents',
  "st vincent's": 'stvincents',
  'st vincents': 'stvincents',
  "st. vincent's": 'stvincents',
  'st. vincents': 'stvincents',
  'tuh': 'tallaght',
  'tallaght': 'tallaght',
  'adelaide': 'tallaght',

  // Leinster
  'st lukes kilkenny': 'stlukeskilkenny',
  "st. luke's kilkenny": 'stlukeskilkenny',
  'st luke': 'stlukeskilkenny',
  'wexford': 'wexford',
  'naas': 'naas',
  'portlaoise': 'portlaoise',
  'mullingar': 'mullingar',
  'midland regional mullingar': 'mullingar',
  'midland regional portlaoise': 'portlaoise',

  // South
  'uhw': 'waterford',
  'waterford': 'waterford',
  'university hospital waterford': 'waterford',
  'cuh': 'cuh',
  'cork university': 'cuh',
  'mercy': 'mercy',
  'mercy cork': 'mercy',
  'bantry': 'bantry',
  'uhk': 'uhk',
  'kerry': 'uhk',
  'tralee': 'uhk',

  // West
  'uhg': 'uhg',
  'galway': 'uhg',
  'university hospital galway': 'uhg',
  'uhl': 'uhl',
  'limerick': 'uhl',
  'university hospital limerick': 'uhl',
  'ennis': 'ennis',
  'nenagh': 'nenagh',
  'mayo': 'mayo',
  'muh': 'mayo',
  'castlebar': 'mayo',
  'portiuncula': 'portiuncula',
  'ballinasloe': 'portiuncula',
  'roscommon': 'roscommon',

  // North West
  'suh': 'sligo',
  'sligo': 'sligo',
  'luh': 'letterkenny',
  'letterkenny': 'letterkenny',

  // North East
  'drogheda': 'drogheda',
  'lourdes': 'drogheda',
  'our lady of lourdes': 'drogheda',
  'cavan': 'cavan',

  // Children's hospitals
  'chi': 'mater', // CHI at Connolly/Crumlin/Temple St — map to Mater area
  'crumlin': 'stjames', // Near St James's area
  'temple street': 'mater',
  'rotunda': 'mater', // Maternity - RCSI group area
  'holles street': 'stvincents', // National Maternity - near SVUH
  'coombe': 'stjames', // Maternity - DMHG area
};

/**
 * Match a hospital name/text to our canonical hospital database.
 * Tries multiple strategies: exact name, short name, aliases, county fallback.
 */
export function matchHospital(text: string): MatchedHospital | null {
  if (!text) return null;
  const normalized = text.toLowerCase().trim();

  // Strategy 1: Exact full name match
  for (const h of hospitals) {
    if (normalized === h.name.toLowerCase()) {
      return toMatch(h);
    }
  }

  // Strategy 2: Full name contained in text
  for (const h of hospitals) {
    if (normalized.includes(h.name.toLowerCase())) {
      return toMatch(h);
    }
  }

  // Strategy 3: Short name match
  for (const h of hospitals) {
    if (h.shortName && normalized.includes(h.shortName.toLowerCase())) {
      return toMatch(h);
    }
  }

  // Strategy 4: Alias/abbreviation lookup
  for (const [alias, hospitalId] of Object.entries(HOSPITAL_ALIASES)) {
    if (normalized.includes(alias)) {
      const h = hospitals.find(h => h.id === hospitalId);
      if (h) return toMatch(h);
    }
  }

  return null;
}

/**
 * Match by county name — returns the primary hospital in that county.
 */
export function matchHospitalByCounty(county: string): MatchedHospital | null {
  if (!county) return null;
  const normalized = county.toLowerCase().trim();

  // Prefer teaching hospitals in the county
  const teaching = hospitals.find(
    h => h.county.toLowerCase() === normalized && h.isTeachingHospital
  );
  if (teaching) return toMatch(teaching);

  // Fall back to any hospital in the county
  const any = hospitals.find(h => h.county.toLowerCase() === normalized);
  if (any) return toMatch(any);

  return null;
}

/**
 * Infer county from text (title, location field, etc.)
 */
export function inferCounty(text: string): string {
  if (!text) return 'Dublin';
  const lower = text.toLowerCase();

  // First try to match a hospital — its county is authoritative
  const hospital = matchHospital(text);
  if (hospital) return hospital.county;

  // Direct county name mentions
  const counties = [
    'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kerry',
    'Sligo', 'Donegal', 'Mayo', 'Meath', 'Kilkenny', 'Tipperary',
    'Wexford', 'Westmeath', 'Laois', 'Kildare', 'Louth', 'Cavan',
    'Clare', 'Roscommon',
  ];

  for (const county of counties) {
    if (lower.includes(county.toLowerCase())) {
      return county;
    }
  }

  return 'Dublin'; // Default fallback
}

function toMatch(h: (typeof hospitals)[number]): MatchedHospital {
  return {
    id: h.id,
    name: h.name,
    shortName: h.shortName,
    county: h.county,
    hospitalGroup: h.hospitalGroup as HospitalGroup,
  };
}
