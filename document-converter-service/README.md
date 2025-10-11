# Document Converter Service

A standalone microservice for converting DOCX and PPTX files to PDF using LibreOffice.

## Features

- ✅ Convert DOCX to PDF
- ✅ Convert PPTX to PDF
- ✅ REST API with multipart file upload
- ✅ Conversion metrics (duration, file sizes)
- ✅ Health check endpoint
- ✅ Docker support with LibreOffice pre-installed

## Prerequisites

### Local Development
- Node.js 18+
- LibreOffice installed:
  - **Mac**: Download from https://www.libreoffice.org/download/download/ and install to `/Applications`
  - **Linux**: `apt install libreoffice` or `yum install libreoffice`
  - **Windows**: Download MSI installer and set `PROGRAMFILES` environment variable

### Production
- Docker (LibreOffice is included in the Docker image)

## Installation

```bash
npm install
```

## Running Locally

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The service will run on port **3001** by default.

## Running with Docker

```bash
# Build the image
docker build -t document-converter-service .

# Run the container
docker run -p 3001:3001 document-converter-service

# Run with custom port
docker run -p 8080:3001 -e PORT=3001 document-converter-service
```

## API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "document-converter-service"
}
```

### Convert DOCX to PDF
```
POST /convert/docx
Content-Type: multipart/form-data
```

**Request:**
- `file`: DOCX file (multipart upload)

**Response:**
- Binary PDF data
- Headers:
  - `X-Conversion-Duration`: Conversion time in milliseconds
  - `X-Input-Size-MB`: Input file size in MB
  - `X-Output-Size-MB`: Output file size in MB

**Example:**
```bash
curl -X POST http://localhost:3001/convert/docx \
  -F "file=@document.docx" \
  --output converted.pdf
```

### Convert PPTX to PDF
```
POST /convert/pptx
Content-Type: multipart/form-data
```

**Request:**
- `file`: PPTX file (multipart upload)

**Response:**
- Binary PDF data
- Headers:
  - `X-Conversion-Duration`: Conversion time in milliseconds
  - `X-Input-Size-MB`: Input file size in MB
  - `X-Output-Size-MB`: Output file size in MB

**Example:**
```bash
curl -X POST http://localhost:3001/convert/pptx \
  -F "file=@presentation.pptx" \
  --output converted.pdf
```

## Environment Variables

- `PORT`: Server port (default: 3001)

## Deployment

### Deploy to Cloud Run (GCP)

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/document-converter-service

# Deploy to Cloud Run
gcloud run deploy document-converter-service \
  --image gcr.io/YOUR_PROJECT_ID/document-converter-service \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10
```

### Deploy to AWS ECS/Fargate

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t document-converter-service .
docker tag document-converter-service:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/document-converter-service:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/document-converter-service:latest

# Create ECS task and service (use AWS Console or Terraform)
```

### Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Deploy
fly deploy
```

## Performance

**Typical Conversion Times:**
- Small DOCX (< 1MB): 1-3 seconds
- Medium DOCX (1-5MB): 3-8 seconds
- Large DOCX (> 5MB): 8-15 seconds
- PPTX files are similar but may be slightly faster

**Resource Requirements:**
- CPU: 1-2 cores recommended
- Memory: 1-2GB recommended
- Storage: 500MB+ (for LibreOffice)

## Monitoring

The service logs conversion metrics to stdout:
- File sizes (input/output)
- Conversion duration
- Success/failure status

Integrate with your logging solution (CloudWatch, Stackdriver, etc.) to track:
- Conversion volume
- Average conversion time
- Error rate
- Resource usage

## Limitations

- Max file size: 50MB (configurable in `src/server.ts`)
- Concurrent conversions: Limited by CPU/memory
- Some complex documents may not convert perfectly

## Troubleshooting

### "Could not find soffice binary"
- LibreOffice is not installed
- On Mac, ensure it's installed to `/Applications`
- In Docker, this should not happen (LibreOffice is pre-installed)

### Slow conversions
- Large or complex documents take longer
- Consider increasing CPU/memory allocation
- Scale horizontally with multiple instances

### Out of memory
- Increase container memory limit
- Reduce max file size limit
- Process files in batches

## License

MIT

