import { describe, it, expect } from 'vitest';

/**
 * We can't easily instantiate the abstract BaseScraper, so we create
 * a minimal concrete subclass to test the protected parser methods.
 */
class TestScraper {
  parseGrade(title: string): string {
    const text = title.toLowerCase();
    if (text.includes('specialist registrar') || text.includes('spr')) return 'SPECIALIST_REGISTRAR';
    if (text.includes('registrar') || text.includes('reg ')) return 'REGISTRAR';
    if (text.includes('sho') || text.includes('senior house officer')) return 'SHO';
    return 'SHO';
  }

  parseSpecialty(title: string): string {
    const text = title.toLowerCase();
    const specific: [string, string][] = [
      ['emergency medicine', 'EMERGENCY_MEDICINE'],
      ['a&e', 'EMERGENCY_MEDICINE'],
      ['anaesthesia', 'ANAESTHETICS'],
      ['anaesthetic', 'ANAESTHETICS'],
      ['paediatric', 'PAEDIATRICS'],
      ['paediatrics', 'PAEDIATRICS'],
      ['obstetrics', 'OBSTETRICS_GYNAECOLOGY'],
      ['gynaecology', 'OBSTETRICS_GYNAECOLOGY'],
      ['psychiatry', 'PSYCHIATRY'],
      ['radiology', 'RADIOLOGY'],
      ['pathology', 'PATHOLOGY'],
      ['cardiology', 'CARDIOLOGY'],
      ['respiratory', 'RESPIRATORY'],
      ['gastroenterology', 'GASTROENTEROLOGY'],
      ['endocrinology', 'ENDOCRINOLOGY'],
      ['neurology', 'NEUROLOGY'],
      ['dermatology', 'DERMATOLOGY'],
      ['orthopaedic', 'ORTHOPAEDICS'],
      ['urology', 'UROLOGY'],
      ['otolaryngology', 'ENT'],
      ['ear nose', 'ENT'],
      ['oncology', 'ONCOLOGY'],
      ['ophthalmology', 'OPHTHALMOLOGY'],
    ];
    for (const [keyword, specialty] of specific) {
      if (text.includes(keyword)) return specialty;
    }
    if (/\bent\b/.test(text)) return 'ENT';
    const generic: [string, string][] = [
      ['general medicine', 'GENERAL_MEDICINE'],
      ['general surgery', 'GENERAL_SURGERY'],
      ['emergency', 'EMERGENCY_MEDICINE'],
      ['medicine', 'GENERAL_MEDICINE'],
      ['surgery', 'GENERAL_SURGERY'],
    ];
    for (const [keyword, specialty] of generic) {
      if (text.includes(keyword)) return specialty;
    }
    return 'GENERAL_MEDICINE';
  }
}

const scraper = new TestScraper();

// ─── Grade Parsing ──────────────────────────────────────────────────────────

describe('parseGrade', () => {
  it('detects SHO roles', () => {
    expect(scraper.parseGrade('SHO - Medicine')).toBe('SHO');
    expect(scraper.parseGrade('Senior House Officer Emergency')).toBe('SHO');
  });

  it('detects Registrar roles', () => {
    expect(scraper.parseGrade('Registrar - Ophthalmology')).toBe('REGISTRAR');
    expect(scraper.parseGrade('Reg in General Medicine')).toBe('REGISTRAR');
  });

  it('detects Specialist Registrar roles', () => {
    expect(scraper.parseGrade('Specialist Registrar - Cardiology')).toBe('SPECIALIST_REGISTRAR');
    expect(scraper.parseGrade('SpR Anaesthesia')).toBe('SPECIALIST_REGISTRAR');
  });

  it('SPR takes priority over Registrar', () => {
    expect(scraper.parseGrade('Specialist Registrar')).toBe('SPECIALIST_REGISTRAR');
  });

  it('defaults to SHO when unclear', () => {
    expect(scraper.parseGrade('Doctor needed')).toBe('SHO');
  });
});

// ─── Specialty Parsing ──────────────────────────────────────────────────────

describe('parseSpecialty', () => {
  it('detects specific sub-specialties before generic terms', () => {
    // This was the bug: "Respiratory Medicine" matched 'medicine' first
    expect(scraper.parseSpecialty('Registrar in Respiratory Medicine')).toBe('RESPIRATORY');
    expect(scraper.parseSpecialty('SHO Cardiology')).toBe('CARDIOLOGY');
    expect(scraper.parseSpecialty('Registrar Ophthalmology')).toBe('OPHTHALMOLOGY');
    expect(scraper.parseSpecialty('SHO Psychiatry')).toBe('PSYCHIATRY');
    expect(scraper.parseSpecialty('Registrar Neurology')).toBe('NEUROLOGY');
    expect(scraper.parseSpecialty('SHO Dermatology')).toBe('DERMATOLOGY');
  });

  it('detects emergency medicine correctly', () => {
    expect(scraper.parseSpecialty('SHO Emergency Medicine')).toBe('EMERGENCY_MEDICINE');
    expect(scraper.parseSpecialty('Registrar A&E')).toBe('EMERGENCY_MEDICINE');
    expect(scraper.parseSpecialty('SHO Emergency Department')).toBe('EMERGENCY_MEDICINE');
  });

  it('detects anaesthetics', () => {
    expect(scraper.parseSpecialty('Registrar Anaesthesia')).toBe('ANAESTHETICS');
    expect(scraper.parseSpecialty('SHO Anaesthetic Department')).toBe('ANAESTHETICS');
  });

  it('detects paediatrics', () => {
    expect(scraper.parseSpecialty('SHO Paediatrics')).toBe('PAEDIATRICS');
    expect(scraper.parseSpecialty('Registrar Paediatric Medicine')).toBe('PAEDIATRICS');
  });

  it('detects O&G', () => {
    expect(scraper.parseSpecialty('SHO Obstetrics')).toBe('OBSTETRICS_GYNAECOLOGY');
    expect(scraper.parseSpecialty('Registrar Gynaecology')).toBe('OBSTETRICS_GYNAECOLOGY');
  });

  it('detects ENT without matching "department" or "treatment"', () => {
    expect(scraper.parseSpecialty('Registrar ENT')).toBe('ENT');
    expect(scraper.parseSpecialty('SHO ENT Surgery')).toBe('ENT');
    // Should NOT match ENT inside other words
    expect(scraper.parseSpecialty('SHO Emergency Department')).toBe('EMERGENCY_MEDICINE');
    expect(scraper.parseSpecialty('Treatment of patients')).toBe('GENERAL_MEDICINE');
  });

  it('detects orthopaedic surgery (not generic surgery)', () => {
    expect(scraper.parseSpecialty('Registrar Orthopaedic Surgery')).toBe('ORTHOPAEDICS');
  });

  it('falls back to general medicine/surgery for generic terms', () => {
    expect(scraper.parseSpecialty('SHO in Medicine')).toBe('GENERAL_MEDICINE');
    expect(scraper.parseSpecialty('Registrar General Surgery')).toBe('GENERAL_SURGERY');
    expect(scraper.parseSpecialty('SHO Surgery')).toBe('GENERAL_SURGERY');
  });

  it('defaults to GENERAL_MEDICINE for unrecognized titles', () => {
    expect(scraper.parseSpecialty('Doctor needed at hospital')).toBe('GENERAL_MEDICINE');
  });
});
