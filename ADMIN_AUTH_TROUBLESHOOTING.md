# Admin Panel Authentication Troubleshooting Guide

## Problem: "Invalid or expired token" error when toggling trek/tour status

This guide will help you diagnose and fix authentication issues in the admin panel.

---

## Quick Diagnosis

### Step 1: Test Your Setup

1. **Open the test page**: Open `test-auth.html` in your browser
2. **Run all tests** in order:
   - Backend Connection Test
   - Admin Login Test
   - Authenticated Request Test
   - Check Token Status

This will tell you exactly where the problem is.

---

## Common Issues & Solutions

### Issue 1: Backend Not Running

**Symptoms:**
- "Cannot connect to backend" error
- Network errors in console
- Test page shows backend connection failed

**Solution:**
```bash
# Start the backend server
cd backend
npm start
```

The backend should start on `http://localhost:10000`

---

### Issue 2: Token Expired

**Symptoms:**
- "Invalid or expired token" error
- Token check shows "EXPIRED"
- Was working before, stopped working after 8 hours

**Solution:**
Tokens expire after 8 hours. Simply log out and log back in:

1. Go to admin panel
2. Click logout (or clear session in test page)
3. Log in again with your credentials

**Why this happens:**
- JWT tokens have a built-in expiration for security
- Current expiration: 8 hours (configured in `backend/src/controllers/auth.controller.js`)
- After expiration, you must log in again to get a new token

---

### Issue 3: Token Not Being Sent

**Symptoms:**
- "No authentication token found" error
- Session cleared unexpectedly
- Token check shows "not set"

**Solution:**

1. **Check if you're logged in:**
   - Open browser DevTools (F12)
   - Go to Application → Local Storage
   - Look for `gt_admin_token` key
   - If missing, log in again

2. **Check for browser issues:**
   - Clear browser cache
   - Try incognito/private mode
   - Try a different browser

---

### Issue 4: CORS Errors

**Symptoms:**
- "CORS policy" errors in console
- Requests blocked by browser
- Backend running but requests fail

**Solution:**

Check `backend/.env` file has correct CORS settings:

```env
CORS_ORIGIN=http://localhost:5173,https://gadvede.com,https://www.gadvede.com
```

If you're running on a different port, add it to the list.

---

### Issue 5: Wrong Credentials

**Symptoms:**
- "Invalid username or password" error
- Cannot log in at all

**Solution:**

Check `backend/.env` file for correct credentials:

```env
ADMIN_USERS=[{"username":"admin","password":"admin123","name":"Admin","role":"Super Admin"}]
```

Use these credentials to log in.

---

### Issue 6: JWT_SECRET Not Configured

**Symptoms:**
- "JWT_SECRET is not configured" error
- Backend logs show JWT errors

**Solution:**

Check `backend/.env` file has JWT_SECRET:

```env
JWT_SECRET=local_dev_jwt_secret_key_for_testing_only_12345678
```

If missing, add it and restart the backend.

---

## Enhanced Error Handling (Already Implemented)

The following improvements have been made to help diagnose issues:

### 1. Better Logging (`src/api/backendClient.js`)
- Logs all authenticated requests
- Shows response status codes
- Logs detailed error messages
- Detects network errors

### 2. Token Expiration Check (`src/data/authStorage.js`)
- Automatically checks if token is expired
- Clears session if token is invalid
- Prevents requests with expired tokens

### 3. Automatic Session Cleanup
- 401 errors automatically clear session
- Redirects to login page when session expires
- Shows clear error messages

### 4. Better Error Messages (`src/hooks/useAdminData.js`)
- Shows which item failed to update
- Logs detailed error information
- Reverts changes on failure

---

## How to Use the Test Page

### 1. Backend Connection Test
- Tests if backend is running
- Shows how many products are available
- **Expected result:** ✅ Backend is running!

### 2. Admin Login Test
- Tests login with your credentials
- Stores token in localStorage
- Shows token expiration time
- **Expected result:** ✅ Login successful!

### 3. Authenticated Request Test
- Tests if token works for admin requests
- Simulates the status toggle operation
- **Expected result:** ✅ Authenticated request successful!

### 4. Check Token Status
- Shows if token is valid or expired
- Shows time remaining until expiration
- Shows user information
- **Expected result:** Token Status: ✅ VALID

### 5. View Session
- Shows all stored session data
- Useful for debugging
- **Expected result:** Shows token and user data

### 6. Clear Session
- Removes all session data
- Use this to force a fresh login
- **Expected result:** ✅ Session cleared!

---

## Debugging Checklist

When you encounter the "Invalid or expired token" error:

- [ ] Backend is running on port 10000
- [ ] You are logged in (check localStorage for `gt_admin_token`)
- [ ] Token is not expired (check with test page)
- [ ] CORS is configured correctly
- [ ] JWT_SECRET is set in backend/.env
- [ ] Admin credentials are correct
- [ ] Browser console shows no network errors

---

## Console Logging

Open browser DevTools (F12) and check the Console tab. You should see:

**On successful status toggle:**
```
apiRequest: Making authenticated request to /api/products/admin/upsert
apiRequest: Response status 200 for /api/products/admin/upsert
useAdminData.toggleActive: Toggling status for Trek Name to true
useAdminData.toggleActive: Successfully synced status change
```

**On authentication error:**
```
apiRequest: Making authenticated request to /api/products/admin/upsert
apiRequest: Response status 401 for /api/products/admin/upsert
apiRequest: 401 Unauthorized - clearing session and redirecting to login
useAdminData.toggleActive: backend sync failed - Your session has expired. Please log in again.
```

---

## Token Lifecycle

1. **Login** → Backend generates JWT token (expires in 8 hours)
2. **Token stored** → Saved in localStorage and sessionStorage
3. **Requests** → Token sent with every admin request
4. **Validation** → Backend verifies token signature and expiration
5. **Expiration** → After 8 hours, token becomes invalid
6. **Logout/Re-login** → Get new token

---

## Production Considerations

### Increase Token Expiration (Optional)

If 8 hours is too short, edit `backend/src/controllers/auth.controller.js`:

```javascript
const token = jwt.sign(
  { username: user.username, name: user.name, role: user.role },
  secret,
  { expiresIn: "24h" } // Change from "8h" to "24h" or longer
);
```

**Security note:** Longer expiration = less secure. Balance convenience vs security.

### Add Token Refresh (Advanced)

For production, consider implementing token refresh:
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (7 days)
- Automatic token renewal before expiration

---

## Still Having Issues?

1. **Run the test page** (`test-auth.html`) and note which test fails
2. **Check browser console** for detailed error messages
3. **Check backend logs** for server-side errors
4. **Try incognito mode** to rule out browser cache issues
5. **Restart both frontend and backend** servers

---

## Files Modified for Better Error Handling

1. `src/api/backendClient.js` - Enhanced logging and error handling
2. `src/data/authStorage.js` - Token expiration checking
3. `src/hooks/useAdminData.js` - Better error messages
4. `test-auth.html` - Diagnostic tool (NEW)

---

## Contact

If you continue to experience issues after following this guide, check:
- Backend logs for detailed error messages
- Network tab in browser DevTools
- Console tab for JavaScript errors

The enhanced logging should now provide clear information about what's failing.
