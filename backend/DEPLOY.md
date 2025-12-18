# Backend Deployment Guide - Fly.io

This guide will help you deploy the AcneAI backend to Fly.io.

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly.io CLI**: Install the Fly.io CLI
3. **PostgreSQL Database**: Set up a PostgreSQL database (Fly.io Postgres, Supabase, or other)
4. **Environment Variables**: Prepare your API keys and secrets

## Step 1: Install Fly.io CLI

```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Or using Homebrew (macOS)
brew install flyctl

# Verify installation
fly version
```

## Step 2: Login to Fly.io

```bash
fly auth login
```

This will open a browser for authentication.

## Step 3: Initialize the App (First Time Only)

If you haven't initialized the app yet:

```bash
cd backend
fly launch
```

When prompted:
- **App name**: Use `acneai-backend` (or your preferred name)
- **Region**: Choose closest to your users (e.g., `bom` for Mumbai, `iad` for US East)
- **PostgreSQL**: You can create one here or use an existing database
- **Redis**: Not needed for this app
- **Deploy now**: Choose "No" - we'll set secrets first

## Step 4: Set Environment Variables (Secrets)

Set all required secrets:

```bash
# Generate a secure secret key
fly secrets set SECRET_KEY=$(openssl rand -base64 32)

# Set your Gemini API key
fly secrets set GEMINI_API_KEY=your-gemini-api-key-here

# Set your database URL
fly secrets set DATABASE_URL=postgresql://user:password@host:port/database

# Set CORS origins (your frontend URL)
fly secrets set CORS_ORIGINS=https://your-frontend.onrender.com,https://your-frontend-domain.com

# Optional: Set other environment variables
fly secrets set LOG_LEVEL=INFO
fly secrets set MAX_UPLOAD_SIZE=10485760  # 10MB in bytes
```

**View all secrets:**
```bash
fly secrets list
```

**Important**: Never commit secrets to git! Always use `fly secrets set`.

## Step 5: Verify Model Files

Ensure all ONNX model files are in the `backend/model/` directory:

```bash
cd backend
ls -lh model/*.onnx
```

Required models:
- `acne_binary_efficientnet_b0_best.onnx` (or alternative)
- `acne_severity_efficientnet_b0_best.onnx` (or alternative)
- `acne_type_best.onnx` ✅ **Required for type classification**

## Step 6: Deploy the Application

```bash
# From the backend directory
fly deploy
```

This will:
1. Build the Docker image using `Dockerfile.fly`
2. Copy model files into the image
3. Deploy to Fly.io
4. Start the application

## Step 7: Verify Deployment

```bash
# Check app status
fly status

# View logs
fly logs

# Check health endpoint
fly curl /health
```

## Step 8: Initialize Database

After first deployment, initialize the database schema:

```bash
# SSH into the app
fly ssh console

# Inside the container, run:
npm run setup:db

# Create a doctor user (optional)
npm run create:doctor
```

Or run migrations if you have them set up.

## Step 9: Test the Deployment

```bash
# Get your app URL
fly info

# Test health endpoint
curl https://acneai-backend.fly.dev/health

# Test API endpoint (with authentication)
curl https://acneai-backend.fly.dev/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Configuration

### Memory and CPU

The current configuration in `fly.toml`:
- **Memory**: 1024MB (1GB) - increased for ML models
- **CPU**: 1 shared CPU
- **Region**: `bom` (Mumbai)

To change memory:
```bash
# Edit fly.toml
memory_mb = 2048  # Increase if needed

# Or scale via CLI
fly scale memory 2048
```

### Auto-scaling

The app is configured with:
- `auto_stop_machines = true` - Stops when idle
- `auto_start_machines = true` - Starts on request
- `min_machines_running = 0` - No machines running when idle

To keep at least 1 machine running:
```toml
min_machines_running = 1
```

### Persistent Storage (Optional)

For file uploads, create a volume:

```bash
# Create volume (3GB, adjust size as needed)
fly volumes create uploads_data --size 3 --region bom

# Uncomment in fly.toml:
# [[mounts]]
#   source = "uploads_data"
#   destination = "/app/uploads"
```

Then redeploy:
```bash
fly deploy
```

## Monitoring

### View Logs

```bash
# Real-time logs
fly logs

# Follow logs
fly logs -a acneai-backend

# Filter logs
fly logs | grep ERROR
```

### Check Metrics

```bash
# App status
fly status

# Metrics dashboard
fly dashboard
```

### Health Checks

The app has a health check endpoint at `/health` that:
- Checks server status
- Returns uptime and memory usage
- Used by Fly.io for auto-scaling

## Troubleshooting

### App Won't Start

```bash
# Check logs
fly logs

# Check status
fly status

# SSH into app
fly ssh console
```

Common issues:
- **Missing secrets**: Check `fly secrets list`
- **Database connection**: Verify `DATABASE_URL`
- **Model files missing**: Check `model/` directory in Docker image
- **Out of memory**: Increase `memory_mb` in `fly.toml`

### Models Not Loading

```bash
# SSH into app
fly ssh console

# Check if models exist
ls -lh /app/model/

# Check logs for model loading errors
fly logs | grep -i model
```

### Database Connection Issues

```bash
# Verify DATABASE_URL secret
fly secrets list | grep DATABASE_URL

# Test connection (if using Fly.io Postgres)
fly postgres connect -a your-db-app-name
```

### Increase Resources

If the app is slow or running out of memory:

```bash
# Increase memory
fly scale memory 2048

# Or edit fly.toml
memory_mb = 2048
```

## Updating the Deployment

To update the app after making changes:

```bash
# Make your code changes
# ...

# Build and deploy
fly deploy

# Or deploy with specific options
fly deploy --remote-only  # Skip local Docker build
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SECRET_KEY` | ✅ Yes | JWT secret key | Generated with `openssl rand -base64 32` |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key | `AIza...` |
| `CORS_ORIGINS` | ✅ Yes | Allowed frontend origins | `https://app.example.com` |
| `ENVIRONMENT` | No | Environment name | `production` (default) |
| `LOG_LEVEL` | No | Logging level | `INFO` (default) |
| `MAX_UPLOAD_SIZE` | No | Max file upload size | `10485760` (10MB) |

## Cost Optimization

- **Auto-stop/start**: Machines stop when idle (saves costs)
- **Shared CPU**: More cost-effective than dedicated
- **Min machines = 0**: No machines running when idle

## Security Checklist

- ✅ Secrets stored in Fly.io secrets (not in code)
- ✅ HTTPS enforced (`force_https = true`)
- ✅ CORS configured with specific origins
- ✅ Rate limiting enabled (in production)
- ✅ Health checks configured
- ✅ Non-root user in Docker image

## Next Steps

1. Set up monitoring/alerts
2. Configure custom domain (optional)
3. Set up CI/CD for automatic deployments
4. Configure backups for database
5. Set up log aggregation (optional)

## Resources

- [Fly.io Documentation](https://fly.io/docs)
- [Fly.io Community](https://community.fly.io)
- [Fly.io Status](https://status.fly.io)

## Quick Reference Commands

```bash
# Deploy
fly deploy

# View logs
fly logs

# Check status
fly status

# SSH into app
fly ssh console

# Set secret
fly secrets set KEY=value

# List secrets
fly secrets list

# Scale memory
fly scale memory 2048

# Open dashboard
fly dashboard
```

