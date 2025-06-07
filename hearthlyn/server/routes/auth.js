const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Provider = require('../models/provider');
const { protect, generateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs'); // Import bcryptjs

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/'); // Directory to store uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});
const upload = multer({ storage: storage });

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required.' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with that email already exists.' });
        }

        user = new User({
            name,
            email,
            password,
            phone,
            role: role || 'user'
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({ message: 'User registered successfully', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Please enter email, password and role' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.role !== role) {
            return res.status(403).json({ message: 'Access denied: Incorrect role selected.' });
        }

        const token = generateToken(user._id);
        res.status(200).json({ message: 'Logged in successfully', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Register a new provider with complete profile
router.post('/provider-register', upload.fields([{ name: 'certificates', maxCount: 5 }, { name: 'identityProof', maxCount: 1 }]), async (req, res) => {
    try {
        const { name, email, phone, age, address, educationalBackground, password } = req.body;
        
        // Basic validation
        if (!name || !phone || !age || !address || !password) {
            return res.status(400).json({ message: 'Please fill in all required fields.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with that email already exists.' });
        }

        // Create a new user with provider role and provided password
        user = new User({
            name,
            email,
            phone,
            password, // Use the password from the request body
            role: 'provider',
            isVerified: false // Admin will verify
        });

        await user.save();

        // Create provider profile
        const provider = new Provider({
            user: user._id,
            services: [], 
            availability: [],
            certifications: req.files['certificates'] ? req.files['certificates'].map(file => ({ name: file.filename, document: file.path })) : [],
            documents: [{ type: 'identityProof', name: req.files['identityProof'][0].filename, verified: false }],
            age,
            address,
            educationalBackground
        });
        await provider.save();

        res.status(201).json({ message: 'Provider registration successful. Awaiting admin verification.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during provider registration.', error: error.message });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user profile
router.patch('/update-profile', protect, async (req, res) => {
    try {
        const { name, email, phone, address, profilePicture } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        if (address) {
            user.address = { ...user.address, ...address };
        }
        user.profilePicture = profilePicture || user.profilePicture;

        await user.save();

        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Change password
router.patch('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 