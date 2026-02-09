/**
 * Email Template Generator for Informal Enquiries
 * Generates professional email templates for contacting consultants
 */

import type { Job } from '@/types/database.types';

export interface EmailTemplateParams {
  recipientName?: string;
  recipientEmail: string;
  jobTitle: string;
  hospitalName: string;
  specialty: string;
  applicationDeadline: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Generate a professional informal enquiry email template
 *
 * @param params - Email template parameters
 * @returns Object with subject and body
 */
export function generateInformalEnquiryEmail(params: EmailTemplateParams): {
  subject: string;
  body: string;
  mailto: string;
} {
  const {
    recipientName,
    recipientEmail,
    jobTitle,
    hospitalName,
    specialty,
    applicationDeadline,
    userName = '[Your Name]',
    userEmail = '[Your Email]',
  } = params;

  const greeting = recipientName ? `Dear ${recipientName}` : 'Dear Consultant';

  const deadlineDate = new Date(applicationDeadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subject = `Informal Enquiry - ${jobTitle}`;

  const body = `${greeting},

I hope this email finds you well. I am writing to make an informal enquiry about the ${jobTitle} position at ${hospitalName}, with an application deadline of ${formattedDeadline}.

I am a NCHD with a strong interest in ${specialty} and I am very keen to learn more about this post and the department. I would be grateful if you could provide some information about:

• The typical patient case mix and clinical exposure
• The balance between service provision and training opportunities
• The structure of the ${specialty} team and supervision arrangements
• Any research or audit opportunities available

I would also welcome the opportunity to arrange a brief phone call or visit to discuss the post further, if that would be convenient for you.

Thank you very much for your time and consideration. I look forward to hearing from you.

Kind regards,
${userName}
${userEmail}`;

  // Generate mailto link with encoded subject and body
  const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    subject,
    body,
    mailto: mailtoLink,
  };
}

/**
 * Generate email template from Job object
 *
 * @param job - Job object
 * @param userName - Optional user's name
 * @param userEmail - Optional user's email
 * @returns Email template with mailto link
 */
export function generateEmailFromJob(
  job: Job,
  userName?: string,
  userEmail?: string
): { subject: string; body: string; mailto: string } | null {
  // Priority: informal_contact_email > informal_enquiries_email > medical_manpower_email
  const recipientEmail =
    job.informal_contact_email || job.informal_enquiries_email || job.medical_manpower_email;

  if (!recipientEmail) {
    return null; // No contact email available
  }

  return generateInformalEnquiryEmail({
    recipientName: job.informal_enquiries_name || job.clinical_lead,
    recipientEmail,
    jobTitle: job.title,
    hospitalName: job.hospital_name,
    specialty: job.specialty,
    applicationDeadline: job.application_deadline,
    userName,
    userEmail,
  });
}

/**
 * Check if a job has contact information for informal enquiries
 *
 * @param job - Job object
 * @returns True if contact information is available
 */
export function hasContactInfo(job: Job): boolean {
  return !!(
    job.informal_contact_email ||
    job.informal_enquiries_email ||
    job.medical_manpower_email
  );
}

/**
 * Get the best available contact email from a job
 *
 * @param job - Job object
 * @returns Contact email or undefined
 */
export function getBestContactEmail(job: Job): string | undefined {
  return job.informal_contact_email || job.informal_enquiries_email || job.medical_manpower_email;
}

/**
 * Get the contact name for display
 *
 * @param job - Job object
 * @returns Contact name or generic label
 */
export function getContactName(job: Job): string {
  return job.informal_enquiries_name || job.clinical_lead || 'Department';
}
