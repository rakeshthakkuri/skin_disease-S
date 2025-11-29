"""
Bilingual Translator - Minimal Version

English-Telugu translation for prescriptions.
"""

from typing import Dict, List

# Medical terms dictionary
TERMS_EN_TE = {
    "apply": "రాయండి",
    "take": "తీసుకోండి",
    "daily": "రోజూ",
    "twice daily": "రోజుకు రెండుసార్లు",
    "once daily": "రోజుకు ఒకసారి",
    "at night": "రాత్రి",
    "morning": "ఉదయం",
    "with food": "ఆహారంతో",
    "weeks": "వారాలు",
    "months": "నెలలు",
    "thin layer": "పలుచని పొర",
    "affected areas": "ప్రభావిత ప్రాంతాలు",
    "cleansing": "శుభ్రం చేయడం",
    "avoid sun": "ఎండలో వెళ్ళకండి",
    "sunscreen": "సన్‌స్క్రీన్",
    "moisturizer": "మాయిశ్చరైజర్",
    "medication": "మందు",
    "dosage": "మోతాదు",
    "warnings": "హెచ్చరికలు",
    "follow-up": "అనుసరణ",
}


class BilingualTranslator:
    """Simple English-Telugu translator for medical terms."""
    
    def __init__(self):
        print("✅ Translator initialized")
    
    def translate_text(self, text: str, target_language: str) -> str:
        """Translate text to target language."""
        if target_language == "en":
            return text
        
        # Simple word replacement for Telugu
        translated = text.lower()
        for en, te in TERMS_EN_TE.items():
            translated = translated.replace(en.lower(), te)
        
        return translated
    
    def translate_prescription(
        self,
        medications: List[Dict],
        recommendations: List[str],
        instructions: str,
        target_language: str
    ) -> Dict:
        """Translate complete prescription."""
        
        if target_language == "en":
            return {
                "medications": medications,
                "lifestyle_recommendations": recommendations,
                "follow_up_instructions": instructions,
                "language": "en",
                "language_name": "English"
            }
        
        # Translate to Telugu
        translated_meds = []
        for med in medications:
            translated_meds.append({
                "name": med["name"],  # Keep medicine names in English
                "name_original": med["name"],
                "type": "టాపికల్" if med["type"] == "topical" else "ఓరల్",
                "dosage": self.translate_text(med.get("dosage", ""), "te"),
                "frequency": self.translate_text(med.get("frequency", ""), "te"),
                "duration": self.translate_text(med.get("duration", ""), "te"),
                "instructions": self.translate_text(med.get("instructions", ""), "te"),
                "warnings": [self.translate_text(w, "te") for w in med.get("warnings", [])]
            })
        
        return {
            "medications": translated_meds,
            "lifestyle_recommendations": [self.translate_text(r, "te") for r in recommendations],
            "follow_up_instructions": self.translate_text(instructions, "te"),
            "language": "te",
            "language_name": "తెలుగు"
        }
