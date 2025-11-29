"""
NLP Prescriber - Minimal Version

Rule-based prescription generation based on acne severity.
"""

from typing import Dict, List, Optional


# Treatment guidelines
TREATMENT_DB = {
    "clear": {
        "topical": ["Gentle cleanser", "Non-comedogenic moisturizer"],
        "oral": [],
        "lifestyle": ["Maintain skincare routine", "Use sunscreen daily"]
    },
    "mild": {
        "topical": [
            {"name": "Benzoyl Peroxide 2.5%", "dosage": "Apply thin layer", "frequency": "Once daily at night", "duration": "8 weeks", "instructions": "Start every other day, increase to daily.", "warnings": ["May bleach fabrics"]},
            {"name": "Salicylic Acid 2%", "dosage": "Apply to affected areas", "frequency": "Twice daily", "duration": "8 weeks", "instructions": "Use as cleanser or leave-on.", "warnings": ["May cause dryness"]}
        ],
        "oral": [],
        "lifestyle": ["Gentle cleansing twice daily", "Avoid touching face", "Use non-comedogenic products"]
    },
    "moderate": {
        "topical": [
            {"name": "Benzoyl Peroxide 5%", "dosage": "Apply thin layer", "frequency": "Once daily at night", "duration": "12 weeks", "instructions": "Apply to affected areas after cleansing.", "warnings": ["May bleach fabrics", "Avoid eye area"]},
            {"name": "Adapalene 0.1%", "dosage": "Apply pea-sized amount", "frequency": "Once daily at night", "duration": "12 weeks", "instructions": "Apply 20 min after washing. Expect initial worsening.", "warnings": ["Avoid sun exposure", "Not for pregnancy"]}
        ],
        "oral": [],
        "lifestyle": ["Gentle cleansing twice daily", "Oil-free products", "Change pillowcases frequently", "Reduce dairy intake"]
    },
    "severe": {
        "topical": [
            {"name": "Benzoyl Peroxide 5%", "dosage": "Apply thin layer", "frequency": "Once daily", "duration": "12 weeks", "instructions": "Apply after cleansing.", "warnings": ["May bleach fabrics"]},
            {"name": "Clindamycin 1%", "dosage": "Apply thin layer", "frequency": "Twice daily", "duration": "8 weeks", "instructions": "Use with benzoyl peroxide.", "warnings": ["Do not use alone long-term"]}
        ],
        "oral": [
            {"name": "Doxycycline 100mg", "dosage": "100mg", "frequency": "Twice daily", "duration": "3 months", "instructions": "Take with food and water.", "warnings": ["Avoid sun", "Not for pregnancy"]}
        ],
        "lifestyle": ["Dermatologist follow-up recommended", "Sun protection critical", "Monitor for side effects"]
    },
    "very_severe": {
        "topical": [
            {"name": "Benzoyl Peroxide 5%", "dosage": "Apply thin layer", "frequency": "Once daily", "duration": "Ongoing", "instructions": "Supportive therapy.", "warnings": ["May bleach fabrics"]}
        ],
        "oral": [
            {"name": "Isotretinoin (Accutane)", "dosage": "As prescribed by specialist", "frequency": "Once daily", "duration": "4-6 months", "instructions": "REQUIRES SPECIALIST. Monthly monitoring.", "warnings": ["Severe birth defects", "Liver monitoring required", "Depression risk"]}
        ],
        "lifestyle": ["MANDATORY dermatologist care", "Monthly blood tests", "Pregnancy prevention required", "No waxing or laser"]
    }
}


class NLPPrescriber:
    """Rule-based prescription generator."""
    
    def __init__(self):
        print("✅ NLP Prescriber initialized")
    
    def generate(
        self,
        severity: str,
        lesion_counts: Dict[str, int],
        clinical_metadata: Optional[Dict] = None,
        additional_notes: Optional[str] = None
    ) -> Dict:
        """Generate prescription based on severity."""
        
        guidelines = TREATMENT_DB.get(severity, TREATMENT_DB["mild"])
        metadata = clinical_metadata or {}
        allergies = metadata.get("allergies", []) or []
        
        # Build medications list
        medications = []
        
        for med in guidelines["topical"]:
            if isinstance(med, dict):
                # Check allergies
                if not any(a.lower() in med["name"].lower() for a in allergies):
                    medications.append({**med, "type": "topical"})
            else:
                medications.append({
                    "name": med,
                    "type": "topical",
                    "dosage": "As directed",
                    "frequency": "Daily",
                    "duration": "Ongoing",
                    "instructions": "Apply as directed.",
                    "warnings": []
                })
        
        for med in guidelines["oral"]:
            if isinstance(med, dict):
                if not any(a.lower() in med["name"].lower() for a in allergies):
                    medications.append({**med, "type": "oral"})
        
        # Generate reasoning
        total_lesions = sum(lesion_counts.values())
        reasoning = f"Based on {severity.upper()} acne severity with {total_lesions} total lesions. "
        reasoning += f"Treatment includes {len(medications)} medication(s) following standard guidelines."
        
        if metadata.get("previous_treatments"):
            reasoning += f" Previous treatments noted: {', '.join(metadata['previous_treatments'])}."
        
        # Follow-up instructions
        follow_up = {
            "clear": "Annual skin check. Return if new lesions appear.",
            "mild": "Follow up in 8-12 weeks to assess response.",
            "moderate": "Follow up in 6-8 weeks. Contact if severe irritation.",
            "severe": "Follow up in 4 weeks. Blood work may be needed.",
            "very_severe": "Close monitoring required. Follow up in 2 weeks."
        }.get(severity, "Follow up in 8 weeks.")
        
        return {
            "medications": medications,
            "lifestyle_recommendations": guidelines["lifestyle"],
            "follow_up_instructions": follow_up,
            "reasoning": reasoning,
            "evidence_references": [
                "AAD Acne Guidelines 2024",
                "Global Alliance to Improve Outcomes in Acne"
            ]
        }
