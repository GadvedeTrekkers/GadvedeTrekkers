# Environment Variables for Render Deployment

## 🔧 Backend Service Environment Variables

Copy these to your Render backend service:

```bash
# Server Configuration
PORT=10000
NODE_ENV=production

# Keep-Alive (Update after deployment with your actual backend URL)
BACKEND_URL=https://your-backend-name.onrender.com

# Supabase Credentials
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin Authentication
ADMIN_API_KEY=80df155f08e2e82d16e1701f2e2e8978c06c07427324d6d177847ae43dc31907
ADMIN_USERS=[{"username":"admin","password":"CHANGE_THIS_PASSWORD","name":"Admin","role":"Super Admin"}]
JWT_SECRET=GENERATE_RANDOM_STRING_HERE

# CORS - Update with your actual frontend URL after deployment
CORS_ORIGIN=http://localhost:5173,https://gadvede.com,https://www.gadvede.com,https://your-frontend-name.onrender.com

# Gmail Configuration
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

---

## 🎨 Frontend Service Environment Variables

Copy these to your Render frontend service:

```bash
# Backend API URL (Update after backend is deployed)
VITE_API_BASE_URL=https://your-backend-name.onrender.com

# Admin API Key (Must match backend)
VITE_ADMIN_API_KEY=80df155f08e2e82d16e1701f2e2e8978c06c07427324d6d177847ae43dc31907

# Supabase Credentials (Same as backend)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 📝 How to Fill These In

### 1. Supabase Credentials
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Admin Password
- Change `CHANGE_THIS_PASSWORD` to a strong password
- This is what you'll use to login to admin panel

### 3. JWT Secret
Generate a random string (32+ characters):
```bash
# Option 1: Use online generator
https://randomkeygen.com/

# Option 2: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Gmail App Password
1. Go to: https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Search for "App passwords"
4. Generate new app password for "Mail"
5. Copy the 16-character password

### 5. URLs (After Deployment)
After deploying both services:
1. Copy backend URL → Update `BACKEND_URL` in backend
2. Copy backend URL → Update `VITE_API_BASE_URL` in frontend
3. Copy frontend URL → Add to `CORS_ORIGIN` in backend
4. Redeploy both services

---

## ⚡ Quick Deployment Checklist

- [ ] Create new Render account with your GitHub
- [ ] Deploy backend service
- [ ] Add all backend environment variables
- [ ] Deploy frontend service
- [ ] Add all frontend environment variables
- [ ] Update `BACKEND_URL` with actual backend URL
- [ ] Update `VITE_API_BASE_URL` with actual backend URL
- [ ] Update `CORS_ORIGIN` with actual frontend URL
- [ ] Redeploy both services
- [ ] Test: Backend health check
- [ ] Test: Frontend loads
- [ ] Test: Admin login works

---

## 🔗 Useful Links

- Render Dashboard: https://dashboard.render.com
- Supabase Dashboard: https://supabase.com/dashboard
- GitHub Repository: https://github.com/GadvedeTrekkers/GadvedeTrekkers
- Gmail App Passwords: https://myaccount.google.com/apppasswords
