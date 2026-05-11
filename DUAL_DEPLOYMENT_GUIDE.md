# Dual Deployment Guide - Separated Admin Panel

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  www.gadvede.com (Frontend - Static Site)                  │
│  ├─ Public website for users                               │
│  ├─ Treks, Tours, Bookings                                 │
│  ├─ NO admin routes                                        │
│  └─ Deployed as: gadvede-frontend                          │
│                                                             │
│  admin.gadvede.com (Backend - Node.js Server)              │
│  ├─ Admin Panel UI (served as static files)                │
│  ├─ API endpoints (/api/*)                                 │
│  ├─ Full admin dashboard                                   │
│  └─ Deployed as: gadvede-backend                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 How It Works

### Frontend Build (Public Website)
- Builds to: `dist/`
- Includes: Home, Treks, Tours, Contact, etc.
- Excludes: Admin routes (they won't work here)
- Command: `npm run build`

### Admin Build (Admin Panel)
- Builds to: `backend/admin-dist/`
- Includes: ONLY admin panel pages
- Served by: Express backend
- Command: `npm run build:admin`

### Backend Server
- Serves: Admin panel static files + API
- Routes:
  - `/api/*` → API endpoints
  - `/*` → Admin panel (React app)

---

## 🚀 Deployment Process

### Step 1: Deploy Backend (Admin Panel + API)

**On Render:**
1. Create Web Service
2. Repository: `GadvedeTrekkers/GadvedeTrekkers`
3. Build Command:
   ```bash
   cd .. && npm install && npm run build:admin && cd backend && npm install
   ```
4. Start Command:
   ```bash
   node src/server.js
   ```
5. Environment Variables:
   ```bash
   NODE_ENV=production
   BACKEND_URL=https://admin.gadvede.com
   VITE_API_BASE_URL=https://admin.gadvede.com
   # ... (all other backend env vars)
   ```

**What happens:**
1. Installs root dependencies
2. Builds admin panel → `backend/admin-dist/`
3. Installs backend dependencies
4. Starts Express server
5. Server serves admin panel at root `/`
6. Server serves API at `/api/*`

### Step 2: Deploy Frontend (Public Website)

**On Render:**
1. Create Static Site
2. Repository: `GadvedeTrekkers/GadvedeTrekkers`
3. Build Command:
   ```bash
   npm install && npm run build
   ```
4. Publish Directory: `dist`
5. Environment Variables:
   ```bash
   VITE_API_BASE_URL=https://admin.gadvede.com
   # ... (all other frontend env vars)
   ```

**What happens:**
1. Installs dependencies
2. Builds public website → `dist/`
3. Deploys static files
4. Users access public website

---

## 🌐 URL Structure

### Public Website (www.gadvede.com)
```
https://www.gadvede.com/              → Home
https://www.gadvede.com/treks         → Treks listing
https://www.gadvede.com/tours         → Tours listing
https://www.gadvede.com/contact       → Contact page
https://www.gadvede.com/admin         → 404 (admin not here!)
```

### Admin Panel (admin.gadvede.com)
```
https://admin.gadvede.com/            → Admin login
https://admin.gadvede.com/admin       → Admin login
https://admin.gadvede.com/admin/dashboard → Dashboard
https://admin.gadvede.com/api/health  → API health check
https://admin.gadvede.com/api/products → API endpoint
```

---

## 📝 Environment Variables

### Backend (admin.gadvede.com)

```bash
# Server
PORT=10000
NODE_ENV=production
BACKEND_URL=https://admin.gadvede.com

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin Auth
ADMIN_API_KEY=80df155f08e2e82d16e1701f2e2e8978c06c07427324d6d177847ae43dc31907
ADMIN_USERS=[{"username":"admin","password":"your_password","name":"Admin","role":"Super Admin"}]
JWT_SECRET=your_jwt_secret_32_chars_min

# CORS
CORS_ORIGIN=http://localhost:5173,https://gadvede.com,https://www.gadvede.com

# Gmail
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Frontend Build (for admin panel)
VITE_API_BASE_URL=https://admin.gadvede.com
VITE_ADMIN_API_KEY=80df155f08e2e82d16e1701f2e2e8978c06c07427324d6d177847ae43dc31907
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Frontend (www.gadvede.com)

```bash
# Backend API
VITE_API_BASE_URL=https://admin.gadvede.com

# Admin API Key (for API calls)
VITE_ADMIN_API_KEY=80df155f08e2e82d16e1701f2e2e8978c06c07427324d6d177847ae43dc31907

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🧪 Testing Locally

### Test Backend (Admin Panel + API)

1. **Build admin panel:**
   ```bash
   npm run build:admin
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

3. **Test:**
   - Admin Panel: http://localhost:10000/
   - Admin Login: http://localhost:10000/admin
   - API Health: http://localhost:10000/api/health

### Test Frontend (Public Website)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Test:**
   - Public Site: http://localhost:5173/
   - Treks: http://localhost:5173/treks
   - Admin: http://localhost:5173/admin (should redirect or 404)

---

## 🔍 Troubleshooting

### Admin panel shows blank page on backend
**Problem:** Admin build not created or not found

**Solution:**
```bash
# Build admin panel
npm run build:admin

# Check if files exist
ls backend/admin-dist

# Restart backend
cd backend
npm start
```

### API returns 404 on admin.gadvede.com
**Problem:** Route conflict with admin panel

**Solution:** Check `backend/src/app.js`:
- API routes should be defined BEFORE static file serving
- API routes should start with `/api/`

### Frontend can't access admin panel
**Problem:** Admin panel is on different domain

**Solution:** This is correct! Frontend should NOT have admin access.
- Users: www.gadvede.com
- Admin: admin.gadvede.com

### CORS errors from frontend
**Problem:** Backend CORS not configured

**Solution:** Add frontend domain to `CORS_ORIGIN`:
```bash
CORS_ORIGIN=https://gadvede.com,https://www.gadvede.com
```

---

## 📦 Build Commands Reference

```bash
# Build public website (frontend)
npm run build

# Build admin panel (for backend)
npm run build:admin

# Build both
npm run build && npm run build:admin

# Start backend (serves admin panel)
cd backend && npm start

# Start frontend dev server
npm run dev
```

---

## 🎯 Deployment Checklist

### Before Deployment:
- [ ] Supabase credentials ready
- [ ] Gmail app password ready
- [ ] Strong admin password chosen
- [ ] JWT secret generated
- [ ] Domain DNS configured

### Backend Deployment:
- [ ] Create Render web service
- [ ] Set build command with admin build
- [ ] Add all environment variables
- [ ] Add custom domain: admin.gadvede.com
- [ ] Verify admin panel loads
- [ ] Verify API endpoints work

### Frontend Deployment:
- [ ] Create Render static site
- [ ] Set correct build command
- [ ] Add environment variables
- [ ] Add custom domains: gadvede.com, www.gadvede.com
- [ ] Verify public site loads
- [ ] Verify no admin access

### Post-Deployment:
- [ ] Test admin login at admin.gadvede.com
- [ ] Test API calls from frontend
- [ ] Test public website functionality
- [ ] Verify CORS working
- [ ] Test keep-alive service

---

## 🔐 Security Notes

1. **Admin panel is completely separate** from public website
2. **Different domains** prevent unauthorized access
3. **CORS configured** to only allow your domains
4. **Admin routes** not exposed on public frontend
5. **API authentication** required for sensitive endpoints

---

## 💡 Benefits of This Setup

✅ **Security:** Admin panel isolated from public site
✅ **Performance:** Static frontend loads fast
✅ **Scalability:** Can scale frontend and backend independently
✅ **Maintenance:** Clear separation of concerns
✅ **Professional:** Clean URL structure
✅ **Cost:** Free tier on Render for both services

---

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Verify environment variables
3. Test locally first
4. Check browser console for errors
5. Verify DNS propagation

---

## 🎉 Success!

Once deployed:
- **Users visit:** www.gadvede.com
- **You manage:** admin.gadvede.com
- **API serves:** admin.gadvede.com/api/*

Clean, professional, and secure! 🚀
