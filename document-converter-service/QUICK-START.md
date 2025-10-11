# Quick Start Guide

## 🎯 TL;DR

This is a standalone microservice that converts DOCX/PPTX files to PDF. Your main backend calls it via HTTP.

## ⚡ Fastest Setup (5 minutes)

### 1. Generate JWT Secret

```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output - you'll need it in steps 2 and 3
```

### 2. Run the Converter Service

```bash
cd document-converter-service
npm install

# Option A: With Docker (recommended)
docker build -t converter .
docker run -p 3001:3001 \
  -e JWT_SECRET=your-generated-secret-here \
  converter

# Option B: Local (requires LibreOffice installed)
export JWT_SECRET=your-generated-secret-here
npm run dev
```

### 3. Configure Main Backend

Add to your backend environment (use the SAME secret from step 1):
```bash
export CONVERTER_SERVICE_URL=http://localhost:3001
export CONVERTER_JWT_SECRET=your-generated-secret-here
```

Install JWT dependency:
```bash
cd backend
npm install
```

### 4. Test It

```bash
# Terminal 1: Converter service should be running on :3001
# Terminal 2: Start your main backend
cd ../backend
npm run dev
```

Upload a DOCX or PPTX file - it should automatically convert to PDF!

**Testing with curl:**
```bash
# Get a test token (only works in development)
TOKEN=$(curl -s http://localhost:3001/test/token | jq -r '.token')

# Convert a file
curl -X POST http://localhost:3001/convert/docx \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.docx" \
  --output converted.pdf
```

## 📦 Create Separate Repository

```bash
cd document-converter-service

# Add .env to .gitignore (if not already)
echo ".env" >> .gitignore

git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/document-converter-service.git
git push -u origin main
```

**⚠️ NEVER commit your JWT_SECRET to git!**

## 🌐 Deploy to Production

**Easiest: Fly.io** (2 minutes)
```bash
fly launch
fly deploy
# Get your URL: https://your-app.fly.dev
```

**Set secrets in both services:**
```bash
# Converter service (on Fly.io)
fly secrets set JWT_SECRET=your-generated-secret-here
fly secrets set NODE_ENV=production

# Main backend (your hosting platform)
CONVERTER_SERVICE_URL=https://your-app.fly.dev
CONVERTER_JWT_SECRET=your-generated-secret-here  # MUST match!
```

Done! 🎉

**🔐 Security Note:** Both services MUST use the same JWT secret!

## 📊 Test Endpoints

```bash
# Health check (no auth required)
curl http://localhost:3001/health

# Get test token (development only)
TOKEN=$(curl -s http://localhost:3001/test/token | jq -r '.token')

# Convert DOCX
curl -X POST http://localhost:3001/convert/docx \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.docx" \
  --output converted.pdf

# Convert PPTX
curl -X POST http://localhost:3001/convert/pptx \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pptx" \
  --output converted.pdf
```

**Note:** Conversion endpoints require JWT authentication!

## 🔍 Architecture

```
┌─────────────────┐         HTTP POST          ┌──────────────────────┐
│   Your Main     │ ────────────────────────▶  │  Converter Service   │
│    Backend      │  /convert/docx or /pptx    │   (Port 3001)        │
│                 │                             │                      │
│  - Handles      │  ◀────────────────────────  │  - LibreOffice       │
│    uploads      │      Returns PDF bytes      │  - Converts to PDF   │
│  - Stores files │                             │  - Returns PDF       │
└─────────────────┘                             └──────────────────────┘
```

## 💡 Key Files

**Converter Service:**
- `src/server.ts` - HTTP API (Express)
- `src/converter.ts` - Conversion logic
- `Dockerfile` - Includes LibreOffice

**Main Backend (Updated):**
- `backend/libraries/document-converter/client.ts` - HTTP client
- `backend/libraries/document-converter/jwt.ts` - JWT token generation
- `backend/libraries/supabase/files.ts` - Uses new client

## 🧹 Cleanup

Remove old code from main backend:
```bash
cd ../backend
rm -rf libraries/libreoffice
npm uninstall libreoffice-convert
```

## ❓ Issues?

**"Could not find soffice binary"**
- Use Docker, or
- Install LibreOffice: https://www.libreoffice.org/download/

**"Connection refused"**
- Make sure converter service is running
- Check `CONVERTER_SERVICE_URL` is set correctly

**"Unauthorized" errors**
- Check `JWT_SECRET` is set on converter service
- Check `CONVERTER_JWT_SECRET` is set on main backend
- Ensure both secrets match exactly
- See `SECURITY.md` for detailed troubleshooting

**"Timeout"**
- Large files take longer (10-30 seconds)
- Increase timeout in your HTTP client

## 📚 Full Documentation

- `README.md` - Complete API docs
- `SETUP.md` - Detailed setup guide
- `SECURITY.md` - JWT authentication guide ⭐

