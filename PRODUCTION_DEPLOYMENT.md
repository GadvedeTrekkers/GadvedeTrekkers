# Production Deployment Guide - www.gadvede.com

## 🌐 Domain Architecture

```
www.gadvede.com          → Frontend (Public Website)
gadvede.com              → Redirects to www.gadvede.com
admin.gadvede.com        → Backend (Admin Panel + API)
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Render Account (5 min)

1. Go to: https://render.com
2. Click **"Get Started"**
3. Sign up with GitHub account: `GadvedeTrekkers`
4. Authorize Render to access your repositories

---

### Step 2: Deploy Backend Service (10 min)

#### 2.1 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Select repository: `GadvedeTrekkers/GadvedeTrekkers`
3. Configure:

```
Name: gadvede-backend
Region: Oregon (US West) or closest to your users
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: node src/server.js
Instance Type: Free
```

#### 2.2 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

```bash
# Server Configuration
PORT=10000
NODE_ENV=production

# Keep-Alive (Update after getting your backend URL)
BACKEND_URL=https://admin.gadvede.com

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Admin Authentication
ADMIN_API_KEY=80df155f08e2e82d16e1701f2e2e8978c06c07427324d6d177847ae43dc31907
ADMIN_USERS=[{"username":"admin","password":"YOUR_SECURE_PASSWORD","name":"Admin","role":"Super Admin"}]
JWT_SECRET=your_random_jwt_secret_minimum_32_characters

# CORS - Allowed Origins
CORS_ORIGIN=http://localhost:5173,https://gadvede.com,https://www.gadvede.com

# Gmail Configuration
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

#### 2.3 Deploy
Click **"Create Web Service"**

Wait 3-5 minutes for deployment to complete.

You'll get a URL like: `https://gadvede-backend.onrender.com`

---

### Step 3: Deploy Frontend Service (10 min)

#### 3.1 Create Static Site
1. Click **"New +"** → **"Static Site"**
2. Select repository: `GadvedeTrekkers/GadvedeTrekkers`
3. Configure:

```
Name: gadvede-frontend
Region: Oregon (US West) or closest to your users
Branch: main
Root Directory: (leave empty)
Build Command: npm install && npm run build
Publish Directory: dist
```

#### 3.2 Add Environment Variables

```bash
# Backend API URL (Use your backend URL from Step 2)
VITE_API_BASE_URL=https://admin.gadvede.com

# Admin API Key (Must match backend)
VITE_ADMIN_API_KEY=80df155f08e2e82d16e1701f2e2e8978c06c07427324d6d177847ae43dc31907

# Supabase Credentials (Same as backend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### 3.3 Deploy
Click **"Create Static Site"**

Wait 3-5 minutes for deployment to complete.

You'll get a URL like: `https://gadvede-frontend.onrender.com`

---

### Step 4: Add Custom Domains on Render (5 min)

#### 4.1 Backend Custom Domain

1. Go to **gadvede-backend** service
2. Click **"Settings"** → **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Enter: `admin.gadvede.com`
5. Click **"Save"**

Render will show you DNS records like:
```
Type: CNAME
Name: admin
Value: gadvede-backend.onrender.com
```

#### 4.2 Frontend Custom Domains

1. Go to **gadvede-frontend** service
2. Click **"Settings"** → **"Custom Domain"**
3. Add **TWO** domains:
   - `www.gadvede.com`
   - `gadvede.com`

Render will show you DNS records like:
```
Type: CNAME
Name: www
Value: gadvede-frontend.onrender.com

Type: A
Name: @
Value: [Render IP address]
```

---

### Step 5: Configure DNS at Domain Registrar (10 min)

Go to your domain registrar (GoDaddy, Namecheap, Google Domains, etc.)

#### 5.1 Find DNS Settings
- Look for: "DNS Management", "DNS Settings", or "Nameservers"

#### 5.2 Add DNS Records

**For Frontend (www.gadvede.com):**
```
Type    Name    Value                              TTL
CNAME   www     gadvede-frontend.onrender.com      3600
A       @       [IP from Render]                   3600
```

**For Backend (admin.gadvede.com):**
```
Type    Name    Value                              TTL
CNAME   admin   gadvede-backend.onrender.com       3600
```

#### 5.3 Save Changes

DNS propagation takes 5 minutes to 48 hours (usually 15-30 minutes)

---

### Step 6: Enable SSL/HTTPS (Automatic)

Render automatically provisions SSL certificates for custom domains.

