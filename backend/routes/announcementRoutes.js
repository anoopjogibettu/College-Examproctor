const express = require('express');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { protect, mainAdminOnly } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

// Create Announcement (Admin Only)
router.post('/', protect, mainAdminOnly, async (req, res) => {
    try {
        const { title, content, targetStream, targetBranch, targetYear } = req.body;
        
        const announcement = await Announcement.create({
            title,
            content,
            targetStream,
            targetBranch,
            targetYear,
            createdBy: req.user.id
        });

        // Fetch targeted students for email notification
        const query = {};
        if (targetStream !== 'All') query.stream = targetStream;
        if (targetBranch !== 'All') query.branch = targetBranch;
        if (targetYear !== 0) query.year = targetYear;

        const students = await User.find(query).select('email name');
        
        // Broadcast emails asynchronously
        students.forEach(student => {
            sendEmail({
                email: student.email,
                subject: `📢 New College Announcement: ${title}`,
                message: `Hello ${student.name},\n\nA new announcement has been posted on the Exam Portal:\n\n---\n${title}\n\n${content}\n---\n\nView full details on the portal: https://collageexamportal.vercel.app/`
            }).catch(err => console.error(`Failed to send announcement email to ${student.email}`, err));
        });

        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get relevant announcements for a student
router.get('/my', protect, async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        
        const announcements = await Announcement.find({
            $and: [
                { $or: [{ targetStream: 'All' }, { targetStream: student.stream }] },
                { $or: [{ targetBranch: 'All' }, { targetBranch: student.branch }] },
                { $or: [{ targetYear: 0 }, { targetYear: student.year }] }
            ]
        }).sort({ createdAt: -1 }).limit(10);

        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
