const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Provider = require('../models/provider');
const { protect, restrictTo } = require('../middleware/auth');

// Get user's bookings
router.get('/my-bookings', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('provider', 'user services')
            .populate('provider.user', 'name email phone profileImage');

        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get provider's bookings
router.get('/provider-bookings', protect, async (req, res) => {
    try {
        const provider = await Provider.findOne({ user: req.user.id });
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider profile not found'
            });
        }

        const bookings = await Booking.find({ provider: provider._id })
            .populate('user', 'name email phone profileImage');

        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Create new booking
router.post('/', protect, async (req, res) => {
    try {
        const {
            provider,
            service,
            date,
            startTime,
            endTime,
            duration,
            location,
            notes
        } = req.body;

        // Check if provider exists and is available
        const providerDoc = await Provider.findById(provider);
        if (!providerDoc || !providerDoc.isAvailable) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found or not available'
            });
        }

        // Check if the time slot is available
        const existingBooking = await Booking.findOne({
            provider,
            date,
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked'
            });
        }

        const booking = await Booking.create({
            user: req.user.id,
            provider,
            service,
            date,
            startTime,
            endTime,
            duration,
            location,
            notes,
            totalAmount: duration * service.hourlyRate
        });

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Update booking status
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user is authorized to update
        if (
            booking.user.toString() !== req.user.id &&
            booking.provider.toString() !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking'
            });
        }

        // Check if booking can be cancelled
        if (status === 'cancelled' && !booking.canBeCancelled()) {
            return res.status(400).json({
                success: false,
                message: 'Booking cannot be cancelled less than 24 hours before start time'
            });
        }

        booking.status = status;
        await booking.save();

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Add rating to booking
router.post('/:id/rating', protect, async (req, res) => {
    try {
        const { score, comment } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user is authorized to rate
        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to rate this booking'
            });
        }

        // Check if booking is completed
        if (booking.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only rate completed bookings'
            });
        }

        // Check if already rated
        if (booking.rating.score) {
            return res.status(400).json({
                success: false,
                message: 'Booking already rated'
            });
        }

        booking.rating = {
            score,
            comment,
            date: new Date()
        };

        await booking.save();

        // Update provider's average rating
        const provider = await Provider.findById(booking.provider);
        provider.reviews.push({
            user: req.user.id,
            rating: score,
            comment
        });
        provider.updateRating();
        await provider.save();

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router; 