import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

// Initialize Gemini AI
const genAI = config.geminiApiKey 
  ? new GoogleGenerativeAI(config.geminiApiKey)
  : null;

/**
 * Generate prescription using Gemini API based on severity and type
 */
export async function generatePrescriptionWithGemini(
  severity: string,
  lesionCounts: Record<string, number>,
  clinicalMetadata: Record<string, any> = {},
  additionalNotes?: string,
  acneType?: string | null
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

  const acneTypeLabels: Record<string, string> = {
    Pustula: 'Pustule (inflammatory acne with pus-filled lesions)',
    blackhead: 'Blackhead (open comedone)',
    cysts: 'Cystic acne (deep, painful, pus-filled lesions)',
    nodules: 'Nodular acne (large, hard, painful bumps under the skin)',
    papules: 'Papular acne (small, raised, red bumps)',
    whitehead: 'Whitehead (closed comedone)',
  };

  // Format lesion counts with proper labels
  const lesionInfo = Object.entries(lesionCounts)
    .filter(([, count]) => count > 0) // Only show non-zero counts
    .map(([type, count]) => {
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      return `${label}: ${count}`;
    })
    .join(', ') || 'No lesions detected';

  const allergies = clinicalMetadata.allergies 
    ? `Known allergies: ${Array.isArray(clinicalMetadata.allergies) ? clinicalMetadata.allergies.join(', ') : clinicalMetadata.allergies}`
    : 'No known allergies';

  // Build comprehensive diagnosis information
  let diagnosisInfo = `**Diagnosis Summary:**
- **Severity Level:** ${severityLabels[severity] || severity}`;

  if (acneType) {
    const typeDescription = acneTypeLabels[acneType] || acneType;
    diagnosisInfo += `\n- **Primary Acne Type:** ${typeDescription}`;
  }

  diagnosisInfo += `\n- **Lesion Distribution:** ${lesionInfo}`;

  // Add clinical context
  const clinicalContext: string[] = [];
  if (clinicalMetadata.acne_duration_months) {
    clinicalContext.push(`Acne duration: ${clinicalMetadata.acne_duration_months} months`);
  }
  if (clinicalMetadata.previous_treatments) {
    const prevTreatments = Array.isArray(clinicalMetadata.previous_treatments) 
      ? clinicalMetadata.previous_treatments.join(', ')
      : clinicalMetadata.previous_treatments;
    clinicalContext.push(`Previous treatments: ${prevTreatments}`);
  }
  if (clinicalMetadata.skin_type) {
    clinicalContext.push(`Skin type: ${clinicalMetadata.skin_type}`);
  }

  // Build treatment guidelines based on acne type
  let treatmentGuidelines = '';
  if (acneType) {
    const typeDescription = acneTypeLabels[acneType] || acneType;
    treatmentGuidelines += `- The patient has ${typeDescription} type acne, which requires specific treatment approaches:\n`;
    
    if (acneType === 'Pustula' || acneType === 'pustules') {
      treatmentGuidelines += '  • Focus on anti-inflammatory and antibacterial treatments (e.g., benzoyl peroxide, topical antibiotics)\n';
    } else if (acneType === 'blackhead' || acneType === 'whitehead') {
      treatmentGuidelines += '  • Focus on comedolytic treatments (e.g., salicylic acid, retinoids) to unclog pores\n';
    } else if (acneType === 'cysts' || acneType === 'nodules') {
      treatmentGuidelines += '  • Requires aggressive treatment with oral medications (e.g., isotretinoin, oral antibiotics) and may need dermatologist referral\n';
    } else if (acneType === 'papules') {
      treatmentGuidelines += '  • Focus on anti-inflammatory treatments and gentle exfoliation\n';
    }
  }
  
  treatmentGuidelines += `- For ${severityLabels[severity] || severity} severity acne, follow evidence-based treatment protocols\n`;
  treatmentGuidelines += '- Consider patient allergies when recommending medications\n';
  treatmentGuidelines += '- Provide age-appropriate dosages and clear instructions';

  const patientInfo = `**Patient Information:**
- ${allergies}${clinicalContext.length > 0 ? `\n- ${clinicalContext.join('\n- ')}` : ''}${additionalNotes ? `\n- **Additional Notes:** ${additionalNotes}` : ''}`;

  const severityText = severityLabels[severity] || severity;
  const acneTypeText = acneType ? `${acneType} type and ` : '';

  const prompt = `You are an experienced dermatologist AI assistant. Generate a comprehensive, evidence-based medical prescription for acne treatment based on the following diagnosis:

${diagnosisInfo}

${patientInfo}

**Treatment Guidelines:**
${treatmentGuidelines}

**Required Output Format (JSON only):**
{
  "medications": [
    {
      "name": "Medication name (generic and brand if applicable)",
      "type": "topical or oral",
      "dosage": "Specific dosage (e.g., '2.5%', '100mg', 'pea-sized amount')",
      "frequency": "How often to take/apply (e.g., 'Once daily at night', 'Twice daily with meals')",
      "duration": "Duration of treatment (e.g., '8 weeks', '3 months', 'Until improvement')",
      "instructions": "Detailed step-by-step instructions for use",
      "warnings": ["Warning 1", "Warning 2", "e.g., 'May cause dryness', 'Avoid sun exposure', 'Not for pregnancy'"]
    }
  ],
  "lifestyleRecommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2"
  ],
  "followUpInstructions": "Specific follow-up timeline and what to monitor (e.g., 'Follow-up in 6-8 weeks. Monitor for improvement and side effects. Contact healthcare provider if condition worsens.')",
  "reasoning": "Brief medical reasoning explaining why this specific treatment plan was chosen based on the diagnosis"
}

**Important Requirements:**
1. Tailor medications specifically to the ${acneTypeText}${severityText} severity
2. ${severity === 'severe' || severity === 'very_severe' ? 'Include oral medications as severity warrants. Consider referral to dermatologist for very severe cases.' : 'Start with topical treatments. Consider oral medications only if topical treatments are insufficient.'}
3. Provide specific, measurable dosages and frequencies
4. Include all relevant warnings and contraindications
5. Make lifestyle recommendations specific and actionable
6. Set clear follow-up expectations based on severity
7. Ensure all recommendations are evidence-based, safe, and appropriate for the patient's condition
8. Consider the acne type when selecting treatments (comedonal vs inflammatory vs cystic)

Return ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text outside the JSON structure.`;

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

