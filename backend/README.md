# AcneAI Backend - Node.js/Express

Node.js/Express backend for AcneAI - Acne Severity Classification & Prescription System.

## Features

- 🔐 JWT Authentication
- 🧠 ML Inference (ONNX Runtime) for acne classification
- 📊 Diagnosis & Prescription Management
- 🔔 Medication Reminders
- 🌐 RESTful API

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- ONNX models (converted from PyTorch)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
   Key variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `SECRET_KEY` - JWT secret (use a secure random string)
   - `PORT` - Server port (default: 8000)

3. **Set up database:**
   ```bash
   npm run setup:db
   ```
   This creates the PostgreSQL database if it doesn't exist.

4. **Convert PyTorch models to ONNX:**
   ```bash
   python scripts/convert-models-to-onnx.py
   ```
   This will convert models from `../model/` to `model/*.onnx`

5. **Build TypeScript:**
   ```bash
   npm run build
   ```

6. **Initialize database schema (development only):**
   ```bash
   npm run reset:db
   ```
   This will create all tables. In production, use migrations instead.

## Running

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## API Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/me` - Update current user
- `POST /api/v1/diagnosis/analyze` - Analyze skin image
- `GET /api/v1/diagnosis/:id` - Get diagnosis
- `GET /api/v1/diagnosis` - List diagnoses
- `POST /api/v1/prescription/generate` - Generate prescription
- `GET /api/v1/prescription/:id` - Get prescription
- `GET /api/v1/prescription` - List prescriptions
- `POST /api/v1/prescription/translate` - Translate prescription
- `POST /api/v1/reminders/create` - Create reminder
- `POST /api/v1/reminders` - Create reminder (alternative)
- `GET /api/v1/reminders` - List reminders
- `GET /api/v1/reminders/:id` - Get reminder
- `PUT /api/v1/reminders/:id` - Update reminder
- `DELETE /api/v1/reminders/:id` - Delete reminder
- `POST /api/v1/reminders/:id/acknowledge` - Acknowledge reminder
- `POST /api/v1/reminders/auto-schedule/:prescription_id` - Auto-schedule reminders from prescription

## Project Structure

```
backend-node/
├── src/
│   ├── config/          # Configuration
│   ├── database/        # Database connection & models
│   ├── models/         # TypeORM entities
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── middleware/     # Express middleware
│   ├── utils/          # Utilities
│   └── app.ts          # Main Express app
├── scripts/            # Utility scripts
├── uploads/            # Uploaded images
├── model/              # ONNX models
└── dist/               # Compiled JavaScript
```

## Environment Variables

See `.env.example` for all available environment variables.

## Notes

- ML models must be converted to ONNX format before running
- Database must be set up and migrations run
- Upload directory will be created automatically

