# Guest Registration - Room Type Backup Mechanism

## Overview
This document describes the implementation of a room type backup mechanism to handle missing room type data in PDF generation.

---

## Problem Statement

### Issue 1: 400 Bad Request Error
**Error:** `POST http://localhost:3000/api/guests 400 (Bad Request)`

**Root Cause:** 
- Frontend was sending `roomTypesBackup` field in the agreement payload
- Backend models did not include this field in the validation schema
- Backend was rejecting the unknown field as a validation error

### Issue 2: Room Type Missing from PDFs
**Problem:** Room types not displaying in generated PDFs even though data was available

**Root Cause:**
- Backend returns `null` for `roomType` on GET requests despite successful POST
- PDF generation timing issue: DOM captured before Angular template expressions rendered
- No fallback mechanism when backend data was unavailable

---

## Solution Architecture

### 1. Frontend Changes

#### Model Updates
**File:** `src/app/core/models/guest.model.ts`

Added `roomTypesBackup` field to both interfaces:
```typescript
export interface GuestAgreement {
  // ... existing fields ...
  roomTypesBackup?: string;  // Backup room types for PDF display fallback
}

export interface CreateAgreementRequest {
  // ... existing fields ...
  roomTypesBackup?: string;  // Backup room types for PDF display fallback
}
```

#### Guest Registration Component
**File:** `src/app/features/front-desk/guest-registration/guest-registration.component.ts`

**Line 987:** Extract and backup room types during registration submission
```typescript
// Extract room types for backup storage in agreement
const roomTypes = reservations.map((r: any) => r.roomType).join(', ');

const payload = {
  ...guestInfoClean,
  reservations,
  agreement: {
    ...policies,
    // ... other fields ...
    roomTypesBackup: roomTypes,  // Store as comma-separated string
  },
};
```

**Format:** Room types are stored as comma-separated string
- **Example:** `"JUNIOR SUITE, DELUXE ROOM, STANDARD ROOM"`
- **Purpose:** Allows index-based retrieval matching reservation order

#### Registration PDF Component
**File:** `src/app/features/front-desk/guest-registration/registration-pdf.component.ts`

**Template (Line 82):** Pass reservation index
```html
{{ getRoomTypeName(reservation.roomType, ri) }}
```

**Method (Lines 641-675):** Fallback retrieval logic
```typescript
getRoomTypeName(roomType: any, reservationIndex: number = 0): string {
  // Try direct value first
  if (!roomType) {
    // Fallback: Get from backup storage
    if (guest?.agreement?.roomTypesBackup) {
      const roomTypes = agreement.roomTypesBackup.split(', ');
      const backupRoomType = roomTypes[reservationIndex] || roomTypes[0];
      if (backupRoomType) {
        return backupRoomType.trim() || '—';
      }
    }
    return '—';
  }
  
  // Handle object format
  if (typeof roomType === 'object' && roomType.name) {
    return roomType.name.trim() || '—';
  }
  
  // Handle string format
  if (typeof roomType === 'string') {
    return roomType.trim() || '—';
  }
  
  return '—';
}
```

#### Guest PDF Preview Component
**File:** `src/app/features/admin/guest-list/guest-pdf-preview.component.ts`

Same implementation as registration-pdf component:
- **Template (Line 85):** Pass reservation index
- **Method (Lines 740-778):** Fallback retrieval with comprehensive logging
- **Logging:** Detailed console output showing backup usage

**Async Rendering Pattern:**
```typescript
requestAnimationFrame(() => {
  setTimeout(() => {
    // PDF generation happens here
    // Ensures Angular Change Detection is complete
  }, 500);
});
```

---

## Backend Requirements

### 1. Database Schema Migration

Add the `roomTypesBackup` column to guest_agreements table:

```sql
ALTER TABLE guest_agreements 
ADD COLUMN "roomTypesBackup" TEXT NULL DEFAULT NULL;
```

**Column Details:**
- **Type:** TEXT/VARCHAR(500)
- **Nullable:** Yes (optional)
- **Format:** Comma-separated room type names
- **Example:** `"JUNIOR SUITE, DELUXE ROOM"`

### 2. Backend Validation Schema

Update your guest creation/validation schema to accept `roomTypesBackup`:

**TypeScript (Express/Node.js example):**
```typescript
export interface CreateAgreementRequest {
  policyHousekeeping1: boolean;
  policyHousekeeping2: boolean;
  policySmoking: boolean;
  policyCorkage: boolean;
  policyNoPets: boolean;
  policyNegligence: boolean;
  policyMinors: boolean;
  policyParking: boolean;
  policySafe: boolean;
  policyForceMajeure: boolean;
  policyDataPrivacy: boolean;
  guestPrintedName: string;
  guestSignature: string;
  signatureDate: string;
  processedByName: string;
  processedBySignature: string;
  remarks?: string;
  pdfPath?: string;
  roomTypesBackup?: string;  // ← Add this field
}
```

**Joi Validation (if using Joi):**
```javascript
const createAgreementSchema = Joi.object({
  policyHousekeeping1: Joi.boolean().required(),
  // ... other fields ...
  roomTypesBackup: Joi.string().max(500).optional(),  // ← Add this
});
```

**Zod Validation (if using Zod):**
```typescript
const CreateAgreementSchema = z.object({
  // ... other fields ...
  roomTypesBackup: z.string().max(500).optional(),  // ← Add this
});
```

### 3. API Response

When returning a guest, include the `roomTypesBackup` field:

