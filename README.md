# AcneAI - Acne Severity Classification & Prescription System

A minimal AI-powered application for acne diagnosis, prescription generation, and medication reminders.

## 🎯 Features

- **AI Image Analysis** - Upload skin images for severity classification
- **Prescription Generation** - Evidence-based treatment recommendations
- **Bilingual Support** - English and Telugu translations
- **Medication Reminders** - Track treatment adherence

## 📁 Project Structure

```
Acne detection/
├── backend-node/          # Node.js/Express Backend
│   ├── src/
│   │   ├── routes/       # API Routes
│   │   ├── services/     # Business Logic
│   │   ├── models/       # Database Models
│   │   └── app.ts        # Express App
│   ├── scripts/           # Utility Scripts
│   └── package.json
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

### Backend (Node.js/Express)

```bash
cd backend-node

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run setup:db
npm run reset:db  # Creates tables (development only)

# Run server
npm run dev
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
