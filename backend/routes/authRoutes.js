const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const UserOTP = require('../models/UserOTP');

const router = express.Router();

// Send OTP for Registration
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email.endsWith('@mite.ac.in')) {
            return res.status(400).json({ message: 'Registration is restricted to @mite.ac.in email addresses only.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        await UserOTP.findOneAndUpdate(
            { email },
            { otp, expiresAt: Date.now() + 10 * 60 * 1000 },
            { upsert: true, new: true }
        );

        await sendEmail({
            email,
            subject: 'MITE Exam Portal - Registration OTP',
            message: `Your OTP for account registration is: ${otp}\n\nThis code is valid for 10 minutes.\n\nAccess the portal here: https://collageexamportal.vercel.app/`
        });

        res.json({ message: 'OTP sent to email.' });
    } catch (error) {
        console.error('SEND-OTP ERROR:', error);
        res.status(500).json({ message: 'Failed to send OTP.' });
    }
});

// Register User (Modified to require OTP)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, stream, branch, specialization, year, otp } = req.body;
        
        if (!email.endsWith('@mite.ac.in')) {
            return res.status(400).json({ message: 'Registration is restricted to @mite.ac.in email addresses only.' });
        }
        
        // Verify OTP
        const otpRecord = await UserOTP.findOne({ email });
        if (!otpRecord || otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate UID logic
        const generateMixedUID = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const nums = '0123456789';
            let arr = [];
            for (let i = 0; i < 4; i++) arr.push(chars.charAt(Math.floor(Math.random() * chars.length)));
            for (let i = 0; i < 2; i++) arr.push(nums.charAt(Math.floor(Math.random() * nums.length)));
            return arr.sort(() => 0.5 - Math.random()).join('');
        };

        let uid;
        let isUnique = false;
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

        // Delete OTP after successful registration
        await UserOTP.deleteOne({ email });

        res.status(201).json({ _id: user.id, name: user.name, email: user.email, role: user.role, uid: user.uid, stream: user.stream, specialization: user.specialization });
    } catch (error) {
        console.error('REGISTER ERROR:', error);
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

        // Get reset OTP (6 digits)
        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

        // Use UserOTP model for reset OTP as well
        await UserOTP.findOneAndUpdate(
            { email: user.email },
            { otp: resetOtp, expiresAt: Date.now() + 10 * 60 * 1000 },
            { upsert: true, new: true }
        );

        const message = `You are receiving this email because you (or someone else) has requested a password reset.\n\nYour Password Reset OTP is: ${resetOtp}\n\nThis code is valid for 10 minutes.\n\nAccess the portal to continue: https://collageexamportal.vercel.app/\n\nIf you did not request this, please ignore this email.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'ProctorAI - Password Reset OTP',
                message
            });

            res.status(200).json({ message: 'Reset OTP sent to email' });
        } catch (err) {
            console.error('Email sending error:', err);
            return res.status(500).json({ message: 'Email could not be sent. Please check SMTP settings.' });
        }
    } catch (error) {
        console.error('FORGOT PASSWORD ERROR:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Reset Password (Modified to use OTP)
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        const otpRecord = await UserOTP.findOne({ email });
        if (!otpRecord || otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        // Delete OTP after success
        await UserOTP.deleteOne({ email });

        // Generate a new token
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
