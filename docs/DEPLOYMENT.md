# LifeLink – Complete Deployment Guide

## 🏗 Architecture Overview

```
                    ┌──────────────────────────────────────┐
                    │           CLIENTS                    │
                    │  Next.js Web  ·  React Native App    │
                    └──────────────┬───────────────────────┘
                                   │  HTTPS + WSS
                    ┌──────────────▼───────────────────────┐
                    │      BACKEND (Render.com)             │
                    │   Express.js + Socket.IO server       │
                    └────────┬──────────────┬──────────────┘
                             │              │
              ┌──────────────▼──┐   ┌───────▼──────────────┐
              │  MongoDB Atlas  │   │  Firebase Services   │
              │  (Free M0 Tier) │   │  Auth + FCM + Admin  │
              └─────────────────┘   └──────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │         Cloudinary          │
              │    (Image Storage CDN)      │
              └─────────────────────────────┘
```

---

## 📦 Step 1: MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free account
2. **Create New Project** → Name it "LifeLink"
3. **Build a Database** → Select **Free (M0)** tier
4. Choose **AWS** → Nearest region
5. Set username + password (save these!)
6. **Network Access** → Add IP: `0.0.0.0/0` (allow all for Render)
7. **Connect** → "Connect your application" → Copy connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/lifelink?retryWrites=true&w=majority
   ```
8. Replace `<password>` with your actual password

---

## 🔥 Step 2: Firebase Setup

### Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. **Add Project** → Name: "LifeLink" → Enable Google Analytics
3. Enable **Authentication**:
   - Sign-in methods: Email/Password ✓, Google ✓
4. Enable **Cloud Messaging** (FCM):
   - Project Settings → Cloud Messaging → Note the Server Key

### Get Firebase Web Config
1. Project Overview → Add Web App `</>`
2. Copy the `firebaseConfig` object
3. Add to `frontend/.env.local` as `NEXT_PUBLIC_FIREBASE_*`

### Get Firebase Admin SDK (Backend)
1. Project Settings → Service Accounts
2. **Generate New Private Key** → Download JSON
3. Copy values to backend `.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (replace `\n` with actual newlines)

### Get VAPID Key (Web Push)
1. Project Settings → Cloud Messaging → Web Push certificates
2. Generate key pair → Copy the key
3. Add as `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

---

## ☁️ Step 3: Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com) → Create free account
2. Dashboard → Note your **Cloud Name**, **API Key**, **API Secret**
3. Settings → Upload → Add preset `lifelink` (unsigned)
4. Add to backend `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=123456789
   CLOUDINARY_API_SECRET=abc123xyz
   ```

---

## 📧 Step 4: Email Setup (Gmail SMTP)

1. Go to Google Account → Security → 2-Step Verification (enable it)
2. Security → App Passwords → Generate for "Mail"
3. Add to backend `.env`:
   ```env
   EMAIL_USER=yourname@gmail.com
   EMAIL_PASS=your_16_char_app_password
   ```

---

## 🚀 Step 5: Deploy Backend to Render

1. Push backend code to GitHub repository
2. Go to [render.com](https://render.com) → Sign up free
3. **New** → **Web Service**
4. Connect your GitHub repo
5. Configure:
   ```
   Name: lifelink-backend
   Environment: Node
   Region: Singapore (or nearest)
   Branch: main
   Build Command: npm install
   Start Command: npm start
   ```
6. **Add Environment Variables** (all from your `.env` file)
7. **Create Web Service**
8. Wait ~5 mins for deployment
9. Note your URL: `https://lifelink-backend.onrender.com`

