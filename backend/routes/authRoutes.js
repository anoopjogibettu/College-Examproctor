const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, stream, branch, specialization, year } = req.body;
        
        // Enforce MITE email restriction
        if (!email.endsWith('@mite.ac.in')) {
            return res.status(400).json({ message: 'Registration is restricted to @mite.ac.in email addresses only.' });
        }
        
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a 6-character unique ID strictly containing both numbers and letters
        let uid;
        let isUnique = false;
        
        const generateMixedUID = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const nums = '0123456789';
            // Pick 4 letters and 2 numbers to guarantee a mix
            let arr = [];
            for (let i = 0; i < 4; i++) arr.push(chars.charAt(Math.floor(Math.random() * chars.length)));
            for (let i = 0; i < 2; i++) arr.push(nums.charAt(Math.floor(Math.random() * nums.length)));
            // Shuffle
            return arr.sort(() => 0.5 - Math.random()).join('');
        };

        while (!isUnique) {
            uid = generateMixedUID();
            const existingUid = await User.findOne({ uid });
            if (!existingUid) isUnique = true;
        }

        const user = await User.create({
            name,
            email,
            uid,
            password: hashedPassword,
            role: role || 'student',
            stream: stream || 'Engineering',
            branch: branch || '',
            specialization: specialization || '',
            year: year || 1
        });

        res.status(201).json({ _id: user.id, name: user.name, email: user.email, role: user.role, uid: user.uid, stream: user.stream, specialization: user.specialization });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = generateToken(user._id, user.role, user.stream);
            user.activeToken = token;

            // Automatically patch legacy users lacking a structured UID
            if (!user.uid) {
                const generateMixedUID = () => {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    const nums = '0123456789';
                    let arr = [];
                    for (let i = 0; i < 4; i++) arr.push(chars.charAt(Math.floor(Math.random() * chars.length)));
                    for (let i = 0; i < 2; i++) arr.push(nums.charAt(Math.floor(Math.random() * nums.length)));
                    return arr.sort(() => 0.5 - Math.random()).join('');
                };
                let newUid;
                let isUnique = false;
                while (!isUnique) {
                    newUid = generateMixedUID();
                    const existingUid = await User.findOne({ uid: newUid });
                    if (!existingUid) isUnique = true;
                }
                user.uid = newUid;
            }

            await User.updateOne({ _id: user._id }, {
                $set: {
                    activeToken: token,
                    uid: user.uid
                }
            });

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                uid: user.uid,
                stream: user.stream,
                specialization: user.specialization,
                hasFaceRegistered: user.faceEncoding && user.faceEncoding.length > 0,
                token
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('LOGIN ERROR:', error);
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
});

// Save Face Encoding
router.post('/face-register', protect, async (req, res) => {
    try {
        const { faceEncoding } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.updateOne({ _id: user._id }, { $set: { faceEncoding } });

        res.json({ message: 'Face registered successfully' });
    } catch (error) {
        console.error('FATAL FACE-REGISTER ERROR:', error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});

// Get User Profile (Includes face encoding for monitoring + uid)
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ message: 'There is no user with that email' });
        }

        // Get reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set expire (10 mins)
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Create reset url - reads from frontend env variable in production
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested a password reset.\n\nClick the link below to reset your password (valid for 10 minutes):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'ProctorAI - Password Reset Request',
                message
            });

            res.status(200).json({ message: 'Email sent' });
        } catch (err) {
            console.error('Email sending error:', err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            return res.status(500).json({ message: 'Email could not be sent. Please check your SMTP settings in backend/.env' });
        }
    } catch (error) {
        console.error('FORGOT PASSWORD ERROR:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Reset Password
router.put('/reset-password/:token', async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token or token has expired' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        // Generate a new token so the user can immediately log in if needed
        const token = generateToken(user._id, user.role, user.stream);

        res.status(200).json({ message: 'Password updated successfully', token });
    } catch (error) {
        console.error('RESET PASSWORD ERROR:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

const generateToken = (id, role, stream) => {
    return jwt.sign({ id, role, stream }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = router;
