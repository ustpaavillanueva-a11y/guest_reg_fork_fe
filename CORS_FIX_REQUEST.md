# CORS Configuration Required - Backend Action Needed

## Problem
The frontend (deployed on Vercel) is being blocked from accessing the backend API due to CORS policy restrictions.

**Error Message:**
```
Access to fetch at 'https://kekehyu-guest-reg.onrender.com/api/guests' 
from origin 'https://kekehyuguestregistration.vercel.app' has been blocked 
by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## What Needs to Be Fixed

The backend CORS configuration needs to be updated to **whitelist the Vercel frontend domain**.

### Details:
- **Frontend Domain:** `https://kekehyuguestregistration.vercel.app`
- **Backend Domain:** `https://kekehyu-guest-reg.onrender.com/api`
- **Required Headers:** 
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Methods` (GET, POST, PATCH, DELETE, OPTIONS)
  - `Access-Control-Allow-Headers` (Content-Type, Authorization)
  - `Access-Control-Allow-Credentials` (true - for auth tokens)

## Solution - Add CORS Configuration

### For Express.js Backend:
```javascript
const cors = require('cors');

// Add whitelist configuration
const corsOptions = {
  origin: [
    'https://kekehyuguestregistration.vercel.app',    // Production frontend
    'http://localhost:4200',                            // Development frontend (keep for testing)
    'http://localhost:3000'                             // Optional: other local ports
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware BEFORE route handlers
app.use(cors(corsOptions));
```

### For NestJS Backend:
```typescript
// In main.ts or app.module.ts
const app = await NestFactory.create(AppModule);

app.enableCors({
  origin: [
    'https://kekehyuguestregistration.vercel.app',    // Production frontend
    'http://localhost:4200',                            // Development frontend
    'http://localhost:3000'                             // Optional
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await app.listen(process.env.PORT || 3000);
```

### For FastAPI (Python) Backend:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kekehyuguestregistration.vercel.app",
        "http://localhost:4200",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

## API Endpoints That Need CORS Access

The frontend calls these endpoints:
1. **POST** `/api/guests` - Create guest registration
2. **PATCH** `/api/guests/{id}` - Update guest with PDF path
3. **GET** `/api/guests` - Fetch guest list
4. **GET** `/api/guests/{id}` - Fetch single guest
5. **POST** `/api/auth/login` - Login
6. **GET** `/api/room-types` - Fetch room types
7. **GET** `/api/room-types/active` - Fetch active room types
8. **GET** `/api/hotel-settings` - Fetch hotel settings
9. **POST** `/api/upload` or similar - PDF file upload (if applicable)

All these need to be accessible from the Vercel domain.

## Testing

After implementing the CORS fix:
1. Clear browser cache
2. Test the frontend at: `https://kekehyuguestregistration.vercel.app`
3. Try the guest registration flow
4. Check browser console for CORS errors - they should be gone

## Important Notes

- ✅ Use whitelisting (allow specific origins) instead of allowing all origins (`*`) for security
- ✅ Include `credentials: true` - needed for authentication tokens to work cross-origin
- ✅ CORS preflight (OPTIONS) requests must be handled first, before reaching route handlers
- ✅ Both development (`localhost:4200`) and production (`vercel.app`) origins should be whitelisted
- ❌ Don't use wildcard `*` origin in production - it disables credential support

## Questions?

If the backend team needs clarification on:
- The exact framework being used
- The current CORS setup
- Environment-specific configurations

**Frontend Status:** Ready and deployed on Vercel. Just waiting for CORS fix on backend.

---

**Prepared by:** Frontend Team  
**Date:** April 16, 2026  
**Priority:** High (blocking all frontend-backend communication)
