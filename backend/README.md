# AcneAI Backend

AI-powered Acne Severity Classification & Prescription System - Backend API

## Features

- 🧠 Multimodal AI Model for acne severity classification
- 🔐 JWT-based authentication
- 📊 PostgreSQL database with SQLAlchemy ORM
- 📝 Prescription generation with bilingual support (English/Telugu)
- 🔔 Medication reminder system
- 🚀 Production-ready with Gunicorn
- 📦 Database migrations with Alembic
- 🐳 Docker support

## Quick Start

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
python init_db.py

# Run migrations
alembic upgrade head

# Start development server
python run.py
```

### Production

```bash
# Using startup script
./start.sh

# Or using Gunicorn directly
gunicorn app.main:app -c gunicorn_config.py
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/me` - Update user profile
- `POST /api/v1/auth/logout` - Logout

### Diagnosis
- `POST /api/v1/diagnosis/analyze` - Analyze skin image
- `GET /api/v1/diagnosis/{id}` - Get diagnosis by ID
- `GET /api/v1/diagnosis/` - List all diagnoses

### Prescription
- `POST /api/v1/prescription/generate` - Generate prescription
- `GET /api/v1/prescription/{id}` - Get prescription by ID
- `GET /api/v1/prescription/` - List all prescriptions

### Reminders
- `POST /api/v1/reminders/` - Create reminder
- `GET /api/v1/reminders/{id}` - Get reminder by ID
- `GET /api/v1/reminders/` - List all reminders
- `PUT /api/v1/reminders/{id}/acknowledge` - Acknowledge reminder

### Health & Info
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/v1/info` - API information

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key (use a secure random string)
- `ENVIRONMENT` - `development` or `production`
- `CORS_ORIGINS` - Comma-separated list of allowed origins

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current
```

## Docker Deployment

```bash
# Build image
docker build -t acneai-backend .

# Run container
docker run -d \
  --name acneai-backend \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  acneai-backend
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions.

## Project Structure

```
backend/
├── app/
│   ├── api/              # API routes
│   ├── core/             # Core utilities (config, database, logging)
│   ├── ml/               # ML models
│   ├── models/           # Database models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   └── main.py           # FastAPI application
├── alembic/              # Database migrations
├── uploads/               # Uploaded images
├── gunicorn_config.py     # Gunicorn configuration
├── start.sh               # Production startup script
├── Dockerfile             # Docker configuration
└── requirements.txt        # Python dependencies
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- File upload size limits
- Input validation

## Monitoring

- Health check endpoint: `/health`
- Structured logging
- Request timing headers
- Error tracking

## License

Proprietary - All rights reserved

