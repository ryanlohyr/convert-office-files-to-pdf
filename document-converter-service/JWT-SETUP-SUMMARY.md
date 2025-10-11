# JWT Authentication - Setup Summary

## 🔐 What Was Added

JWT authentication now secures communication between your main backend and the converter service.

### Files Added/Modified

**Converter Service:**
- ✅ `src/auth.ts` - JWT authentication middleware
- ✅ `src/server.ts` - Protected endpoints with JWT
- ✅ `package.json` - Added `jsonwebtoken` dependency
- ✅ `SECURITY.md` - Complete security documentation

**Main Backend:**
- ✅ `backend/libraries/document-converter/jwt.ts` - Token generation
- ✅ `backend/libraries/document-converter/client.ts` - Sends JWT with requests
- ✅ `backend/package.json` - Added `jsonwebtoken` dependency

## ⚡ Quick Setup (3 steps)

### 1. Generate Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your JWT secret.

### 2. Set Environment Variables

**Converter Service:**
```bash
export JWT_SECRET=<your-secret-from-step-1>
export NODE_ENV=production  # Disables test endpoint
```

**Main Backend:**
```bash
export CONVERTER_JWT_SECRET=<same-secret-as-converter>
export CONVERTER_SERVICE_URL=http://localhost:3001
```

**⚠️ CRITICAL:** Both secrets MUST be identical!

### 3. Install Dependencies

```bash
# Converter service
cd document-converter-service
npm install

# Main backend
cd backend
npm install
```

## 🧪 Test It

```bash
# Terminal 1: Start converter (with JWT_SECRET set)
cd document-converter-service
JWT_SECRET=test-secret npm run dev

# Terminal 2: Start main backend (with CONVERTER_JWT_SECRET set)
cd backend
CONVERTER_JWT_SECRET=test-secret npm run dev
```

Upload a file - it should convert successfully!

## 🔒 How It Works

1. **Main Backend** generates JWT token with signature `{ service: "learnkata-backend" }`
2. **Main Backend** sends token in `Authorization: Bearer <token>` header
3. **Converter Service** validates:
   - Token signature matches JWT_SECRET
   - Service identifier is correct
   - Token is not expired (1 hour TTL)
4. If valid, conversion proceeds
5. If invalid, returns 401 Unauthorized

## 🌐 Production Deployment

### Fly.io Example

```bash
# Deploy converter service
cd document-converter-service
fly secrets set JWT_SECRET=your-production-secret
fly secrets set NODE_ENV=production
fly deploy

# Configure main backend
CONVERTER_SERVICE_URL=https://your-converter.fly.dev
CONVERTER_JWT_SECRET=your-production-secret  # SAME as above!
```

### Other Platforms

**Google Cloud Run:**
```bash
gcloud run deploy document-converter \
  --set-env-vars JWT_SECRET=your-secret,NODE_ENV=production
```

**AWS:**
```bash
# Set environment variables in ECS task definition or Lambda configuration
JWT_SECRET=your-secret
NODE_ENV=production
```

**Docker:**
```bash
docker run -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  -e NODE_ENV=production \
  converter-service
```

## 🛡️ Security Features

✅ **Authentication** - Only requests with valid JWT can convert  
✅ **Service Verification** - Token must identify as "learnkata-backend"  
✅ **Expiration** - Tokens expire after 1 hour  
✅ **Development Mode** - Test token endpoint only in dev  
✅ **Error Handling** - Detailed error messages for debugging  

## ❌ Common Errors

### "Unauthorized: Missing or invalid authorization header"
**Fix:** Ensure your backend is generating and sending the token. Check `CONVERTER_JWT_SECRET` is set.

### "Unauthorized: Invalid token"
**Fix:** Secrets don't match. Verify `JWT_SECRET` (converter) == `CONVERTER_JWT_SECRET` (backend).

### "Forbidden: Invalid service identifier"
**Fix:** Token payload is incorrect. Should not happen with our implementation.

### "JWT_SECRET is not configured"
**Fix:** Converter service requires `JWT_SECRET` environment variable to start.

## 📊 Testing with curl

### Development Mode (with test endpoint)

```bash
# Start converter in dev mode
NODE_ENV=development JWT_SECRET=test-secret npm run dev

# Get test token
TOKEN=$(curl -s http://localhost:3001/test/token | jq -r '.token')

# Test conversion
curl -X POST http://localhost:3001/convert/docx \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.docx" \
  --output converted.pdf
```

### Production Mode (no test endpoint)

In production, only your backend can generate tokens. Test through your application.

## 🔄 Rotating Secrets

To change the JWT secret:

1. Generate new secret
2. Update both services simultaneously:
   ```bash
   # Converter
   fly secrets set JWT_SECRET=new-secret
   
   # Backend
   export CONVERTER_JWT_SECRET=new-secret
   ```
3. Restart both services
4. Old tokens immediately become invalid

## 📚 Documentation

- **`SECURITY.md`** - Complete security guide with best practices
- **`QUICK-START.md`** - Updated with JWT setup steps
- **`SETUP.md`** - Deployment guide with JWT configuration

## ✅ Checklist

Before going to production:

- [ ] Generated strong random secret (32+ characters)
- [ ] Set `JWT_SECRET` on converter service
- [ ] Set `CONVERTER_JWT_SECRET` on main backend  
- [ ] Verified both secrets match
- [ ] Set `NODE_ENV=production` on converter
- [ ] Tested conversion end-to-end
- [ ] Secrets stored securely (not in code/git)
- [ ] Using HTTPS in production

## 🎉 Done!

Your converter service is now secured with JWT authentication. Only your backend can request conversions.

