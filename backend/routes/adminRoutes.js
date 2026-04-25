const express = require('express');
const Log = require('../models/Log');
const Attempt = require('../models/Attempt');
const { protect, moderatorOrAdmin, mainAdminOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Exam = require('../models/Exam');
const mongoose = require('mongoose');

const router = express.Router();

// Get all logs (exclude heavy snapshotVideo field to prevent memory overflow)
router.get('/logs', protect, moderatorOrAdmin, async (req, res) => {
    try {
        const logs = await Log.aggregate([
            { $addFields: { hasSnapshot: { $cond: { if: { $and: [{ $ne: ['$snapshotVideo', null] }, { $ne: ['$snapshotVideo', ''] }] }, then: true, else: false } } } },
            { $project: { snapshotVideo: 0 } },
            { $sort: { timestamp: -1 } },
            { $limit: 200 },
            { $lookup: { from: 'attempts', localField: 'attemptId', foreignField: '_id', as: 'attemptInfo' } },
            { $unwind: { path: '$attemptInfo', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'exams', localField: 'attemptInfo.examId', foreignField: '_id', as: 'examInfo' } },
            { $unwind: { path: '$examInfo', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userId', pipeline: [{ $project: { name: 1, email: 1, stream: 1, specialization: 1, usn: 1 } }] } },
            { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } }
        ]).option({ allowDiskUse: true });
        
        res.json(logs);
    } catch (error) {
        console.error('Logs fetch error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get a single log's snapshot data (on demand)
router.get('/logs/:id/snapshot', protect, moderatorOrAdmin, async (req, res) => {
    try {
        const log = await Log.findById(req.params.id).select('snapshotVideo');
        if (!log) return res.status(404).json({ message: 'Log not found' });
        res.json({ snapshotVideo: log.snapshotVideo || null });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get all attempts
router.get('/attempts', protect, moderatorOrAdmin, async (req, res) => {
    try {
        const attempts = await Attempt.find({})
            .populate('userId', 'name email stream specialization')
            .populate('examId', 'title questions')
            .sort({ startedAt: -1 });
            
        let result = attempts;
        if (req.user.role === 'moderator') {
            result = attempts.map(a => {
                const doc = a.toObject();
                delete doc.score;
                return doc;
            });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Delete an attempt (Allow student to retake)
router.delete('/attempts/:id', protect, moderatorOrAdmin, async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id);
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

        // Delete associated logs first to free database blobs
        await Log.deleteMany({ attemptId: attempt._id });
        
        // Delete attempt
        await Attempt.deleteOne({ _id: attempt._id });
        
        res.json({ message: 'Attempt and corresponding logs permanently wiped. Student may retake.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Manually grade an attempt (Convert from pending_review to submitted)
router.put('/attempts/:id/grade', protect, moderatorOrAdmin, async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id);
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
        
        const { score } = req.body;
        // The frontend calculates total score (auto MCQ score + manual subjectives score points)
        attempt.score = score;
        attempt.status = 'submitted'; // Mark as formally graded
        
        await attempt.save();
        res.json({ message: 'Attempt graded successfully.', attempt });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users (students and moderators depending on need, mostly just showing standard profiles)
router.get('/users', protect, moderatorOrAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['student', 'moderator'] } })
            .select('-password -faceEncoding')
            .sort({ createdAt: -1 });
        
        // Return a mapped version with a boolean flag indicating if a face is registered
        const result = users.map(u => ({
            _id: u._id,
            uid: u.uid,
            name: u.name,
            email: u.email,
            role: u.role,
            stream: u.stream,
            specialization: u.specialization,
            usn: u.usn,
            collegeDetails: u.collegeDetails,
            hasFaceRegistered: u.faceEncoding && u.faceEncoding.length > 0,
            createdAt: u.createdAt
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get all exams for admin view
router.get('/exams', protect, moderatorOrAdmin, async (req, res) => {
    try {
        const exams = await Exam.find({}).sort({ createdAt: -1 });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Grant / Modify Roles (Main Admin Only)
router.post('/grant-role', protect, mainAdminOnly, async (req, res) => {
    try {
        const { uid, newRole } = req.body;
        if (!['student', 'moderator', 'admin'].includes(newRole)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const normalizedInput = uid.trim().toUpperCase();
        // Support searching by UID OR Email
        const user = await User.findOne({ 
            $or: [
                { uid: normalizedInput },
                { email: normalizedInput.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this UID or Email' });
        }

        // Prevent self-demotion or modifying another Main Admin
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot modify another Admin' });
        }

        await User.updateOne({ _id: user._id }, { $set: { role: newRole } });

        res.json({ message: `Success: ${user.name} is now a ${newRole}` });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Search Student by UID (Comprehensive Report)
router.get('/search/:uid', protect, moderatorOrAdmin, async (req, res) => {
    try {
        const queryInput = req.params.uid.trim();
        console.log(`[AdminSearch] Searching for: "${queryInput}"`);

        // Try searching by UID first (forced uppercase), then by Email (forced lowercase)
        const searchUser = await User.findOne({ 
            $or: [
                { uid: queryInput.toUpperCase() },
                { email: queryInput.toLowerCase() }
            ]
        }).select('-password -faceEncoding');
        
        if (!searchUser) {
            console.warn(`[AdminSearch] User not found for query: "${queryInput}"`);
            return res.status(404).json({ message: 'User not found with this UID or Email' });
        }

        // Fetch all attempts for this user
        const attempts = await Attempt.find({ userId: searchUser._id })
            .populate('examId', 'title')
            .sort({ startedAt: -1 });

        // Fetch all violations (logs) for this user
        const logs = await Log.find({ userId: searchUser._id })
            .populate({
                path: 'attemptId',
                populate: { path: 'examId', select: 'title' }
            })
            .sort({ timestamp: -1 });

        res.json({
            user: searchUser,
            attempts,
            logs
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});

// Update Student Master Details
router.put('/users/:id', protect, mainAdminOnly, async (req, res) => {
    try {
        const { name, email, stream, branch, specialization, year, usn, collegeDetails } = req.body;
        const masterUser = await User.findById(req.params.id);
        if (!masterUser) return res.status(404).json({ message: 'User not found' });

        // Update fields
        console.log('Updating user:', masterUser.email, 'with USN:', usn);
        masterUser.name = name || masterUser.name;
        masterUser.email = email || masterUser.email;
        masterUser.stream = stream || masterUser.stream;
        masterUser.branch = branch || masterUser.branch;
        masterUser.specialization = specialization || masterUser.specialization;
        masterUser.year = year || masterUser.year;
        masterUser.usn = usn !== undefined ? usn : masterUser.usn;
        masterUser.collegeDetails = collegeDetails || masterUser.collegeDetails;
        
        await masterUser.save();
        console.log('User updated successfully:', masterUser.usn);
        res.json({ message: 'User profile updated successfully', user: masterUser });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});

// Get Exam Analytics Heatmap (Admin Only)
router.get('/analytics/:examId', protect, mainAdminOnly, async (req, res) => {
    try {
        const examId = new mongoose.Types.ObjectId(req.params.examId);
        
        // Aggregate all questionStats for this exam
        const analytics = await Attempt.aggregate([
            { $match: { examId: examId, status: { $in: ['submitted', 'pending_review'] } } },
            { $unwind: "$questionStats" },
            { $group: {
                _id: "$questionStats.questionId",
                averageTimeSpent: { $avg: "$questionStats.timeSpentSeconds" },
                correctCount: { $sum: { $cond: ["$questionStats.isCorrect", 1, 0] } },
                totalAttempts: { $sum: 1 }
            }},
            { $project: {
                _id: 1,
                averageTimeSpent: { $round: ["$averageTimeSpent", 1] },
                successRate: { 
                    $round: [
                       { $multiply: [ { $divide: ["$correctCount", "$totalAttempts"] }, 100 ] }, 
                       1 
                    ] 
                },
                totalAttempts: 1
            }}
        ]);

        res.json(analytics);
    } catch (error) {
        console.error('Analytics aggregation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
