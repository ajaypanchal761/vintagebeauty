# Render Backend Deployment Guide

## 📋 Prerequisites

1. **MongoDB Database** (MongoDB Atlas recommended)
2. **GitHub repository** with your code
3. **Render account** (free tier works fine)

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string:
   - Click **Connect** → **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database password
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/vintagebeauty?retryWrites=true&w=majority`

### Step 2: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select your repository

### Step 3: Configure Service

**Basic Settings:**
- **Name:** `vintagebeauty-backend` (or your choice)
- **Region:** Choose closest to your users
- **Branch:** `main` (or your default branch)
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

**Environment Variables:**

Add these in Render dashboard:

```env
# Server Configuration
NODE_ENV=production
PORT=10000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vintagebeauty?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# CORS Configuration
# Add your Vercel frontend URL here
CORS_ORIGIN=https://your-vercel-app.vercel.app,https://your-vercel-app.vercel.app/*

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Optional: Email Service (if using)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
```

### Step 4: Deploy

1. Click **Create Web Service**
2. Wait for deployment (first deploy takes 5-10 minutes)
3. Your API will be live at: `https://your-service-name.onrender.com`

### Step 5: Test Your Backend

1. Health Check: `https://your-service-name.onrender.com/health`
2. API Root: `https://your-service-name.onrender.com/`
3. Should return: `{"success": true, "message": "APM Beauty and Perfume API is running"}`

---

## 🔧 Environment Variables Reference

### Required Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `10000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT tokens | `your_secret_key` |
| `CORS_ORIGIN` | Allowed frontend origins | `https://app.vercel.app` |

### Optional Variables:

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

---

## ⚙️ Render Settings

### Auto-Deploy

- ✅ **Auto-Deploy:** Enabled by default
- Deploys automatically on push to main branch

### Health Check

Render automatically checks: `https://your-service.onrender.com/health`

### Scaling

- **Free Tier:** 1 instance, spins down after 15 min inactivity
- **Paid Tier:** Always-on, multiple instances

---

## 🐛 Troubleshooting

### Issue: Build fails

**Common Causes:**
- Missing environment variables
- Wrong build/start commands
- Node version mismatch

**Solution:**
1. Check build logs in Render dashboard
2. Verify all required environment variables are set
3. Check `package.json` for correct scripts

### Issue: Database connection fails

**Solution:**
1. Verify `MONGODB_URI` is correct
2. Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for all IPs)
3. Verify database user has correct permissions

### Issue: CORS errors

**Solution:**
1. Add your Vercel frontend URL to `CORS_ORIGIN`
2. Format: `https://app.vercel.app,https://app.vercel.app/*`
3. Restart service after updating

### Issue: Service spins down (free tier)

**Solution:**
- First request after inactivity takes 30-60 seconds
- Consider upgrading to paid tier for always-on
- Or use a ping service to keep it awake

### Issue: Slow response times

**Solution:**
- Free tier has limited resources
- Upgrade to paid tier for better performance
- Optimize database queries
- Use caching where possible

---

## 🔒 Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use strong `JWT_SECRET` (min 32 characters)
3. ✅ Restrict MongoDB IP whitelist if possible
4. ✅ Use environment variables for all secrets
5. ✅ Enable HTTPS (automatic on Render)

---

## 📝 Notes

- **Free Tier Limitations:**
  - Service spins down after 15 minutes of inactivity
  - First request after spin-down takes time to wake up
  - Limited CPU and memory

- **Custom Domain:**
  - Can add custom domain in Render settings
  - Requires DNS configuration

- **Logs:**
  - View logs in Render dashboard
  - Logs are retained for limited time on free tier

---

## ✅ Post-Deployment Checklist

- [ ] Service deployed successfully
- [ ] Health check endpoint working
- [ ] Database connected
- [ ] Environment variables set
- [ ] CORS configured correctly
- [ ] Test API endpoints
- [ ] Frontend can connect to backend

---

## 🎯 Quick Reference

| Item | URL/Value |
|------|-----------|
| **Service URL** | `https://your-service.onrender.com` |
| **Health Check** | `https://your-service.onrender.com/health` |
| **API Base** | `https://your-service.onrender.com/api` |
| **Port** | `10000` (Render sets this automatically) |

---

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Check MongoDB Atlas connection
3. Verify all environment variables
4. Test endpoints with Postman/curl

