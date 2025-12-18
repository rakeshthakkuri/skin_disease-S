# Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running and database created
- [ ] Environment variables configured (`.env` file)
- [ ] ONNX models converted (run conversion script)

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings:
# - DATABASE_URL (PostgreSQL connection string)
# - SECRET_KEY (JWT secret)
# - PORT (default: 8000)
```

### 3. Convert PyTorch Models to ONNX
```bash
# From project root
python backend-node/scripts/convert-models-to-onnx.py

# This will convert models from ../model/*.pth to model/*.onnx
```

### 4. Build TypeScript
```bash
npm run build
```

### 5. Start Server

**Development (with hot reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## Verify Installation

1. **Check health endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test registration:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "test123",
       "full_name": "Test User"
     }'
   ```

## Common Issues

### Database Connection Error
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Database `acneai` must exist

### Model Not Found
- Run the ONNX conversion script
- Check that `model/*.onnx` files exist
- Verify model paths in `src/services/ml/inference.ts`

### Port Already in Use
- Change `PORT` in `.env`
- Or stop the process using port 8000

## API Documentation

See `README.md` for full API endpoint documentation.

