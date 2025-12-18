# Fly.io Deployment Notes

## Quick Start

```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize app (first time)
fly launch

# Set secrets
fly secrets set SECRET_KEY=$(openssl rand -base64 32)
fly secrets set GEMINI_API_KEY=your-key
fly secrets set DATABASE_URL=postgresql://...
fly secrets set CORS_ORIGINS=https://your-frontend.onrender.com

# Deploy
fly deploy
```

## Important Notes

### Model Files

The ONNX model files need to be available in the `model/` directory. You have two options:

1. **Include in deployment** (recommended for small models):
   - Models are copied during Docker build
   - Ensure `backend/model/*.onnx` files exist before deploying

2. **Use external storage** (for large models):
   - Upload models to S3/Cloud Storage
   - Download on app startup
   - Or use Fly.io volumes

### Persistent Storage

For file uploads, create a volume:

```bash
# Create volume
fly volumes create uploads_data --size 3 --region iad

# Uncomment mount in fly.toml
# [[mounts]]
#   source = "uploads_data"
#   destination = "/app/uploads"
```

### Database Setup

After first deployment:

```bash
# SSH into app
fly ssh console

# Run setup
npm run setup:db
npm run create:doctor
```

### Environment Variables

All sensitive data should be set as Fly.io secrets:

```bash
fly secrets set KEY=value
fly secrets list  # View all secrets
```

Never commit secrets to git!

## Troubleshooting

### App won't start
```bash
fly logs  # Check logs
fly status  # Check status
```

### Out of memory
Increase memory in `fly.toml`:
```toml
memory_mb = 1024  # Increase from 512
```

### Database connection issues
```bash
# Verify DATABASE_URL secret
fly secrets list

# Test connection
fly postgres connect -a your-db-app
```

## Resources

- [Fly.io Docs](https://fly.io/docs)
- [Fly.io Community](https://community.fly.io)

