// src/config/firebase.js
const admin = require('firebase-admin');
const logger = require('../utils/logger');

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, '');
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, '')?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^["']|["']$/g, '');

  if (!projectId || !privateKey || !clientEmail) {
    console.error('❌ Firebase Admin SDK config is missing required environment variables! Raw Values:');
    console.error(`👉 FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? `"${process.env.FIREBASE_PROJECT_ID}"` : '❌ UNDEFINED (Missing in Render Dashboard)'}`);
    console.error(`👉 FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? `"${process.env.FIREBASE_CLIENT_EMAIL}"` : '❌ UNDEFINED (Missing in Render Dashboard)'}`);
    console.error(`👉 FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? `Loaded (${process.env.FIREBASE_PRIVATE_KEY.length} chars) ✅` : '❌ UNDEFINED (Missing in Render Dashboard)'}`);
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
    logger.error(`❌ Failed to initialize Firebase Admin SDK: ${error.message}`);
    throw error;
  }
}

module.exports = admin;
