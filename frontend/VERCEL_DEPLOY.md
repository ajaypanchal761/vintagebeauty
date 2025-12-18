# Vercel Deployment Guide - Frontend (Vite + React)

## 📋 Prerequisites

1. **Backend deployed on Render** (or any hosting service)
2. **GitHub repository** with your code
3. **Vercel account** (free tier works fine)

---

## 🚀 Step-by-Step Deployment

### Step 1: Deploy Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `vintagebeauty-backend` (or your choice)
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables in Render:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```
6. Click **Create Web Service**
7. Wait for deployment and copy your Render URL (e.g., `https://vintagebeauty.onrender.com`)

### Step 2: Update Backend CORS Settings

In your Render backend, add your Vercel frontend URL to CORS_ORIGIN:
```
CORS_ORIGIN=https://your-vercel-app.vercel.app,https://your-vercel-app.vercel.app/*
```

### Step 3: Deploy Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure Project:
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `frontend` (click Edit and set to `frontend`)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

### Step 4: Add Environment Variables in Vercel

Go to **Settings** → **Environment Variables** and add:

#### Required Variables:

1. **VITE_API_URL**
   - **Value:** `https://your-backend.onrender.com/api`
   - **Example:** `https://vintagebeauty.onrender.com/api`
   - **Environments:** Production, Preview, Development
   - ⚠️ **Important:** Make sure URL ends with `/api` or the config will add it automatically

#### Optional Variables (if using Firebase):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Step 5: Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Your app will be live at `https://your-project.vercel.app`

---

## 📁 Configuration Files

### vercel.json

The `vercel.json` file is already configured with:

✅ **SPA Routing:** All routes redirect to `/index.html` for React Router  
✅ **Caching:** Static assets cached for 1 year  
✅ **Security Headers:** XSS protection, frame options, etc.  
✅ **Build Settings:** Auto-detected Vite configuration  

**Location:** `frontend/vercel.json`

---

## 🔧 Environment Variables Reference

### Frontend (Vercel) - Required:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

### Backend (Render) - Required:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed on Render and accessible
- [ ] Frontend deployed on Vercel
- [ ] `VITE_API_URL` set correctly in Vercel
- [ ] `CORS_ORIGIN` includes Vercel URL in Render
- [ ] Test API calls from frontend
- [ ] Test all routes (Home, Products, Cart, etc.)
- [ ] Test authentication (Login/Signup)
- [ ] Check browser console for errors

---

## 🐛 Troubleshooting

### Issue: 404 errors on routes (e.g., `/products`, `/cart`)

**Solution:**
- ✅ Already handled by `vercel.json` rewrites
- Make sure `vercel.json` is in `frontend` directory root
- Verify the rewrite rule: `"source": "/(.*)"` → `"destination": "/index.html"`

### Issue: API calls failing / CORS errors

**Solution:**
1. Check `VITE_API_URL` in Vercel environment variables
2. Verify backend URL is correct (should end with `/api`)
3. Check `CORS_ORIGIN` in Render includes your Vercel URL
4. Test backend directly: `https://your-backend.onrender.com/health`
5. Check browser console for exact error message

### Issue: Build fails on Vercel

**Common Causes:**
- ❌ Missing `VITE_API_URL` environment variable
- ❌ Node version mismatch (Vercel uses Node 18+ by default)
- ❌ Build errors in code

**Solution:**
1. Check build logs in Vercel dashboard
2. Add `.nvmrc` file in `frontend` directory:
   ```
   18
   ```
3. Verify all dependencies in `package.json`

### Issue: Images not loading

**Solution:**
- Images should come from Cloudinary (stored in database)
- Check if `VITE_API_URL` is correct
- Verify backend is returning image URLs properly

### Issue: Slow API responses

**Solution:**
- Render free tier spins down after inactivity
- First request may take 30-60 seconds to wake up
- Consider upgrading to paid tier for always-on service

---

## 🔒 Security Notes

- ✅ Security headers configured in `vercel.json`
- ✅ CORS properly configured on backend
- ✅ Environment variables stored securely
- ✅ No sensitive data in frontend code

---

## 📝 Additional Notes

1. **Custom Domain:** You can add a custom domain in Vercel settings
2. **Preview Deployments:** Every push creates a preview URL
3. **Auto Deploy:** Vercel auto-deploys on git push to main branch
4. **Build Cache:** Vercel caches `node_modules` for faster builds

---

## 🎯 Quick Reference

| Service | URL Format | Example |
|---------|-----------|---------|
| **Frontend (Vercel)** | `https://project-name.vercel.app` | `https://vintagebeauty.vercel.app` |
| **Backend (Render)** | `https://project-name.onrender.com` | `https://vintagebeauty.onrender.com` |
| **API Endpoint** | `https://backend-url/api` | `https://vintagebeauty.onrender.com/api` |

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Render deployment logs
3. Check browser console for errors
4. Verify all environment variables are set correctly

