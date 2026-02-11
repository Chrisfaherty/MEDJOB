// Database types generated from Supabase schema

export type NCHDGrade = 'SHO' | 'REGISTRAR' | 'SPECIALIST_REGISTRAR';

export type SpecialtyType =
  | 'GENERAL_MEDICINE'
  | 'GENERAL_SURGERY'
  | 'EMERGENCY_MEDICINE'
  | 'ANAESTHETICS'
  | 'PAEDIATRICS'
  | 'OBSTETRICS_GYNAECOLOGY'
  | 'PSYCHIATRY'
  | 'RADIOLOGY'
  | 'PATHOLOGY'
  | 'ORTHOPAEDICS'
  | 'CARDIOLOGY'
  | 'RESPIRATORY'
  | 'GASTROENTEROLOGY'
  | 'ENDOCRINOLOGY'
  | 'NEUROLOGY'
  | 'DERMATOLOGY'
  | 'ONCOLOGY'
  | 'UROLOGY'
  | 'ENT'
  | 'OPHTHALMOLOGY'
  | 'OTHER';

export type SchemeType =
  | 'TRAINING_BST'
  | 'TRAINING_HST'
  | 'NON_TRAINING_SERVICE'
  | 'STAND_ALONE';

export type HospitalGroup = 'IEHG' | 'DMHG' | 'RCSI' | 'SAOLTA' | 'SSWHG' | 'MWHG' | 'UL';

export type HospitalTier = 'TOP_TIER' | 'MID_TIER' | 'SAFETY_NET';

export type MatchRating = 'LIKELY_MATCH' | 'COMPETITIVE' | 'REACH';

export type ApplicationStatus =
  | 'NOT_APPLIED'
  | 'APPLIED'
  | 'INTERVIEW_OFFERED'
  | 'SHORTLISTED'
  | 'REJECTED'
  | 'ACCEPTED';

export interface Job {
  id: string;

  // Basic Info
  title: string;
  grade: NCHDGrade;
  specialty: SpecialtyType;
  scheme_type: SchemeType;

  // Hospital/Location
  hospital_id: string;
  hospital_name: string;
  hospital_group: HospitalGroup;
  county: string;

  // Job Details
  start_date: string;
  duration_months?: number;
  rotational_detail?: string;
  contract_type?: string;

  // Application Details
  application_deadline: string;
  application_url?: string;
  job_spec_pdf_url?: string;

  // Contacts
  informal_enquiries_email?: string;
  informal_enquiries_name?: string;
  clinical_lead?: string;
  medical_manpower_email?: string;
  informal_contact_email?: string;

  // Hospital Tier & Match Probability
  historical_centile_tier?: HospitalTier;

  // Source
  source: 'NRS' | 'REZOOMO' | 'HEALTHCARE_JOBS' | 'DIRECT_HOSPITAL';
  external_id?: string;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_scraped_at?: string;
}

export interface UserApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: ApplicationStatus;
  notes?: string;
  interview_date?: string;
  applied_at?: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  preferred_specialties?: SpecialtyType[];
  preferred_hospital_groups?: HospitalGroup[];
  preferred_counties?: string[];
  preferred_scheme_types?: SchemeType[];
  deadline_reminder_hours?: number[];
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScrapingLog {
  id: string;
  source: string;
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  jobs_found?: number;
  jobs_new?: number;
  jobs_updated?: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

// Helper type for jobs with application status
export interface JobWithStatus extends Job {
  user_status?: ApplicationStatus;
  hours_until_deadline?: number;
  match_rating?: MatchRating;
}

// Specialty display names
export const SPECIALTY_LABELS: Record<SpecialtyType, string> = {
  GENERAL_MEDICINE: 'General Medicine',
  GENERAL_SURGERY: 'General Surgery',
  EMERGENCY_MEDICINE: 'Emergency Medicine',
  ANAESTHETICS: 'Anaesthetics',
  PAEDIATRICS: 'Paediatrics',
  OBSTETRICS_GYNAECOLOGY: 'Obstetrics & Gynaecology',
  PSYCHIATRY: 'Psychiatry',
  RADIOLOGY: 'Radiology',
  PATHOLOGY: 'Pathology',
  ORTHOPAEDICS: 'Orthopaedics',
  CARDIOLOGY: 'Cardiology',
  RESPIRATORY: 'Respiratory Medicine',
  GASTROENTEROLOGY: 'Gastroenterology',
  ENDOCRINOLOGY: 'Endocrinology',
  NEUROLOGY: 'Neurology',
  DERMATOLOGY: 'Dermatology',
  ONCOLOGY: 'Oncology',
  UROLOGY: 'Urology',
  ENT: 'ENT',
  OPHTHALMOLOGY: 'Ophthalmology',
  OTHER: 'Other',
};

// Grade display names
export const GRADE_LABELS: Record<NCHDGrade, string> = {
  SHO: 'Senior House Officer',
  REGISTRAR: 'Registrar',
  SPECIALIST_REGISTRAR: 'Specialist Registrar',
};

// Scheme type display names
export const SCHEME_TYPE_LABELS: Record<SchemeType, string> = {
  TRAINING_BST: 'Training (BST)',
  TRAINING_HST: 'Training (HST)',
  NON_TRAINING_SERVICE: 'Non-Training (Service)',
  STAND_ALONE: 'Stand-alone',
};

// Hospital Group display names
export const HOSPITAL_GROUP_LABELS: Record<HospitalGroup, string> = {
  IEHG: 'Ireland East',
  DMHG: 'Dublin Midlands',
  RCSI: 'RCSI',
  SAOLTA: 'Saolta',
  SSWHG: 'South/South West',
  MWHG: 'Mid-West',
  UL: 'UL Hospitals',
};

// Hospital Tier display names
export const HOSPITAL_TIER_LABELS: Record<HospitalTier, string> = {
  TOP_TIER: 'Top Tier',
  MID_TIER: 'Mid Tier',
  SAFETY_NET: 'Safety Net',
};

// Match Rating display names and colors
export const MATCH_RATING_CONFIG: Record<
  MatchRating,
  { label: string; color: string; description: string }
> = {
  LIKELY_MATCH: {
    label: 'Likely Match',
    color: 'green',
    description: 'Your centile is above typical cutoff',
  },
  COMPETITIVE: {
    label: 'Competitive',
    color: 'amber',
    description: 'Your centile is within competitive range',
  },
  REACH: {
    label: 'Reach',
    color: 'red',
    description: 'Your centile is below typical cutoff',
  },
};
