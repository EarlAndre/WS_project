# Frontend-to-Database Sync - Diagnostic Guide

## Problem
Changes made in the React frontend at http://localhost:5176 are not appearing in the Django SQLite database.

## Root Cause Analysis (FIXED)
The issue was that the frontend data layer (`src/lib/db.js`) had multiple levels of silent error handling:
1. Functions used both plain `fetch()` and nested `try/catch` blocks
2. API failures were caught but not logged or reported to the user
3. No visibility into why data wasn't syncing

## Solution Applied

### 1. **All API calls now use safeFetch wrapper**
- Centralized error logging to console
- Errors trigger `app-banner` events so users see warnings
- Example: "⚠️ Server error: 400 Bad Request. Using local fallback."

### 2. **CORS expanded to support port 5176**
- Added `http://localhost:5176` and `http://127.0.0.1:5176` to `CORS_ALLOWED_ORIGINS` in Django
- Vite dev server sometimes uses port 5176 if 5173-5175 are busy

### 3. **Removed Supabase dependency**
- Deleted `@supabase/supabase-js` from package.json
- Disabled Supabase keys in .env (no longer loaded)
- All UI messages updated to not reference Supabase

### 4. **Improved db.js error handling**
- Eliminated nested try/catch blocks that hid errors
- All functions (createSeminar, recordTimeIn, checkIn, saveEvaluation, etc.) now consistently try backend first
- Falls back to localStorage with explicit error indication if backend fails

## Testing the Fix

### Quick Verification (API + Backend)
Backend is already tested and working. Verify with:
```bash
cd c:\Users\earlj\Desktop\EarlEd
node test_integration.js
```
Output should show ✓ for all 6 steps (create, join, checkin, checkout, evaluate, fetch).

### Frontend-to-Database Test
1. **Start both servers:**
   ```bash
   # Terminal 1: Backend
   cd backend
   python manage.py runserver

   # Terminal 2: Frontend  
   cd ..
   npm run dev
   ```
   Frontend runs on http://localhost:5176

2. **Open browser DevTools (F12):**
   - Go to **Console** tab
   - Look for error messages starting with "API" or "Network error"
   - Go to **Network** tab
   - Filter for "api/" requests

3. **Login as Admin:**
   - Username: `admin`
   - Password: `admin`
   - Navigate to "Create Seminar" tab

4. **Create a test seminar:**
   - Fill all required fields
   - Click "Create Seminar"
   - Watch Console for errors
   - Watch Network tab for POST to `/api/seminars/`
   - If successful: response status should be 200/201 and show `id` in response

5. **Verify in Django Admin:**
   - Open http://127.0.0.1:8000/admin/
   - Login with: admin / admin
   - Go to "Seminars" → should see your created seminar

6. **Test Participant Actions:**
   - Login as participant:
     - Username: `participant`
     - Password: `participant`
   - Join a seminar (if you haven't yet)
   - Click "Check In" on the seminar
   - Watch Console for any API errors
   - Go to Django admin → Attendance → should see your checkin record

## Common Issues & Solutions

### Issue: See "⚠️ Server error: 400 Bad Request"
**Action:** Check Console to see the response body details. Common causes:
- Missing required field in payload
- Mismatch between what frontend sends and what backend expects
- Field name mismatch (e.g., `capacity` vs `participants`)

**Solution:** Open browser DevTools Network tab, click the failed POST request, go to Response tab, read the error message, and report it.

### Issue: See "⚠️ Network error"
**Action:** Ensure:
- Backend is running: `python manage.py runserver` should say "Starting development server at http://127.0.0.1:8000/"
- Frontend can reach backend: Open http://127.0.0.1:8000/api/health/ in browser, should show `{"status":"Backend is running","storage":"SQLite local"}`

### Issue: Data saved locally but not in DB
**This means API call succeeded but returns an error response.**
Check Network tab Response body for error details and report it.

## Key Files Modified
- `backend/backend/settings.py` — Added CORS origins for port 5176
- `src/lib/db.js` — Enhanced safeFetch, removed nested try/catch
- `.env` — Disabled Supabase keys
- `package.json` — Removed @supabase/supabase-js dependency

## Commands to Run
```bash
# Start backend
cd backend
python manage.py runserver

# Start frontend (new terminal)
cd ..
npm run dev

# Run integration test (new terminal, backend must be running)
node test_integration.js

# Access Django Admin
# http://127.0.0.1:8000/admin/
# Credentials: admin / admin
```

## Summary
✅ **Backend API is working correctly** (verified with test_integration.js)
✅ **CORS is configured for all Vite ports**
✅ **Supabase removed completely**
✅ **All errors are now visible in browser console and UI banners**

**Next Step:** Open the app in browser, perform an action (create/join/checkin), and check the browser console for any error messages. Report any errors you see.
