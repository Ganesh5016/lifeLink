// src/routes/donors.js
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/donorController');

router.get('/nearby', ctrl.getNearbyDonors);
router.get('/leaderboard', ctrl.getLeaderboard);
router.get('/:id', ctrl.getDonorProfile);

router.use(protect);
router.put('/profile', ctrl.updateProfile);
router.put('/availability', ctrl.toggleAvailability);
router.put('/location', ctrl.updateLocation);
router.get('/me/donations', ctrl.getDonationHistory);
router.get('/me/eligibility', ctrl.checkEligibility);

module.exports = router;
