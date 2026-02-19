import { describe, it, expect } from 'vitest';
import {
  matchHospital,
  matchHospitalByCounty,
  inferCounty,
  inferCountyFromRefCode,
} from '../hospital-matcher';

// ─── inferCountyFromRefCode ─────────────────────────────────────────────────

describe('inferCountyFromRefCode', () => {
  it('extracts county from MW (Mid-West) ref codes', () => {
    expect(inferCountyFromRefCode('MW26MOB2')).toBe('Limerick');
    expect(inferCountyFromRefCode('MW26ER3')).toBe('Limerick');
    expect(inferCountyFromRefCode('MW26KR10')).toBe('Limerick');
  });

  it('extracts county from Dublin ref codes', () => {
    expect(inferCountyFromRefCode('DU26AB12')).toBe('Dublin');
    expect(inferCountyFromRefCode('DN26XY5')).toBe('Dublin');
    expect(inferCountyFromRefCode('DS26AA1')).toBe('Dublin');
  });

  it('extracts county from Cork ref codes', () => {
    expect(inferCountyFromRefCode('CO26AB1')).toBe('Cork');
  });

  it('extracts county from Galway ref codes', () => {
    expect(inferCountyFromRefCode('GA26AB1')).toBe('Galway');
  });

  it('extracts county from other regional ref codes', () => {
    expect(inferCountyFromRefCode('KE26AB1')).toBe('Kerry');
    expect(inferCountyFromRefCode('WA26AB1')).toBe('Waterford');
    expect(inferCountyFromRefCode('SL26AB1')).toBe('Sligo');
    expect(inferCountyFromRefCode('DK26AB1')).toBe('Donegal');
    expect(inferCountyFromRefCode('CA26AB1')).toBe('Cavan');
    expect(inferCountyFromRefCode('LO26AB1')).toBe('Louth');
    expect(inferCountyFromRefCode('KI26AB1')).toBe('Kilkenny');
    expect(inferCountyFromRefCode('CL26AB1')).toBe('Clare');
    expect(inferCountyFromRefCode('MA26AB1')).toBe('Mayo');
  });

  it('extracts county from newly added ref codes', () => {
    expect(inferCountyFromRefCode('LI26AB1')).toBe('Limerick');
    expect(inferCountyFromRefCode('MH26AB1')).toBe('Dublin');
    expect(inferCountyFromRefCode('OF26AB1')).toBe('Laois');
    expect(inferCountyFromRefCode('LG26AB1')).toBe('Westmeath');
    expect(inferCountyFromRefCode('MN26AB1')).toBe('Cavan');
    expect(inferCountyFromRefCode('LE26AB1')).toBe('Sligo');
  });

  it('extracts ref code embedded in longer text', () => {
    expect(inferCountyFromRefCode('Registrar - Ophthalmology - July 2026 MW26MOB2')).toBe('Limerick');
    expect(inferCountyFromRefCode('SHO Medicine DU26AA3 Dublin')).toBe('Dublin');
  });

  it('returns null for text without ref codes', () => {
    expect(inferCountyFromRefCode('Registrar in Medicine')).toBeNull();
    expect(inferCountyFromRefCode('')).toBeNull();
    expect(inferCountyFromRefCode('SHO Emergency Department')).toBeNull();
  });

  it('returns null for unknown prefixes', () => {
    expect(inferCountyFromRefCode('ZZ26AB1')).toBeNull();
    expect(inferCountyFromRefCode('QQ26AB1')).toBeNull();
  });
});

// ─── matchHospital ──────────────────────────────────────────────────────────

