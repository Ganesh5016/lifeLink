// src/routes/hospitals.js
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const BloodInventory = require('../models/BloodInventory');
const User = require('../models/User');

// Get all hospitals
router.get('/', async (req, res, next) => {
  try {
    const { lat, lng, radius = 20 } = req.query;
    let query = { role: 'hospital', isActive: true };

    let hospitals;
    if (lat && lng) {
      hospitals = await User.find({
        ...query,
        location: {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius) * 1000,
          },
        },
      }).select('name email phone location profileImage hospitalInfo').limit(50);
    } else {
      hospitals = await User.find(query)
        .select('name email phone location profileImage hospitalInfo')
        .limit(100);
    }
    res.json({ hospitals });
  } catch (err) { next(err); }
});

// Get hospital inventory
router.get('/:id/inventory', async (req, res, next) => {
  try {
    const inventory = await BloodInventory.findOne({ hospital: req.params.id });
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });
    res.json({ inventory });
  } catch (err) { next(err); }
});

// Update inventory (hospital only)
router.put('/inventory', protect, authorize('hospital', 'admin'), async (req, res, next) => {
  try {
    const { bloodGroup, units, action, reason } = req.body;
    let inventory = await BloodInventory.findOne({ hospital: req.user.id });

    if (!inventory) {
      inventory = await BloodInventory.create({ hospital: req.user.id });
    }

    const current = inventory.inventory[bloodGroup]?.units || 0;
    if (action === 'added') {
      inventory.inventory[bloodGroup] = { units: current + units, lastUpdated: new Date() };
    } else if (action === 'used' || action === 'expired') {
      inventory.inventory[bloodGroup] = {
        units: Math.max(0, current - units),
        lastUpdated: new Date(),
      };
    }

    inventory.history.push({
      bloodGroup, action, units,
      performedBy: req.user.id,
      reason,
    });

    await inventory.save();
    res.json({ inventory });
  } catch (err) { next(err); }
});

// Hospital dashboard stats
router.get('/dashboard/stats', protect, authorize('hospital'), async (req, res, next) => {
  try {
    const BloodRequest = require('../models/BloodRequest');
    const [inventory, activeRequests, totalRequests] = await Promise.all([
      BloodInventory.findOne({ hospital: req.user.id }),
      BloodRequest.countDocuments({ hospital: req.user.id, status: 'active' }),
      BloodRequest.countDocuments({ hospital: req.user.id }),
    ]);
    res.json({ inventory, activeRequests, totalRequests });
  } catch (err) { next(err); }
});

module.exports = router;
