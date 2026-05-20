# 🩸 LifeLink – Real-Time Blood Donation & Emergency Request System

> A full-stack, production-ready application connecting blood donors with patients in real time.

![LifeLink Banner](https://via.placeholder.com/1200x400/dc2626/ffffff?text=LifeLink+%E2%80%93+Save+Lives+in+Real+Time)

---

## 📋 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Deployment Guide](#deployment-guide)
- [Features](#features)

---

## 🌟 Overview

LifeLink is a real-time blood donation and emergency request platform that:
- Connects donors with patients in emergencies within seconds
- Uses GPS to find nearby donors
- Provides hospitals with blood inventory management
- Enables real-time chat between donor and recipient
- Has an AI-powered matching and fraud detection system

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, Framer Motion, ShadCN |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB Atlas (free tier) |
| Auth | Firebase Auth (free tier) + JWT |
| Maps | OpenStreetMap + Leaflet.js |
| Notifications | Firebase Cloud Messaging |
| Images | Cloudinary (free tier) |
| Hosting | Vercel (frontend) + Render (backend) |
| Mobile | React Native + Expo |

---

## 📁 Project Structure

```
lifelink/
├── backend/          # Node.js + Express API server
│   └── src/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       ├── socket/
│       └── utils/
├── frontend/         # Next.js web application
│   └── src/
│       ├── app/      # App router pages
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── store/
├── mobile/           # React Native + Expo app
│   └── src/
│       ├── screens/
│       ├── components/
│       ├── navigation/
│       └── services/
└── docs/             # Documentation
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- Firebase project (free)
- Cloudinary account (free)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/lifelink.git
cd lifelink

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install

# Install mobile
cd ../mobile && npm install
```

### 2. Setup Environment Variables
See [Environment Variables](#environment-variables) section.

### 3. Start Development

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Mobile
cd mobile && npx expo start
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lifelink

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (NodeMailer - Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# FCM
FCM_SERVER_KEY=your_fcm_server_key

# Client URL
CLIENT_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Mobile (`mobile/.env`)
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
```

---

## 🌐 Deployment Guide

### Backend → Render (Free Tier)
1. Push code to GitHub
2. Create new Web Service on [render.com](https://render.com)
3. Connect your GitHub repo
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. Add all environment variables
7. Deploy!

### Frontend → Vercel (Free Tier)
1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set framework: Next.js
4. Add environment variables
5. Deploy!

### Database → MongoDB Atlas (Free Tier)
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free M0 cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (for Render)
5. Get connection string

---

## 📖 API Documentation

Base URL: `https://your-backend.render.com/api`

### Auth Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/firebase` | Firebase token auth |
| POST | `/auth/forgot-password` | Request reset |
| POST | `/auth/reset-password` | Reset password |
| GET | `/auth/me` | Get current user |
| POST | `/auth/refresh` | Refresh JWT |

### Donor Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/donors` | Get all donors (filterable) |
| GET | `/donors/nearby` | Get nearby donors |
| POST | `/donors/profile` | Update donor profile |
| PUT | `/donors/availability` | Toggle availability |
| GET | `/donors/:id` | Get donor by ID |
| POST | `/donors/donation` | Log donation |

### Request Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/requests` | Create blood request |
| GET | `/requests` | Get all requests |
| GET | `/requests/active` | Get active requests |
| PUT | `/requests/:id/accept` | Accept request |
| PUT | `/requests/:id/complete` | Complete donation |
| DELETE | `/requests/:id` | Cancel request |

### Hospital Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hospitals` | Get all hospitals |
| POST | `/hospitals/inventory` | Update blood inventory |
| GET | `/hospitals/:id/inventory` | Get hospital inventory |
| POST | `/hospitals/request` | Hospital blood request |

---

## ✨ Features

### 🆘 Emergency System
- One-click SOS blood request
- Auto-broadcasts to nearby donors
- Real-time countdown timer
- Priority level system (Critical/High/Medium)

### 🗺 Live Maps
- Donor location tracking
- Nearby hospital finder
- Route navigation
- Real-time updates via Socket.IO

### 🏆 Gamification
- Donation streak badges
- Leaderboard
- Reward points
- Digital certificates (PDF)

### 🤖 AI Features
- Smart donor matching
- Blood shortage prediction
- Fraud detection
- Emergency prioritization

### 💬 Real-time Chat
- Donor ↔ Patient messaging
- File/document sharing
- Read receipts
- Online status

---

## 📱 Mobile App

Built with React Native + Expo:
- Available for iOS and Android
- Offline support
- Push notifications
- Biometric authentication
- QR code scanning

Build APK:
```bash
cd mobile
npx expo build:android
```

---

## 🔒 Security

- JWT with refresh tokens
- Bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min)
- CORS protection
- Helmet.js security headers
- MongoDB injection prevention
- XSS protection
- Input validation (Joi)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## 📄 License

MIT License – See [LICENSE](LICENSE) for details.

---

Made with ❤️ to save lives. Every second counts.
