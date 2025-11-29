# AcneAI - Acne Severity Classification & Prescription System

A minimal AI-powered application for acne diagnosis, prescription generation, and medication reminders.

## 🎯 Features

- **AI Image Analysis** - Upload skin images for severity classification
- **Prescription Generation** - Evidence-based treatment recommendations
- **Bilingual Support** - English and Telugu translations
- **Medication Reminders** - Track treatment adherence

## 📁 Project Structure

```
Skin disease/
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── api/           # API Endpoints
│   │   │   ├── diagnosis.py
│   │   │   ├── prescription.py
│   │   │   └── reminders.py
│   │   ├── ml/            # ML Models
│   │   │   ├── acne_classifier.py
│   │   │   ├── multimodal_fusion.py
│   │   │   ├── nlp_prescriber.py
│   │   │   └── translator.py
│   │   └── main.py
│   ├── requirements.txt
│   └── run.py
│
├── frontend/              # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Diagnosis.tsx
│   │   │   ├── Prescriptions.tsx
│   │   │   └── Reminders.tsx
│   │   ├── components/
│   │   ├── layouts/
│   │   └── lib/
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python run.py
```

API runs at `http://localhost:8000`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

App runs at `http://localhost:3000`

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/v1/diagnosis/analyze` | POST | Analyze skin image |
| `GET /api/v1/diagnosis/` | GET | List all diagnoses |
| `POST /api/v1/prescription/generate` | POST | Generate prescription |
| `GET /api/v1/prescription/` | GET | List prescriptions |
| `POST /api/v1/prescription/translate` | POST | Translate prescription |
| `POST /api/v1/reminders/create` | POST | Create reminder |
| `GET /api/v1/reminders/` | GET | List reminders |

## 🧠 ML Models

1. **Acne Classifier** - EfficientNet-B0 based CNN for severity classification
2. **Multimodal Fusion** - Combines image features with clinical metadata
3. **NLP Prescriber** - Rule-based prescription generation
4. **Translator** - English-Telugu medical term translation

## ⚠️ Note

This is a minimal prototype for educational purposes. Not intended for clinical use.