describe('matchHospital', () => {
  it('matches by full hospital name', () => {
    const result = matchHospital('Mater Misericordiae University Hospital');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('mater');
    expect(result!.county).toBe('Dublin');
  });

  it('matches by short name', () => {
    const result = matchHospital('Job at UHG Galway');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('uhg');
    expect(result!.county).toBe('Galway');
  });

  it('matches by alias', () => {
    expect(matchHospital('beaumont')!.id).toBe('beaumont');
    expect(matchHospital('connolly')!.id).toBe('connolly');
    expect(matchHospital('tallaght')!.id).toBe('tallaght');
    expect(matchHospital('limerick')!.id).toBe('uhl');
    expect(matchHospital('tralee')!.id).toBe('uhk');
  });

  it('matches maternity hospitals to parent hospitals', () => {
    expect(matchHospital('rotunda')!.id).toBe('mater');
    expect(matchHospital('temple street')!.id).toBe('mater');
    expect(matchHospital('holles street')!.id).toBe('stvincents');
    expect(matchHospital('coombe')!.id).toBe('stjames');
    expect(matchHospital('crumlin')!.id).toBe('stjames');
  });

  it('matches NMH and CHI aliases', () => {
    expect(matchHospital('nmh')!.id).toBe('stvincents');
    expect(matchHospital('national maternity')!.id).toBe('stvincents');
    expect(matchHospital('chi')!.id).toBe('stjames');
    expect(matchHospital("children's health ireland")!.id).toBe('stjames');
  });

  it('ref code overrides text-matched hospital (the MW26MOB2 bug)', () => {
    // This was the original bug: "Registrar - Ophthalmology MW26MOB2" matched
    // "Mater" from text but MW26 = Mid-West = Limerick
    const result = matchHospital('Registrar - Ophthalmology - July 2026 MW26MOB2');
    expect(result).not.toBeNull();
    expect(result!.county).toBe('Limerick');
    expect(result!.id).toBe('uhl');
  });

  it('ref code validates text-matched hospital in same county', () => {
    // If text mentions CUH and ref code says Cork, CUH should match
    const result = matchHospital('SHO at Cork University Hospital CO26AB1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('cuh');
    expect(result!.county).toBe('Cork');
  });

  it('ref code rejects text-matched hospital in wrong county', () => {
    // Text mentions Mater (Dublin) but ref code says Limerick
    const result = matchHospital('Mater MW26AB1');
    expect(result).not.toBeNull();
    // Should NOT return Mater (Dublin) — should return UHL (Limerick)
    expect(result!.county).toBe('Limerick');
    expect(result!.id).toBe('uhl');
  });

  it('falls back to county primary hospital when ref code has no text match', () => {
    const result = matchHospital('Some random role GA26AB1');
    expect(result).not.toBeNull();
    expect(result!.county).toBe('Galway');
  });

  it('returns null for unrecognized text', () => {
    expect(matchHospital('random text with no hospital')).toBeNull();
    expect(matchHospital('')).toBeNull();
  });
});

// ─── matchHospitalByCounty ──────────────────────────────────────────────────

describe('matchHospitalByCounty', () => {
  it('returns teaching hospitals preferentially', () => {
    // Dublin has multiple hospitals; teaching ones should be preferred
    const result = matchHospitalByCounty('Dublin');
    expect(result).not.toBeNull();
    expect(result!.county).toBe('Dublin');
  });

  it('returns hospital for each county with hospitals', () => {
    const counties = [
      'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford',
      'Kerry', 'Sligo', 'Donegal', 'Louth', 'Kilkenny',
      'Wexford', 'Westmeath', 'Laois', 'Kildare', 'Cavan',
      'Clare', 'Tipperary', 'Mayo', 'Roscommon',
    ];
    for (const county of counties) {
      const result = matchHospitalByCounty(county);
      expect(result, `No hospital found for county: ${county}`).not.toBeNull();
      expect(result!.county).toBe(county);
    }
  });

  it('returns null for counties without hospitals', () => {
    expect(matchHospitalByCounty('Meath')).toBeNull();
    expect(matchHospitalByCounty('Offaly')).toBeNull();
    expect(matchHospitalByCounty('')).toBeNull();
  });
});

// ─── inferCounty ────────────────────────────────────────────────────────────

describe('inferCounty', () => {
  it('prioritizes ref code over everything else', () => {
    // MW = Limerick, even though text says "Mater" (Dublin)
    expect(inferCounty('Mater Hospital MW26ER3')).toBe('Limerick');
    // DU = Dublin
    expect(inferCounty('Registrar DU26AB1')).toBe('Dublin');
  });

  it('uses hospital name when no ref code', () => {
    expect(inferCounty('SHO at Cork University Hospital')).toBe('Cork');
    expect(inferCounty('Registrar Beaumont')).toBe('Dublin');
    expect(inferCounty('Job at UHL')).toBe('Limerick');
  });

  it('uses direct county name mention as fallback', () => {
    expect(inferCounty('NCHD role in Meath')).toBe('Meath');
    expect(inferCounty('Position in Tipperary')).toBe('Tipperary');
  });

  it('defaults to Dublin when nothing matches', () => {
    expect(inferCounty('Random role somewhere')).toBe('Dublin');
    expect(inferCounty('')).toBe('Dublin');
  });
});

// ─── Real-world job title regression tests ──────────────────────────────────

describe('real-world regression tests', () => {
  it('MW26MOB2 Ophthalmology job → Limerick, not Dublin', () => {
    const title = 'Registrar - Ophthalmology - July 2026 MW26MOB2';
    const county = inferCounty(title);
    const hospital = matchHospital(title);

    expect(county).toBe('Limerick');
    expect(hospital).not.toBeNull();
    expect(hospital!.county).toBe('Limerick');
  });

  it('DU26 job with no hospital name → Dublin', () => {
    const title = 'SHO - General Medicine - July 2026 DU26GM5';
    expect(inferCounty(title)).toBe('Dublin');
  });

  it('CO26 job → Cork', () => {
    const title = 'Registrar Anaesthesia CO26AN3';
    expect(inferCounty(title)).toBe('Cork');
    const hospital = matchHospital(title);
    expect(hospital).not.toBeNull();
    expect(hospital!.county).toBe('Cork');
  });

  it('job mentioning Galway with no ref code → Galway', () => {
    expect(inferCounty('SHO Medicine University Hospital Galway')).toBe('Galway');
  });

  it('job mentioning Sligo with NW ref code → Sligo', () => {
    expect(inferCounty('Registrar NW26AB1 Sligo')).toBe('Sligo');
  });
});
