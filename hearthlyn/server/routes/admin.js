const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Provider = require('../models/provider');
const Booking = require('../models/booking');
const { protect, restrictTo } = require('../middleware/auth');

// Protect all admin routes
router.use(protect);
router.use(restrictTo('admin'));

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalProviders = await Provider.countDocuments();
        const activeBookings = await Booking.countDocuments({ status: { $in: ['pending', 'confirmed'] } });
        
        // Calculate total revenue from completed bookings
        const completedBookings = await Booking.find({ status: 'completed' });
        const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

        res.json({
            totalUsers,
            totalProviders,
            activeBookings,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
});

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get all providers
router.get('/providers', async (req, res) => {
    try {
        const providers = await Provider.find().populate('user', 'name email phone');
        res.json(providers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching providers', error: error.message });
    }
});

// Verify/Unverify user
router.patch('/users/:id/verify', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isVerified = !user.isVerified;
        await user.save();

        res.json({ message: `User ${user.isVerified ? 'verified' : 'unverified'} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user verification', error: error.message });
    }
});

// Block/Unblock user
router.patch('/users/:id/block', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user block status', error: error.message });
    }
});

// Verify/Unverify provider
router.patch('/providers/:id/verify', async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found' });
        }

        provider.isVerified = !provider.isVerified;
        await provider.save();

        res.json({ message: `Provider ${provider.isVerified ? 'verified' : 'unverified'} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating provider verification', error: error.message });
    }
});

// Block/Unblock provider
router.patch('/providers/:id/block', async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found' });
        }

        provider.isBlocked = !provider.isBlocked;
        await provider.save();

        res.json({ message: `Provider ${provider.isBlocked ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating provider block status', error: error.message });
    }
});

module.exports = router; 