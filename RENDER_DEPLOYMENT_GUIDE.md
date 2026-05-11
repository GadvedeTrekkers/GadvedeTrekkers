# Render Deployment Guide - Gadvede Trekkers

## 🔗 Deployed URLs
- **Backend**: https://gadvedetrekkers.onrender.com
- **Frontend**: https://gadvedetrekkersfrontend.onrender.com

---

## 🔧 Backend Environment Variables (Render Dashboard)

Go to your backend service on Render → Environment tab and set these variables:

```bash
# Server Configuration
PORT=10000
NODE_ENV=production

# Keep-Alive Configuration
BACKEND_URL=https://gadvedetrekkers.onrender.com

# Supabase Credentials (Get from Supabase Dashboard → Settings → API)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Authentication
ADMIN_API_KEY=80df155f08e2e82d16e1701f2e2e8978c06c07427324d6d177847ae43dc31907
ADMIN_USERS=[{"username":"admin","password":"your_secure_password","name":"Admin","role":"Super Admin"}]
JWT_SECRET=your_long_random_jwt_secret_string_here

# CORS - Allowed Origins
CORS_ORIGIN=http://localhost:5173,https://gadvede.com,https://www.gadvede.com,https://gadvedetrekkersfrontend.onrender.com

# Gmail Configuration (for sending emails)
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### 📝 Notes for Backend:
1. **ADMIN_USERS**: Change `your_secure_password` to a strong password
2. **JWT_SECRET**: Generate a long random string (at least 32 characters)
3. **GMAIL_APP_PASSWORD**: Get this from Google Account → Security → 2-Step Verification → App passwords

---

## 🎨 Frontend Environment Variables (Render Dashboard)

Go to your frontend service on Render → Environment tab and set these variables:

```bash
# Backend API URL
VITE_API_BASE_URL=https://gadvedetrekkers.onrender.com

# Admin API Key (must match backend ADMIN_API_KEY)
VITE_ADMIN_API_KEY=80df155f08e2e82d16e1701f2e2e8978c06c07427324d6d177847ae43dc31907

# Supabase Credentials (Get from Supabase Dashboard → Settings → API)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 📝 Notes for Frontend:
1. **VITE_ADMIN_API_KEY**: Must match the `ADMIN_API_KEY` in backend
2. **Supabase credentials**: Use the same URL and anon key as backend

---

## 🚀 Deployment Steps

### 1. Set Environment Variables on Render

#### Backend Service:
1. Go to https://dashboard.render.com
2. Select your backend service (`gadvedetrekkers`)
3. Click "Environment" in the left sidebar
4. Add all the backend environment variables listed above
5. Click "Save Changes"

#### Frontend Service:
1. Select your frontend service (`gadvedetrekkersfrontend`)
2. Click "Environment" in the left sidebar
3. Add all the frontend environment variables listed above
4. Click "Save Changes"

### 2. Trigger Manual Deploy (if needed)
- Click "Manual Deploy" → "Deploy latest commit"
- Or push a new commit to trigger automatic deployment

### 3. Verify Deployment

#### Backend Health Check:
Visit: https://gadvedetrekkers.onrender.com/api/health

Expected response:
```json
{
  "success": true,
  "status": "ok"
}
```

#### Frontend Admin Page:
Visit: https://gadvedetrekkersfrontend.onrender.com/admin

Should show the admin login page (not blank)

---

## 🔍 Troubleshooting

### Backend shows "Not Found"
- Check if the service is running on Render dashboard
- Verify environment variables are set correctly
- Check the logs for errors

### Admin page is blank
- Verify `VITE_API_BASE_URL` points to correct backend URL
- Check browser console for errors (F12)
- Ensure CORS_ORIGIN includes the frontend URL

### Login fails
- Verify `ADMIN_API_KEY` matches in both frontend and backend
- Check `ADMIN_USERS` JSON is valid
- Verify `JWT_SECRET` is set in backend

### Keep-Alive not working
- Ensure `NODE_ENV=production` in backend
- Verify `BACKEND_URL` is set correctly
- Check backend logs for keep-alive messages

---

## 📋 Quick Checklist

- [ ] Backend environment variables set on Render
- [ ] Frontend environment variables set on Render
- [ ] Supabase credentials added to both services
- [ ] ADMIN_API_KEY matches in frontend and backend
- [ ] CORS_ORIGIN includes frontend URL
- [ ] Backend health check returns success
- [ ] Admin login page loads (not blank)
- [ ] Can login with admin credentials

---

## 🔐 Security Reminders

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for admin accounts
3. **Keep JWT_SECRET secure** and random
4. **Rotate credentials** periodically
5. **Use Gmail App Passwords**, not your actual Gmail password

---

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Check browser console (F12)
3. Verify all environment variables are set
4. Ensure Supabase database is accessible