> **Important:** Free Render tier sleeps after 15 min inactivity.
> Use [UptimeRobot](https://uptimerobot.com) to ping every 5 min.

---

## ⚡ Step 6: Deploy Frontend to Vercel

1. Push frontend code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Select your repo
4. Framework: **Next.js** (auto-detected)
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://lifelink-backend.onrender.com/api
   NEXT_PUBLIC_SOCKET_URL=https://lifelink-backend.onrender.com
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   (all other NEXT_PUBLIC_* vars)
   ```
6. **Deploy** → Note your URL: `https://lifelink.vercel.app`

7. Update backend `.env`:
   ```env
   CLIENT_URL=https://lifelink.vercel.app
   ```
   Then redeploy backend.

---

## 📱 Step 7: Build Mobile App

### Prerequisites
```bash
npm install -g eas-cli
eas login
```

### Configure EAS
```bash
cd mobile
eas build:configure
```

### Update Environment
Edit `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://lifelink-backend.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://lifelink-backend.onrender.com
```

### Build Android APK (Free)
```bash
eas build --platform android --profile preview
```
This builds a downloadable APK. Takes ~10-15 min on EAS servers.

### Build for Play Store
```bash
eas build --platform android --profile production
eas submit --platform android
```

### Build for iOS (requires Apple Developer account $99/yr)
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 🌐 Step 8: Custom Domain (Optional - Free)

### Vercel Custom Domain
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add `lifelink.yourdomain.com`
3. Update DNS records at your registrar

### Free domain options:
- [Freenom](https://freenom.com) - .tk, .ml, .ga domains
- [js.org](https://js.org) - for JS projects

---

## 📊 Step 9: Create Admin Account

After deployment, create admin via MongoDB Atlas:

1. Open MongoDB Atlas → Browse Collections
2. Find `users` collection
3. Update one user's role to `"admin"`:
   ```json
   { "$set": { "role": "admin", "isVerified": true } }
   ```

---

## 🔍 Step 10: Monitoring & Uptime

### Backend Health Check
Your backend exposes: `GET /health`

### UptimeRobot (Free)
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add monitor: `https://lifelink-backend.onrender.com/health`
3. Interval: 5 minutes
4. This prevents Render free tier from sleeping!

### Logs
- Render: Dashboard → Your service → Logs
- Vercel: Dashboard → Your project → Functions → Logs

---

## 🔒 Production Security Checklist

- [ ] JWT_SECRET is at least 32 random characters
- [ ] MongoDB Atlas IP whitelist is restricted (not 0.0.0.0/0)
- [ ] Firebase rules are configured
- [ ] Rate limiting is enabled (already in code)
- [ ] CORS is restricted to your domain
- [ ] All environment variables are set (none hardcoded)
- [ ] HTTPS enabled everywhere (Render + Vercel auto-handle this)

---

## 🧪 Testing the Deployment

```bash
# Test backend health
curl https://lifelink-backend.onrender.com/health

# Test auth endpoint
curl -X POST https://lifelink-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test1234","role":"donor","bloodGroup":"O+"}'

# Test nearby donors
curl "https://lifelink-backend.onrender.com/api/donors/nearby?lat=13.08&lng=80.27&radius=10"

# Test requests feed
curl "https://lifelink-backend.onrender.com/api/requests"
```

---

## 🆓 Free Tier Limits Summary

| Service | Free Limit | Notes |
|---------|-----------|-------|
| MongoDB Atlas | 512MB storage | More than enough for startup |
| Render | 750 hrs/month | 1 web service free |
| Vercel | 100GB bandwidth | Unlimited deployments |
| Firebase Auth | 10K users/month | |
| Firebase FCM | Unlimited | Push notifications |
| Cloudinary | 25GB storage, 25GB bandwidth | |
| EAS Build | 30 builds/month | Android APKs |

---

## 🐛 Troubleshooting

### Backend not connecting to MongoDB
```
Error: MongoServerSelectionError
```
Fix: Check MONGODB_URI in Render env vars. Verify IP whitelist in Atlas.

### Firebase auth failing
```
Error: Firebase: Error (auth/invalid-api-key)
```
Fix: Verify all `NEXT_PUBLIC_FIREBASE_*` vars in Vercel.

### Socket.IO not connecting
Fix: Ensure `CLIENT_URL` in backend matches your Vercel domain exactly.
Check CORS configuration in `src/app.js`.

### Render sleeping
Fix: Set up UptimeRobot monitor on `/health` endpoint every 5 min.

### Mobile can't reach backend
Fix: Update `EXPO_PUBLIC_API_URL` in mobile `.env`.
For local dev, use `http://YOUR_LOCAL_IP:5000` instead of `localhost`.
