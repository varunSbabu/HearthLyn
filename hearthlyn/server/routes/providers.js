const express = require('express');
const router = express.Router();
const Provider = require('../models/provider');
const { protect, restrictTo } = require('../middleware/auth');

// Get nearby providers
router.get('/nearby', async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 10000 } = req.query;

        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Please provide location coordinates'
            });
        }

        const providers = await Provider.find({
            'address.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            },
            isAvailable: true
        }).populate('user', 'name email phone profileImage');

        res.json({
            success: true,
            count: providers.length,
            data: providers
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get provider profile
router.get('/:id', async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id)
            .populate('user', 'name email phone profileImage')
            .populate('reviews.user', 'name profileImage');

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        res.json({
            success: true,
            data: provider
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Create provider profile
router.post('/', protect, restrictTo('provider'), async (req, res) => {
    try {
        const { services, availability, certifications } = req.body;

        // Check if provider profile already exists
        const existingProvider = await Provider.findOne({ user: req.user.id });
        if (existingProvider) {
            return res.status(400).json({
                success: false,
                message: 'Provider profile already exists'
            });
        }

        const provider = await Provider.create({
            user: req.user.id,
            services,
            availability,
            certifications
        });

        res.status(201).json({
            success: true,
            data: provider
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Update provider profile
router.put('/:id', protect, restrictTo('provider'), async (req, res) => {
    try {
        const { services, availability, certifications, isAvailable } = req.body;

        const provider = await Provider.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { services, availability, certifications, isAvailable },
            { new: true, runValidators: true }
        );

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider profile not found'
            });
        }

        res.json({
            success: true,
            data: provider
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Add review to provider
router.post('/:id/reviews', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;

        const provider = await Provider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        // Check if user has already reviewed
        const existingReview = provider.reviews.find(
            review => review.user.toString() === req.user.id
        );

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this provider'
            });
        }

        provider.reviews.push({
            user: req.user.id,
            rating,
            comment
        });

        // Update average rating
        provider.updateRating();
        await provider.save();

        res.status(201).json({
            success: true,
            data: provider
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router; 