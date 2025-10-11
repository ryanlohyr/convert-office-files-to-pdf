# Security Guide: JWT Authentication

This document explains how the JWT authentication works between your main backend and the document converter service.

## 🔐 How It Works

```
┌─────────────────┐                           ┌──────────────────────┐
│   Your Main     │  1. Generate JWT Token    │  Converter Service   │
│    Backend      │ ────────────────────────▶ │   (Port 3001)        │
│                 │  2. Send with request     │                      │
│  - Has secret   │  Authorization: Bearer    │  - Validates token   │
│  - Signs token  │                           │  - Checks signature  │
│                 │  ◀────────────────────────  │  - Verifies service  │
│                 │  3. Returns PDF           │                      │
└─────────────────┘                           └──────────────────────┘
```

## 🔑 Setup

### 1. Generate a Strong Secret

```bash
# Generate a random 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your JWT secret.

### 2. Set Environment Variables

**Converter Service:**
```bash
# .env or environment config
JWT_SECRET=your-generated-secret-here
NODE_ENV=production  # Disables test token endpoint
```

**Main Backend:**
```bash
# .env or environment config
CONVERTER_JWT_SECRET=your-generated-secret-here  # MUST match converter service
CONVERTER_SERVICE_URL=https://your-converter-service.com
```

**⚠️ IMPORTANT:** Both services MUST use the same secret!

### 3. Install Dependencies

**Converter Service:**
```bash
cd document-converter-service
npm install
```

**Main Backend:**
```bash
cd backend
npm install
```

## 🧪 Testing

### Development Mode (Local Testing)

In development, the converter service exposes a `/test/token` endpoint:

```bash
# Start converter service in development
NODE_ENV=development JWT_SECRET=test-secret npm run dev

# Get a test token
curl http://localhost:3001/test/token

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usage": "Authorization: Bearer eyJhbGci...",
  "warning": "This endpoint is only available in development mode"
}
```

### Test with curl

```bash
# Get token
TOKEN=$(curl -s http://localhost:3001/test/token | jq -r '.token')

# Test conversion
curl -X POST http://localhost:3001/convert/docx \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.docx" \
  --output converted.pdf
```

### Production Testing

In production, only your backend can generate tokens. The `/test/token` endpoint is disabled.

```bash
# This will return 404 in production
curl https://your-converter-service.com/test/token
```

## 🔒 Token Details

### Token Payload

```json
{
  "service": "learnkata-backend",
  "iat": 1697049600,  // Issued at
  "exp": 1697053200   // Expires in 1 hour
}
```

### Token Validation

The converter service validates:
1. **Signature** - Token was signed with the correct secret
2. **Service ID** - Token has `service: "learnkata-backend"`
3. **Expiration** - Token is not expired (1 hour lifetime)

## 🚨 Error Responses

### 401 Unauthorized - Missing Token
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization header. Expected: Bearer <token>"
}
```

**Fix:** Include `Authorization: Bearer <token>` header

### 401 Unauthorized - Invalid Token
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

**Fix:** Check that both services use the same `JWT_SECRET`

### 401 Unauthorized - Expired Token
```json
{
  "error": "Unauthorized",
  "message": "Token has expired"
}
```

**Fix:** Token lifetime is 1 hour. Your backend generates fresh tokens automatically.

### 403 Forbidden - Wrong Service
```json
{
  "error": "Forbidden",
  "message": "Invalid service identifier"
}
```

**Fix:** Token must have `service: "learnkata-backend"` in payload

## 🔧 Troubleshooting

### Backend can't connect to converter

1. **Check secret matches:**
```bash
# On converter service
echo $JWT_SECRET

# On main backend
echo $CONVERTER_JWT_SECRET
```

They should be identical!

2. **Check URL is correct:**
```bash
# On main backend
echo $CONVERTER_SERVICE_URL
```

3. **Test health endpoint (no auth):**
```bash
curl https://your-converter-service.com/health
```

### "JWT_SECRET is not configured"

The converter service requires `JWT_SECRET` to start. It will exit if not set.

**Fix:**
```bash
export JWT_SECRET=your-secret-here
npm start
```

### Tokens work locally but not in production

- Ensure production environment variables are set correctly
- Check that secrets match between services
- Verify firewall rules allow communication
- Check logs on both services

## 🔐 Security Best Practices

### ✅ DO

- Use a strong random secret (minimum 32 characters)
- Store secrets in environment variables, never in code
- Use HTTPS in production
- Rotate secrets periodically (e.g., every 90 days)
- Monitor for authentication failures
- Use different secrets for dev/staging/production

### ❌ DON'T

- Don't commit secrets to git
- Don't expose the `/test/token` endpoint in production
- Don't share secrets between different environments
- Don't use weak/guessable secrets
- Don't log tokens (they appear in error messages)

## 🔄 Rotating Secrets

To rotate the JWT secret:

1. Generate a new secret
2. Update both services simultaneously:
   - Converter service: `JWT_SECRET`
   - Main backend: `CONVERTER_JWT_SECRET`
3. Restart both services
4. Old tokens will immediately become invalid

**Zero-downtime rotation** (advanced):
- Converter service can validate against multiple secrets
- Add new secret while keeping old one
- Update backend to use new secret
- Remove old secret after 1 hour (token expiry)

## 📊 Monitoring

### Log Authentication Failures

The converter service logs all authentication failures:

```
[ERROR] Invalid token attempt from IP: xxx.xxx.xxx.xxx
```

### Metrics to Track

- Authentication success/failure rate
- Token expiration errors
- Invalid token attempts (potential attacks)
- Source IPs of failed attempts

### Alerts to Set Up

- High rate of 401 errors (> 5% of requests)
- Repeated authentication failures from same IP
- Sudden spike in token-related errors

## 🔗 Integration Example

### Main Backend (TypeScript)

```typescript
import { convertDocxToPdf } from '#libraries/document-converter/client';

// Token generation and sending is automatic
const result = await convertDocxToPdf(fileBuffer);
// JWT token is generated and included in the request
```

### Custom Integration

If integrating from another service:

```typescript
import jwt from 'jsonwebtoken';
import FormData from 'form-data';

// Generate token
const token = jwt.sign(
  { service: 'learnkata-backend' },
  process.env.CONVERTER_JWT_SECRET,
  { expiresIn: '1h' }
);

// Send request
const formData = new FormData();
formData.append('file', fileBuffer);

const response = await fetch('https://converter.example.com/convert/docx', {
  method: 'POST',
  headers: {
    ...formData.getHeaders(),
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## 📚 Additional Resources

- [JWT.io](https://jwt.io/) - JWT token debugger
- [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

