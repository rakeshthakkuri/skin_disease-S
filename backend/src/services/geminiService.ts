import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

// Initialize Gemini AI
const genAI = config.geminiApiKey 
  ? new GoogleGenerativeAI(config.geminiApiKey)
  : null;

/**
 * Generate prescription using Gemini API based on severity
 */
export async function generatePrescriptionWithGemini(
  severity: string,
  lesionCounts: Record<string, number>,
  clinicalMetadata: Record<string, any> = {},
  additionalNotes?: string
): Promise<{
  medications: any[];
  lifestyleRecommendations: string[];
  followUpInstructions: string;
  reasoning: string;
}> {
  if (!genAI) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.');
  }

  // Use gemini-2.5-flash for faster responses
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Build prompt with severity and context
  const severityLabels: Record<string, string> = {
    clear: 'Clear (no acne)',
    mild: 'Mild',
    moderate: 'Moderate',
    severe: 'Severe',
    very_severe: 'Very Severe',
  };

  const lesionInfo = Object.entries(lesionCounts)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ');

  const allergies = clinicalMetadata.allergies 
    ? `Known allergies: ${Array.isArray(clinicalMetadata.allergies) ? clinicalMetadata.allergies.join(', ') : clinicalMetadata.allergies}`
    : 'No known allergies';

  const prompt = `You are a dermatologist AI assistant. Generate a medical prescription for acne treatment based on the following information:

**Acne Severity:** ${severityLabels[severity] || severity}
**Lesion Counts:** ${lesionInfo || 'Not specified'}
**Patient Information:** ${allergies}
${additionalNotes ? `**Additional Notes:** ${additionalNotes}` : ''}

Please generate a comprehensive prescription in the following JSON format:
{
  "medications": [
    {
      "name": "Medication name",
      "type": "topical or oral",
      "dosage": "Dosage information",
      "frequency": "How often to take/apply",
      "duration": "Duration of treatment",
      "instructions": "Detailed instructions",
      "warnings": ["Warning 1", "Warning 2"]
    }
  ],
  "lifestyleRecommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "followUpInstructions": "When to follow up and what to monitor",
  "reasoning": "Brief explanation of why this prescription was chosen"
}

Important guidelines:
- For ${severity} acne, recommend appropriate treatments based on medical guidelines
- Include both topical and oral medications if severity warrants it
- Provide clear dosage, frequency, and duration
- Include relevant warnings and precautions
- Suggest lifestyle modifications
- Provide specific follow-up instructions
- Ensure all recommendations are evidence-based and safe

Return ONLY valid JSON, no additional text or markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const prescriptionData = JSON.parse(jsonText);

    // Validate and structure the response
    return {
      medications: Array.isArray(prescriptionData.medications) 
        ? prescriptionData.medications 
        : [],
      lifestyleRecommendations: Array.isArray(prescriptionData.lifestyleRecommendations)
        ? prescriptionData.lifestyleRecommendations
        : [],
      followUpInstructions: prescriptionData.followUpInstructions || 'Follow up as needed.',
      reasoning: prescriptionData.reasoning || `Prescription generated for ${severity} acne severity.`,
    };
  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    // Fallback to basic prescription if API fails
    throw new Error(`Failed to generate prescription with Gemini: ${error.message}`);
  }
}

