# Quick Start: Testing the Authentication Fix

## Step 1: Start the Backend

Open a terminal and run:

```bash
cd backend
npm start
```

You should see:
```
Server running on http://localhost:10000
```

**Keep this terminal open!**

---

## Step 2: Start the Frontend

Open a **new terminal** and run:

```bash
npm run dev
```

You should see:
```
VITE v... ready in ...ms
➜  Local:   http://localhost:5173/
```

---

## Step 3: Run the Diagnostic Test

1. Open your browser
2. Navigate to: `http://localhost:5173/test-auth.html`
3. The page will automatically test the backend connection

### Run Each Test:

#### Test 1: Backend Connection
- Click "Test Backend Connection"
- **Expected:** ✅ Backend is running!
- **If failed:** Make sure backend is running on port 10000

#### Test 2: Admin Login
- Username: `admin`
- Password: `admin123`
- Click "Login"
- **Expected:** ✅ Login successful!
- **If failed:** Check backend/.env for correct credentials

#### Test 3: Authenticated Request
- Click "Test Status Toggle"
- **Expected:** ✅ Authenticated request successful!
- **If failed:** This is the error you were experiencing

#### Test 4: Check Token Status
- Click "Check Token Status"
- **Expected:** Token Status: ✅ VALID
- Shows expiration time (should be ~8 hours from login)

---

## Step 4: Test in Admin Panel

1. Go to: `http://localhost:5173/admin/login`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Navigate to "Manage Treks" or "Manage Tours"
4. Try toggling the status of any trek/tour
5. **Expected:** Status should toggle successfully
6. **Check browser console (F12)** for detailed logs

---

## What to Look For in Console

### Successful Toggle:
```
apiRequest: Making authenticated request to /api/products/admin/upsert
apiRequest: Response status 200 for /api/products/admin/upsert
useAdminData.toggleActive: Toggling status for Trek Name to true
useAdminData.toggleActive: Successfully synced status change
```

### If Token Expired:
```
apiRequest: 401 Unauthorized - clearing session and redirecting to login
useAdminData.toggleActive: backend sync failed - Your session has expired. Please log in again.
```

You will be automatically redirected to the login page.

---

## Common Issues

### Backend Not Running
**Error:** "Cannot connect to backend"
**Solution:** Start the backend with `cd backend && npm start`

### Wrong Port
**Error:** Network errors
**Solution:** Check `.env` file has `VITE_API_BASE_URL=http://localhost:10000`

### Token Expired
**Error:** "Invalid or expired token"
**Solution:** Log out and log back in (tokens expire after 8 hours)

### CORS Error
**Error:** "CORS policy" in console
**Solution:** Check `backend/.env` has `CORS_ORIGIN=http://localhost:5173`

---

## Verification Checklist

After running all tests, verify:

- [ ] Backend is running on port 10000
- [ ] Frontend is running on port 5173
- [ ] Can log in successfully
- [ ] Token is stored in localStorage
- [ ] Can toggle trek/tour status
- [ ] Console shows detailed logs
- [ ] No errors in browser console
- [ ] No errors in backend terminal

---

## Next Steps

If all tests pass:
1. ✅ The authentication system is working correctly
2. ✅ Status toggle should work in admin panel
3. ✅ Error handling is improved with better messages
4. ✅ Token expiration is handled automatically

If any test fails:
1. Check the troubleshooting guide: `ADMIN_AUTH_TROUBLESHOOTING.md`
2. Review console logs for specific errors
3. Verify environment variables in `.env` files
4. Restart both servers and try again

---

## Production Deployment

Before deploying to production:

1. **Update JWT_SECRET** in `backend/.env`:
   ```env
   JWT_SECRET=your_strong_random_secret_here_at_least_32_characters
   ```

2. **Update CORS_ORIGIN** in `backend/.env`:
   ```env
   CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
   ```

3. **Test authentication flow** in production environment

4. **Monitor logs** for any authentication errors

---

## Support Files

- `test-auth.html` - Diagnostic test page
- `ADMIN_AUTH_TROUBLESHOOTING.md` - Detailed troubleshooting guide
- `AUTH_FIX_SUMMARY.md` - Summary of all changes made

---

## Questions?

If you encounter any issues:
1. Run the diagnostic test page
2. Check browser console (F12)
3. Check backend terminal for errors
4. Review the troubleshooting guide

The enhanced logging will show exactly what's happening at each step.
