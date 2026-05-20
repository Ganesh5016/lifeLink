// src/controllers/requestController.js
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');
const { sendPushNotification } = require('../utils/fcm');
const { calculateUrgencyScore, detectFraud } = require('../utils/aiHelpers');
const logger = require('../utils/logger');

// ─── Create Blood Request ─────────────────────────────────
exports.createRequest = async (req, res, next) => {
  try {
    const {
      patientName, patientAge, contactNumber, bloodGroup,
      unitsRequired, hospitalName, location, priority,
      medicalReason, isEmergency, requiredBy,
    } = req.body;

    // AI fraud check
    const fraudScore = await detectFraud(req.body, req.user);
    if (fraudScore > 80) {
      logger.warn(`High fraud score (${fraudScore}) for request by ${req.user.id}`);
    }

    // Calculate urgency score
    const urgencyScore = calculateUrgencyScore({ priority, isEmergency, requiredBy });

    const request = await BloodRequest.create({
      requestedBy: req.user.id,
      patientName, patientAge, contactNumber, bloodGroup,
      unitsRequired, hospitalName, location, priority: priority || 'medium',
      medicalReason, isEmergency: isEmergency || false, requiredBy,
      urgencyScore, fraudScore,
    });

    // Find nearby donors and broadcast
    const searchRadius = isEmergency ? 20 : 10; // km
    const nearbyDonors = await User.find({
      role: 'donor',
      bloodGroup: getCompatibleGroups(bloodGroup),
      isAvailable: true,
      isActive: true,
      isBlocked: false,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates,
          },
          $maxDistance: searchRadius * 1000, // meters
        },
      },
    }).limit(50).select('_id fcmTokens name');

    // Notify donors via Socket.IO
    const io = getIO();
    nearbyDonors.forEach(donor => {
      io.to(`user:${donor._id}`).emit('new_emergency_request', {
        request: {
          _id: request._id,
          bloodGroup,
          unitsRequired,
          hospitalName,
          priority: request.priority,
          urgencyScore,
          location: request.location,
          isEmergency,
        },
        distance: 'Nearby',
      });
    });

    // Broadcast to all connected clients in the area
    io.emit('request_feed_update', {
      type: 'new',
      request: { ...request.toJSON(), requestedBy: req.user },
    });

    // Send FCM push notifications
    const fcmTokens = nearbyDonors.flatMap(d => d.fcmTokens).filter(Boolean);
    if (fcmTokens.length > 0) {
      await sendPushNotification(fcmTokens, {
        title: isEmergency ? '🚨 EMERGENCY Blood Request!' : '🩸 Blood Request Nearby',
        body: `${bloodGroup} blood needed at ${hospitalName}. ${unitsRequired} units required.`,
        data: { requestId: request._id.toString(), type: 'blood_request' },
      }).catch(err => logger.warn('FCM failed:', err.message));
    }

    // Save notifications in DB
    const notifications = nearbyDonors.map(donor => ({
      recipient: donor._id,
      type: 'emergency_request',
      title: isEmergency ? '🚨 Emergency Blood Request' : '🩸 Blood Request',
      message: `${bloodGroup} blood needed at ${hospitalName}`,
      priority: isEmergency ? 'critical' : 'high',
      relatedRequest: request._id,
      data: { requestId: request._id },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Update request with notified donors count
    request.notifiedDonors = nearbyDonors.map(d => d._id);
    request.broadcastCount = nearbyDonors.length;
    await request.save();

    await request.populate('requestedBy', 'name email phone');

    res.status(201).json({
      message: 'Blood request created and broadcast to nearby donors',
      request,
      donorsNotified: nearbyDonors.length,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Requests ─────────────────────────────────────
exports.getRequests = async (req, res, next) => {
  try {
    const {
      bloodGroup, priority, status = 'active',
      lat, lng, radius = 50,
      page = 1, limit = 20,
    } = req.query;

    const query = { status };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (priority) query.priority = priority;

    let requests;
    if (lat && lng) {
      requests = await BloodRequest.find({
        ...query,
        location: {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius) * 1000,
          },
        },
      })
        .populate('requestedBy', 'name phone')
        .populate('hospital', 'name hospitalInfo')
        .sort({ urgencyScore: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    } else {
      requests = await BloodRequest.find(query)
        .populate('requestedBy', 'name phone')
        .sort({ urgencyScore: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    }

    const total = await BloodRequest.countDocuments(query);

    res.json({
      requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Request ───────────────────────────────────
exports.getRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('requestedBy', 'name email phone profileImage')
      .populate('responses.donor', 'name bloodGroup profileImage location')
      .populate('hospital', 'name hospitalInfo location');

    if (!request) return res.status(404).json({ error: 'Request not found' });

    res.json({ request });
  } catch (err) {
    next(err);
  }
};

// ─── Accept Request ───────────────────────────────────────
exports.acceptRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status === 'fulfilled') {
      return res.status(400).json({ error: 'Request already fulfilled' });
    }

    const alreadyResponded = request.responses.find(
      r => r.donor.toString() === req.user.id
    );
    if (alreadyResponded) {
      return res.status(400).json({ error: 'You already responded to this request' });
    }

    request.responses.push({
      donor: req.user.id,
      status: 'accepted',
    });

    await request.save();
    await request.populate('requestedBy', 'name email fcmTokens');

    // Notify requester
    const io = getIO();
    io.to(`user:${request.requestedBy._id}`).emit('request_accepted', {
      requestId: request._id,
      donor: req.user,
    });

    // Send notification
    await Notification.create({
      recipient: request.requestedBy._id,
      type: 'request_accepted',
      title: '✅ Donor Found!',
      message: `A donor has accepted your blood request for ${request.bloodGroup}`,
      relatedRequest: request._id,
      priority: 'high',
    });

    res.json({ message: 'Request accepted', request });
  } catch (err) {
    next(err);
  }
};

// ─── Mark Donation Complete ───────────────────────────────
exports.completeDonation = async (req, res, next) => {
  try {
    const { units = 1 } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const response = request.responses.find(
      r => r.donor.toString() === req.user.id && r.status === 'accepted'
    );
    if (!response) return res.status(400).json({ error: 'No accepted response found' });

    response.status = 'donated';
    response.donatedAt = new Date();
    response.units = units;
    request.unitsCollected += units;

    await request.save();

    // Update donor stats
    const donor = await User.findById(req.user.id);
    donor.lastDonationDate = new Date();
    donor.nextEligibleDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    donor.totalDonations += 1;
    donor.rewardPoints += 100;

    // Award badges
    if (donor.totalDonations === 1) {
      donor.badges.push({ name: 'First Drop', icon: '🩸' });
    } else if (donor.totalDonations === 5) {
      donor.badges.push({ name: 'Life Saver', icon: '💉' });
    } else if (donor.totalDonations === 10) {
      donor.badges.push({ name: 'Hero', icon: '🏆' });
    }

    await donor.save();

    res.json({ message: 'Donation recorded successfully', points: donor.rewardPoints });
  } catch (err) {
    next(err);
  }
};

// ─── Cancel Request ───────────────────────────────────────
exports.cancelRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.requestedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    request.status = 'cancelled';
    await request.save();

    const io = getIO();
    io.emit('request_cancelled', { requestId: request._id });

    res.json({ message: 'Request cancelled' });
  } catch (err) {
    next(err);
  }
};

// ─── Stats ────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const [total, active, fulfilled, emergency] = await Promise.all([
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'active' }),
      BloodRequest.countDocuments({ status: 'fulfilled' }),
      BloodRequest.countDocuments({ isEmergency: true, status: 'active' }),
    ]);

    const byBloodGroup = await BloodRequest.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ total, active, fulfilled, emergency, byBloodGroup });
  } catch (err) {
    next(err);
  }
};

// ─── Helpers ──────────────────────────────────────────────
function getCompatibleGroups(bloodGroup) {
  const compatibility = {
    'A+':  ['A+', 'A-', 'O+', 'O-'],
    'A-':  ['A-', 'O-'],
    'B+':  ['B+', 'B-', 'O+', 'O-'],
    'B-':  ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+':  ['O+', 'O-'],
    'O-':  ['O-'],
  };
  return { $in: compatibility[bloodGroup] || [bloodGroup] };
}
