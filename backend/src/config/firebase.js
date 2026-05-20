// src/config/firebase.js
const admin = require('firebase-admin');
const logger = require('../utils/logger');

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, '');
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, '')?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^["']|["']$/g, '');

  if (!projectId || !privateKey || !clientEmail) {
    logger.error('❌ Firebase Admin SDK config is missing required environment variables:', {
      FIREBASE_PROJECT_ID: projectId ? 'Loaded ✅' : 'MISSING ❌',
      FIREBASE_PRIVATE_KEY: privateKey ? 'Loaded ✅' : 'MISSING ❌',
      FIREBASE_CLIENT_EMAIL: clientEmail ? 'Loaded ✅' : 'MISSING ❌'
    });
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });
    logger.info('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    throw error;
  }
}

module.exports = admin;