After DNS propagates:
1. Go to each service → Settings → Custom Domain
2. You'll see "Certificate Status: Active" ✅
3. Your sites will be accessible via HTTPS

---

### Step 7: Update Environment Variables (5 min)

After custom domains are active, update URLs:

#### Backend Environment:
```bash
BACKEND_URL=https://admin.gadvede.com
CORS_ORIGIN=http://localhost:5173,https://gadvede.com,https://www.gadvede.com
```

#### Frontend Environment:
```bash
VITE_API_BASE_URL=https://admin.gadvede.com
```

Click **"Save Changes"** on both services.

They will automatically redeploy.

---

## ✅ Final URLs

After everything is set up:

### Public Website (Users):
- https://www.gadvede.com
- https://gadvede.com (redirects to www)

### Admin Panel (You):
- https://admin.gadvede.com/admin (Login page)
- https://admin.gadvede.com/api/* (API endpoints)

---

## 🧪 Testing Checklist

### Test Frontend:
- [ ] Visit: https://www.gadvede.com
- [ ] Should load public website
- [ ] Check all pages work
- [ ] Test booking forms

### Test Backend API:
- [ ] Visit: https://admin.gadvede.com/api/health
- [ ] Should return: `{"success":true,"status":"ok"}`

### Test Admin Panel:
- [ ] Visit: https://admin.gadvede.com/admin
- [ ] Should show admin login page
- [ ] Login with your credentials
- [ ] Should access admin dashboard
- [ ] Test adding/editing products

---

## 🔐 Security Checklist

- [ ] Strong admin password set
- [ ] JWT secret is random and secure
- [ ] Gmail app password (not regular password)
- [ ] Supabase service role key kept secret
- [ ] CORS only allows your domains
- [ ] SSL/HTTPS enabled on all domains

---

## 📊 Monitoring

### Render Dashboard:
- Monitor deployment logs
- Check service health
- View bandwidth usage
- Monitor build times

### Set Up Alerts:
1. Go to service → Settings → Notifications
2. Add your email for deployment failures
3. Enable health check notifications

---

## 💰 Cost Breakdown

### Render Free Tier:
- ✅ Backend: Free (sleeps after 15 min inactivity)
- ✅ Frontend: Free (always on)
- ✅ SSL Certificates: Free
- ✅ Custom Domains: Free

### Keep-Alive Service:
- ✅ Already implemented in your code
- ✅ Pings backend every 14 minutes
- ✅ Prevents sleeping

### Domain Cost:
- 💵 ~$10-15/year (already purchased)

**Total Monthly Cost: $0** (with free tier)

---

## 🚀 Upgrade Options (Optional)

If you need better performance:

### Render Paid Plans:
- **Starter ($7/month)**: No sleeping, faster builds
- **Standard ($25/month)**: More resources, priority support

### When to Upgrade:
- High traffic (1000+ daily visitors)
- Need faster response times
- Want 24/7 uptime guarantee

---

## 🔄 Deployment Workflow

After initial setup, future updates are automatic:

1. Make changes locally
2. Commit to git: `git commit -m "Update feature"`
3. Push to GitHub: `git push`
4. Render automatically deploys both services
5. Changes live in 3-5 minutes

---

## 🆘 Troubleshooting

### Domain not working:
- Wait 30 minutes for DNS propagation
- Check DNS records are correct
- Use https://dnschecker.org to verify

### Backend shows 503 error:
- Check environment variables are set
- Check Supabase credentials are correct
- View logs in Render dashboard

### Frontend blank page:
- Check VITE_API_BASE_URL is correct
- Check browser console for errors
- Verify backend is running

### Admin login fails:
- Verify ADMIN_API_KEY matches in both services
- Check ADMIN_USERS JSON is valid
- Check JWT_SECRET is set

### CORS errors:
- Add frontend domain to CORS_ORIGIN
- Redeploy backend
- Clear browser cache

---

## 📞 Support Resources

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Supabase Docs: https://supabase.com/docs
- Your deployment guides in repo

---

## 🎯 Quick Reference

### Render Dashboard:
https://dashboard.render.com

### Your Services:
- Backend: gadvede-backend
- Frontend: gadvede-frontend

### Your Domains:
- Public: www.gadvede.com
- Admin: admin.gadvede.com

### Login Credentials:
- Username: admin
- Password: [Set in ADMIN_USERS]

---

## ✨ Next Steps After Deployment

1. **Test everything thoroughly**
2. **Add your content** (treks, tours, etc.)
3. **Set up Google Analytics** (optional)
4. **Submit sitemap to Google** (optional)
5. **Share with users!** 🎉
