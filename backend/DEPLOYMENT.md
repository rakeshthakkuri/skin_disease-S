# AcneAI Backend - Production Deployment Guide

This guide covers deploying the AcneAI backend to production environments.

## Prerequisites

- Python 3.11+
- PostgreSQL database (Supabase or self-hosted)
- Gunicorn (included in requirements.txt)
- Environment variables configured

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
SECRET_KEY=your-very-secure-random-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=43200  # 30 days

# CORS (comma-separated)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server
HOST=0.0.0.0
PORT=8000

# Security
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# File Uploads
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads
```

### Generating a Secure Secret Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Database Setup

### 1. Initialize Database

```bash
cd backend
python init_db.py
```

### 2. Run Migrations

```bash
# Create initial migration (if needed)
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

## Installation

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Verify Installation

```bash
python -c "from app.main import app; print('✅ App imports successfully')"
```

## Running in Production

### Option 1: Using Gunicorn (Recommended)

```bash
# Using the startup script
./start.sh

# Or directly
gunicorn app.main:app -c gunicorn_config.py
```

### Option 2: Using Docker

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

### Option 3: Using Systemd (Linux)

Create `/etc/systemd/system/acneai.service`:

```ini
[Unit]
Description=AcneAI Backend
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn app.main:app -c gunicorn_config.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable acneai
sudo systemctl start acneai
```

## Deployment Platforms

### Heroku

1. Create `Procfile`:
```
web: gunicorn app.main:app -c gunicorn_config.py
```

2. Deploy:
```bash
heroku create acneai-backend
heroku config:set DATABASE_URL=your_database_url
heroku config:set SECRET_KEY=your_secret_key
git push heroku main
```

### Railway

1. Connect your repository
2. Set environment variables in Railway dashboard
3. Railway will auto-detect and deploy

### DigitalOcean App Platform

1. Connect your repository
2. Configure environment variables
3. Set build command: `pip install -r requirements.txt`
4. Set run command: `gunicorn app.main:app -c gunicorn_config.py`

### AWS EC2 / ECS

1. Use Docker deployment (see Docker section above)
2. Configure load balancer
3. Set up auto-scaling groups
4. Configure security groups for port 8000

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:8000/health
```

### Logs

Logs are output to stdout/stderr. Configure your deployment platform to capture these:

- **Docker**: `docker logs acneai-backend`
- **Systemd**: `journalctl -u acneai -f`
- **Heroku**: `heroku logs --tail`

## Security Checklist

- [ ] Change `SECRET_KEY` to a secure random value
- [ ] Set `ENVIRONMENT=production`
- [ ] Set `DEBUG=false`
- [ ] Configure `CORS_ORIGINS` with your actual domains
- [ ] Use HTTPS in production
- [ ] Set up firewall rules
- [ ] Enable database SSL connections
- [ ] Regularly update dependencies
- [ ] Set up log monitoring
- [ ] Configure rate limiting (if needed)
- [ ] Set up backup strategy for database

## Performance Tuning

### Gunicorn Workers

Adjust in `gunicorn_config.py` or via environment:

```bash
export WORKERS=4  # Typically 2-4 x CPU cores
```

### Database Connection Pool

Configured in `app/core/database.py`:
- `pool_size=10`
- `max_overflow=20`

### File Upload Limits

Configure `MAX_UPLOAD_SIZE` in `.env` (default: 10MB)

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
python -c "from app.core.database import engine; engine.connect()"
```

### Migration Issues

```bash
# Check current revision
alembic current

# Show migration history
alembic history

# Rollback if needed
alembic downgrade -1
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

## Backup and Recovery

### Database Backup

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### File Uploads Backup

```bash
# Backup uploads directory
tar -czf uploads_backup.tar.gz uploads/
```

## Updates and Maintenance

1. Pull latest code
2. Install new dependencies: `pip install -r requirements.txt`
3. Run migrations: `alembic upgrade head`
4. Restart service: `systemctl restart acneai` or redeploy

## Support

For issues or questions, check:
- Application logs
- Health check endpoint: `/health`
- API info endpoint: `/api/v1/info`

