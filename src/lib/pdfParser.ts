/**
 * PDF Parser for HSE Job Specifications
 * Extracts key information from HSE NCHD job spec PDFs
 */

interface ParsedJobSpec {
  informalEnquiriesEmail?: string;
  informalEnquiriesName?: string;
  closingDate?: string;
  clinicalLead?: string;
  rotationalDetail?: string;
  rawText?: string;
}

/**
 * Extract email addresses from text
 */
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

/**
 * Extract contact name near "Informal Enquiries" section
 */
function extractInformalEnquiriesContact(text: string): {
  name?: string;
  email?: string;
} {
  // Look for patterns like:
  // "Informal Enquiries: Dr. John Smith (john.smith@hse.ie)"
  // "For informal enquiries contact: Dr. Mary Jones at mary.jones@hse.ie"

  const informalSection = text.match(
    /informal\s+enquir(?:y|ies)[\s:]+(.{0,200})/i
  );

  if (!informalSection) return {};

  const sectionText = informalSection[1];
  const emails = extractEmails(sectionText);
  const email = emails[0];

  // Extract name (typically before email or after "Dr." or "Mr." or "Ms.")
  const namePatterns = [
    /(?:Dr\.?|Mr\.?|Ms\.?|Prof\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
    /contact:?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+at\s+|,\s*|\s+\()/,
  ];

  let name: string | undefined;
  for (const pattern of namePatterns) {
    const match = sectionText.match(pattern);
    if (match) {
      name = match[1].trim();
      break;
    }
  }

  return { name, email };
}

/**
 * Extract closing date from text
 */
function extractClosingDate(text: string): string | undefined {
  // Look for patterns like:
  // "Closing Date: 15th April 2026"
  // "Applications close: 15/04/2026 at 17:00"
  // "Deadline: 15.04.2026"

  const datePatterns = [
    /closing\s+date[\s:]+(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})/i,
    /deadline[\s:]+(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})/i,
    /applications?\s+close[\s:]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /(?:before|by)[\s:]+(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Extract clinical lead/consultant information
 */
function extractClinicalLead(text: string): string | undefined {
  const leadPatterns = [
    /clinical\s+lead[\s:]+(?:Dr\.?|Prof\.?|Mr\.?|Ms\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /consultant[\s:]+(?:Dr\.?|Prof\.?|Mr\.?|Ms\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /under\s+(?:Dr\.?|Prof\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  ];

  for (const pattern of leadPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].replace(/clinical\s+lead[\s:]+|consultant[\s:]+|under\s+/i, '').trim();
    }
  }

  return undefined;
}

/**
 * Extract rotational details (months in each specialty)
 */
function extractRotationalDetail(text: string): string | undefined {
  // Look for patterns like:
  // "6 months Cardiology / 6 months Respiratory"
  // "3 months in each: Cardiology, Respiratory, Gastroenterology, Rheumatology"
  // "Rotation includes: 4 months Medical Oncology, 2 months Haematology"

  const rotationPatterns = [
    /rotation(?:al)?\s+detail[\s:]+(.{20,150})/i,
    /(\d+\s+months?\s+\w+(?:\s+\w+)?(?:\s*[/,]\s*\d+\s+months?\s+\w+(?:\s+\w+)?)+)/i,
    /rotation\s+includes?[\s:]+(.{20,150})/i,
  ];

  for (const pattern of rotationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim().split('\n')[0]; // Take first line only
    }
  }

  return undefined;
}

/**
 * Parse HSE Job Spec PDF text
 * In production, this would be called after fetching and extracting text from PDF
 */
export function parseJobSpecText(pdfText: string): ParsedJobSpec {
  const normalizedText = pdfText.replace(/\s+/g, ' ').trim();

  const contact = extractInformalEnquiriesContact(normalizedText);
  const closingDate = extractClosingDate(normalizedText);
  const clinicalLead = extractClinicalLead(normalizedText);
  const rotationalDetail = extractRotationalDetail(normalizedText);

  return {
    informalEnquiriesEmail: contact.email,
    informalEnquiriesName: contact.name,
    closingDate,
    clinicalLead,
    rotationalDetail,
    rawText: pdfText,
  };
}

/**
 * Fetch and parse PDF from URL using an LLM API
 * This is a placeholder for the actual implementation
 * In production, you would:
 * 1. Fetch the PDF
 * 2. Convert to text (using pdf-parse or similar)
 * 3. Send to Claude/Gemini API with a structured prompt
 * 4. Parse the LLM response
 */
export async function fetchAndParsePDF(pdfUrl: string): Promise<ParsedJobSpec> {
  // TODO: Implement with actual PDF fetching and LLM parsing
  // For now, return a mock implementation

  try {
    // Step 1: Fetch PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    // Step 2: Convert PDF to text (you'll need to add pdf-parse or similar)
    // const pdfBuffer = await response.arrayBuffer();
    // const pdfText = await extractTextFromPDF(pdfBuffer);

    // Step 3: Parse with LLM (optional but recommended for HSE PDFs)
    // const llmResult = await parseWithLLM(pdfText);

    // For now, return empty result
    return {
      informalEnquiriesEmail: undefined,
      informalEnquiriesName: undefined,
      closingDate: undefined,
      clinicalLead: undefined,
      rotationalDetail: undefined,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

/**
 * Parse PDF using Claude API (premium option for better accuracy)
 * Requires ANTHROPIC_API_KEY environment variable
 */
export async function parseWithClaude(pdfText: string): Promise<ParsedJobSpec> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const prompt = `
Extract the following information from this HSE NCHD job specification:

1. Informal Enquiries Email (the email address for informal questions)
2. Informal Enquiries Name (the person to contact)
3. Closing Date (application deadline)
4. Clinical Lead (consultant or clinical lead name)
5. Rotational Detail (breakdown of time in each subspecialty, if mentioned)

Return the information in JSON format with these exact keys:
{
  "informalEnquiriesEmail": "email@hse.ie or null",
  "informalEnquiriesName": "Dr. Name or null",
  "closingDate": "date string or null",
  "clinicalLead": "Dr. Name or null",
  "rotationalDetail": "rotation description or null"
}

Job Specification Text:
${pdfText}
  `;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fastest, cheapest for this task
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const textContent = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Could not parse JSON from Claude response');
  } catch (error) {
    console.error('Error using Claude API:', error);
    // Fallback to regex parsing
    return parseJobSpecText(pdfText);
  }
}

/**
 * Example usage:
 *
 * const pdfUrl = 'https://www.hse.ie/eng/staff/jobs/jobspecs/medical/12345.pdf';
 * const parsed = await fetchAndParsePDF(pdfUrl);
 * console.log(parsed.informalEnquiriesEmail);
 */
