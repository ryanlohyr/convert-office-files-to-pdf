# Setup Guide: Document Converter Service

This guide will help you set up the document converter as a separate microservice.

## 📁 What Was Created

A new standalone service in: `document-converter-service/`

```
document-converter-service/
├── src/
│   ├── server.ts         # Express API server
│   └── converter.ts      # LibreOffice conversion logic
├── Dockerfile            # Production Docker image
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # Documentation
```

## 🔄 What Changed in Main Backend

**Updated file:** `backend/libraries/supabase/files.ts`
- Now calls the converter service via HTTP instead of direct LibreOffice
- Uses the new client: `backend/libraries/document-converter/client.ts`

**Reverted file:** `backend/Dockerfile`
- Removed LibreOffice installation (no longer needed in main backend)

**Can be deleted:**
- `backend/libraries/libreoffice/` (old direct conversion code)

## 🚀 Step-by-Step Setup

### 1. Create New Git Repository

```bash
# From your workspace root
cd document-converter-service

# Initialize new repo
git init
git add .
git commit -m "Initial commit: Document Converter Service"

# Push to your remote (GitHub, GitLab, etc.)
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### 2. Install Dependencies

```bash
cd document-converter-service
npm install
```

### 3. Run Locally

**Option A: With LibreOffice installed**
```bash
# Install LibreOffice first (Mac)
# Download from: https://www.libreoffice.org/download/download/

# Run the service
npm run dev
```

**Option B: With Docker**
```bash
# Build and run
docker build -t document-converter-service .
docker run -p 3001:3001 document-converter-service
```

### 4. Configure Main Backend

Add environment variable to your main backend:

```bash
# .env or environment config
CONVERTER_SERVICE_URL=http://localhost:3001
```

**For production:**
```bash
CONVERTER_SERVICE_URL=https://your-converter-service.com
```

### 5. Test the Integration

**Start both services:**
```bash
# Terminal 1: Start converter service
cd document-converter-service
npm run dev

# Terminal 2: Start main backend
cd backend
npm run dev
```

**Upload a DOCX or PPTX file** through your main app and verify it gets converted.

## 🌐 Deploy to Production

### Option 1: Google Cloud Run (Recommended)

```bash
cd document-converter-service

# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/document-converter
gcloud run deploy document-converter \
  --image gcr.io/YOUR_PROJECT_ID/document-converter \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --allow-unauthenticated
```

Get the service URL and set it in your main backend:
```bash
CONVERTER_SERVICE_URL=https://document-converter-xxxxx-uc.a.run.app
```

### Option 2: AWS Fargate

1. Push image to ECR
2. Create ECS task definition (2GB memory, 1-2 vCPU)
3. Create ECS service
4. Set up Application Load Balancer
5. Use ALB URL as `CONVERTER_SERVICE_URL`

### Option 3: Fly.io (Easiest)

```bash
cd document-converter-service
fly launch
fly deploy
```

Get the URL: `https://your-app.fly.dev`

### Option 4: Docker Compose (Same Server)

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - CONVERTER_SERVICE_URL=http://converter:3001
  
  converter:
    build: ./document-converter-service
    ports:
      - "3001:3001"
```

## 🔐 Security Considerations

### Add Authentication (Production)

Update `document-converter-service/src/server.ts`:

```typescript
// Add API key middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.use(apiKeyAuth);
```

Then in your backend client:

```typescript
// backend/libraries/document-converter/client.ts
headers: {
  ...formData.getHeaders(),
  'X-API-Key': process.env.CONVERTER_API_KEY,
}
```

### Rate Limiting

Add to converter service:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

## 📊 Monitoring

### Add Logging

The service already logs to stdout. Integrate with:
- **Google Cloud**: Cloud Logging (automatic with Cloud Run)
- **AWS**: CloudWatch Logs
- **Self-hosted**: ElasticSearch/Kibana, Grafana Loki

### Health Checks

The service has a `/health` endpoint. Set up monitoring:
- **Uptime monitoring**: Pingdom, UptimeRobot
- **APM**: New Relic, Datadog
- **Prometheus**: Scrape `/metrics` (add prometheus middleware)

## 🧹 Cleanup Old Code

Once the new service is working, remove from main backend:

```bash
# These are no longer needed
rm -rf backend/libraries/libreoffice
npm uninstall libreoffice-convert  # from backend/package.json
```

## 🐛 Troubleshooting

### Service Not Responding
- Check if converter service is running: `curl http://localhost:3001/health`
- Check environment variable: `echo $CONVERTER_SERVICE_URL`
- Check Docker logs: `docker logs CONTAINER_ID`

### Conversion Errors
- Verify LibreOffice is installed in the container
- Check memory limits (need 1-2GB)
- Check file size limits (max 50MB by default)

### Network Issues
- Ensure both services can communicate
- Check firewall rules
- In Docker: use service names, not `localhost`
- In Cloud: ensure proper network/VPC configuration

## 💰 Cost Optimization

### Cloud Run (GCP)
- Only charged when handling requests
- Auto-scales to zero
- ~$0.0000025/request for small files
- Estimated: $10-30/month for 10K conversions

### Fargate (AWS)
- Always running = consistent costs
- 1 vCPU + 2GB RAM = ~$30/month
- Use Fargate Spot for 70% savings

### Self-Hosted
- Can run on same server as backend
- No additional infrastructure costs
- Monitor resource usage

## ✅ Verification Checklist

- [ ] Converter service runs independently
- [ ] Main backend can call converter via HTTP
- [ ] DOCX files convert successfully
- [ ] PPTX files convert successfully
- [ ] Conversion metrics are logged
- [ ] Health check endpoint works
- [ ] Service deployed to production
- [ ] Environment variable set in main backend
- [ ] End-to-end test passes
- [ ] Old LibreOffice code removed from backend

## 📚 Additional Resources

- [LibreOffice Convert NPM](https://www.npmjs.com/package/libreoffice-convert)
- [Express.js Docs](https://expressjs.com/)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [AWS Fargate Docs](https://aws.amazon.com/fargate/)

## 🤝 Need Help?

- Check service logs first
- Test with curl commands (see README.md)
- Verify file formats are valid
- Check memory/CPU allocation

