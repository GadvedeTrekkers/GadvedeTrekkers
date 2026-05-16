# Quick Deployment Guide

## 🚀 Deploy in 5 Steps

### Step 1: Secure Your Secrets

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - you'll need it for Step 3.

---

### Step 2: Update Backend Environment Variables on Render

1. Go to: https://dashboard.render.com
2. Select your backend service
3. Go to **Environment** tab
4. Update these variables:

```
JWT_SECRET = [paste the secret from Step 1]
ADMIN_USERS = [{"username":"admin","password":"YourNewStrongPassword","name":"Admin","role":"Super Admin"}]
SUPABASE_URL = https://qgiqkxxwoyqffozgvbvi.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaXFreHh3b3lxZmZvemd2YnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTEzODQsImV4cCI6MjA4NDc2NzM4NH0.LufpdVhrHr-yrrC-45AL-69s_YGBhm5qmzdcDGAPAio
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaXFreHh3b3lxZmZvemd2YnZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE5MTM4NCwiZXhwIjoyMDg0NzY3Mzg0fQ.H0hsor0xBiOEFgmE8n3691A4DYcxNAePBDxpoB-ecss
CORS_ORIGIN = https://gadvede.com,https://www.gadvede.com
NODE_ENV = production
BACKEND_URL = https://gadvedetrekkers.onrender.com
```

4. Click **Save Changes**

---

### Step 3: Update Frontend Environment Variables on Netlify

1. Go to: https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Update these variables:

```
VITE_API_BASE_URL = https://gadvedetrekkers.onrender.com
VITE_SUPABASE_URL = https://qgiqkxxwoyqffozgvbvi.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaXFreHh3b3lxZmZvemd2YnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTEzODQsImV4cCI6MjA4NDc2NzM4NH0.LufpdVhrHr-yrrC-45AL-69s_YGBhm5qmzdcDGAPAio
```

4. Click **Save**

---

### Step 4: Deploy

```bash
git add .
git commit -m "Configure production environment"
git push origin main
```

Both Render and Netlify will automatically deploy.

---

### Step 5: Test Production

1. **Wait 2-3 minutes** for deployment to complete

2. **Test Admin Panel:**
   - Go to: `https://gadvedetrekkers.onrender.com/admin/login`
   - Login with your new credentials
   - Try toggling a trek/tour status

3. **Check if it works:**
   - ✅ Can log in
   - ✅ Can toggle status
   - ✅ Changes persist
   - ✅ No errors in console

---

## ⚠️ Important Notes

### 1. Keep .env Files Local
Your `.env` files should **NEVER** be committed to Git. They contain secrets!

### 2. Different Secrets for Production
- Development: Use simple secrets (already set)
- Production: Use strong random secrets (Step 1)

### 3. Admin Password
Change `admin123` to something strong like: `Admin@Gadvede2024!`

---

## 🔍 Verify Deployment

### Check Backend Logs (Render)
1. Go to Render dashboard
2. Click on backend service
3. Click **Logs** tab
4. Look for:
   ```
   Server running on http://localhost:10000
   Supabase Admin Client - URL: https://qgiqkxxwoyqffozgvbvi.supabase.co
   ```

### Check Frontend Build (Netlify)
1. Go to Netlify dashboard
2. Click **Deploys** tab
3. Verify latest deploy is **Published**
4. Check for any build errors

---

## 🐛 If Something Goes Wrong

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set
- Check Supabase credentials are correct

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` is correct
- Check CORS_ORIGIN includes your frontend domain
- Open browser console for detailed errors

### Can't log in to admin panel
- Verify JWT_SECRET is set on backend
- Check ADMIN_USERS format is correct
- Try the test page: `https://gadvedetrekkers.onrender.com/test-auth.html`

---

## 📚 Full Documentation

For detailed information, see:
- `DEPLOYMENT_CHECKLIST.md` - Complete deployment guide
- `ADMIN_AUTH_TROUBLESHOOTING.md` - Troubleshooting guide
- `AUTH_FIX_SUMMARY.md` - What was changed

---

## ✅ You're Done!

Once Step 5 passes, your admin panel is live and working! 🎉

**Admin Panel URL:** https://gadvedetrekkers.onrender.com/admin/login

**Remember to:**
- Save your new admin password securely
- Keep your JWT_SECRET safe
- Never commit `.env` files to Git