```json
{
  "id": "guest-123",
  "firstName": "John",
  "lastName": "Doe",
  "reservations": [
    {
      "id": "res-1",
      "roomType": null,
      "roomNumber": "101"
    }
  ],
  "agreement": {
    "id": "agree-123",
    "policyHousekeeping1": true,
    "policyHousekeeping2": true,
    "policySmoking": true,
    "policyCorkage": true,
    "policyNoPets": true,
    "policyNegligence": true,
    "policyMinors": true,
    "policyParking": true,
    "policySafe": true,
    "policyForceMajeure": true,
    "policyDataPrivacy": true,
    "guestPrintedName": "John Doe",
    "signatureDate": "2024-04-16",
    "processedByName": "Front Desk Staff",
    "remarks": "Optional remarks",
    "roomTypesBackup": "JUNIOR SUITE, DELUXE ROOM"  // ← Will be included now
  }
}
```

---

## Data Flow

### Registration Submission
```
1. User fills registration form
2. Selects room types in reservations section
3. Submits form
4. Frontend extracts room types: ["JUNIOR SUITE", "DELUXE ROOM"]
5. Joins as string: "JUNIOR SUITE, DELUXE ROOM"
6. Stores in payload.agreement.roomTypesBackup
7. Sends POST to /api/guests
8. ✅ Backend now accepts roomTypesBackup field
```

### PDF Generation (Guest Displays PDF Later)
```
1. Admin/Front-desk opens guest PDF preview
2. Backend returns guest record
3. Frontend receives guest with agreement.roomTypesBackup
4. Template renders: getRoomTypeName(reservation.roomType, index)
5. If reservation.roomType is null:
   - Falls back to agreement.roomTypesBackup
   - Splits by ", " (comma-space)
   - Gets value at reservation index
   - Displays correct room type in PDF
```

---

## Testing Checklist

- [ ] Backend schema migrated (roomTypesBackup column added)
- [ ] Backend validation schema updated to accept roomTypesBackup
- [ ] Register a new guest with multiple room types
- [ ] Verify registration succeeds (no 400 error)
- [ ] View registration confirmation PDF
- [ ] Verify room types display correctly
- [ ] Admin guest list: Open guest PDF preview
- [ ] Verify room types display correctly in preview
- [ ] Download PDF from admin guest list
- [ ] Verify room types display correctly in downloaded PDF

---

## Fallback Chain (Priority Order)

When displaying room type in PDF:

1. **Direct Value:** If `reservation.roomType` is not null
   - Try to use as object with `.name` property
   - Try to use as string directly

2. **Backup Storage:** If `reservation.roomType` is null
   - Check `guest.agreement.roomTypesBackup`
   - Split by ", " (comma-space)
   - Get value at reservation index
   - If index doesn't exist, use first item

3. **Default:** If all else fails
   - Display "—" (em dash)

---

## Console Logging

Frontend logs extensively for debugging:

**Guest Registration:**
```
✅ Using backup roomType for reservation 0: JUNIOR SUITE
```

**PDF Preview:**
```
📍 Reservation 1:
  Complete reservation object: {...}
  - roomType (raw): null
  - roomType type: object
  ✅ Using backup roomType for reservation 0: JUNIOR SUITE
```

---

## Version Information

- **Angular:** v21 (with hydration, strict mode)
- **TypeScript:** Strict mode enabled
- **Room Type Union Type:** `RoomType | string | null`
- **PDF Library:** html2pdf.js

---

## Known Limitations & Notes

1. **Backend roomType Issue:** Backend currently returns `null` for `roomType` on GET requests
   - This backup mechanism provides a workaround
   - Long-term: Backend team should investigate why roomType isn't being retrieved

2. **Comma-Space Delimiter:** Backup uses ", " (comma-space) as delimiter
   - Room type names cannot contain ", " sequence
   - Standard room names work fine (e.g., "JUNIOR SUITE, DELUXE ROOM")

3. **Index Mapping:** Assumes backend returns reservations in same order as sent
   - If reservation order changes, index mapping may be incorrect
   - Consider adding reservation IDs to backup string if this becomes an issue

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/core/models/guest.model.ts` | Added `roomTypesBackup` to GuestAgreement & CreateAgreementRequest |
| `src/app/features/front-desk/guest-registration/guest-registration.component.ts` | Extract & store room types backup in onSubmit() |
| `src/app/features/front-desk/guest-registration/registration-pdf.component.ts` | Pass index to getRoomTypeName(), add fallback logic |
| `src/app/features/admin/guest-list/guest-pdf-preview.component.ts` | Pass index to getRoomTypeName(), add fallback logic |

---

## Quick Start for Developers

### To Implement Backend Changes:

1. **Run migration:**
   ```sql
   ALTER TABLE guest_agreements 
   ADD COLUMN "roomTypesBackup" TEXT NULL;
   ```

2. **Update validation schema** - Add `roomTypesBackup?: string` to CreateAgreementRequest

3. **Redeploy backend** - Server must accept new field

4. **Test:**
   - Register guest → Should succeed (200)
   - Check guest record → Should include roomTypesBackup
   - View PDF → Room types should display

### To Test Frontend:

```bash
# Start dev server
npm start

# Register a guest with room types
# Check browser console (F12) for:
# - "Using backup roomType" messages
# - Guest PDF Preview should show room types

# Check network tab:
# - POST /api/guests should return 200
# - GET /api/guests/:id should include roomTypesBackup
```

---

## Support & Questions

**Reference:** See SYSTEM_MANUAL.md for full system documentation

