const express = require('express');
const Exam = require('../models/Exam');
const { protect, mainAdminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all active exams for students (Targeted to their stream)
router.get('/', protect, async (req, res) => {
    try {
        const User = require('../models/User');
        const currentUser = await User.findById(req.user.id);
        const userStream = currentUser?.stream || 'Engineering';
        const userBranch = currentUser?.branch || currentUser?.specialization || '';
        const userYear = currentUser?.year || 1;

        // Build match query: stream must match (or be 'All')
        const streamFilter = { $in: [userStream, 'All'] };

        const exams = await Exam.find({ 
            status: 'active',
            stream: streamFilter
        }).sort({ scheduledFor: 1 });

        // Apply branch and year filtering in JS (flexible)
        const filteredExams = exams.filter(exam => {
            // Branch filter: 'All' means no branch restriction
            const branchOk = !exam.targetBranch || exam.targetBranch === 'All' || exam.targetBranch === userBranch;
            // Year filter: 0 means no year restriction
            const yearOk = !exam.targetYear || exam.targetYear === 0 || exam.targetYear === userYear;
            return branchOk && yearOk;
        });

        const Attempt = require('../models/Attempt');
        const attempts = await Attempt.find({ userId: req.user.id, status: { $ne: 'active' } });
        const attemptedExamIds = attempts.map(a => a.examId.toString());

        const parsedExams = filteredExams.map(exam => ({
            ...exam._doc,
            hasAttempted: attemptedExamIds.includes(exam._id.toString())
        }));

        res.json(parsedExams);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Create exam (Main Admin only)
router.post('/create', protect, mainAdminOnly, async (req, res) => {
    try {
        const { title, duration, questions, scheduledFor, endTime, stream, targetBranch, targetYear } = req.body;
        if (!title || !duration || !questions || !scheduledFor || !endTime) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }
        
        // Generate a unique exam UID with retry on collision
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const generateUid = () => {
            let id = 'EXM-';
            for (let i = 0; i < 4; i++) {
                id += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return id;
        };

        let exam;
        let retries = 3;
        while (retries > 0) {
            try {
                const examUid = generateUid();
                exam = await Exam.create({ 
                    uid: examUid,
                    title, 
                    duration, 
                    questions, 
                    scheduledFor,
                    endTime,
                    stream: stream || 'All',
                    targetBranch: targetBranch || 'All',
                    targetYear: targetYear ? parseInt(targetYear) : 0,
                    status: 'active' 
                });
                break;
            } catch (createErr) {
                if (createErr.code === 11000 && retries > 1) {
                    retries--;
                    continue;
                }
                throw createErr;
            }
        }

        // Notify targeted students
        try {
            const User = require('../models/User');
            const sendEmail = require('../utils/sendEmail');
            
            const query = {};
            if (exam.stream !== 'All') query.stream = exam.stream;
            if (exam.targetBranch !== 'All') query.branch = exam.targetBranch;
            if (exam.targetYear !== 0) query.year = exam.targetYear;

            const students = await User.find(query).select('email name');
            
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const portalName = process.env.PORTAL_NAME || 'Exam Cell';
            
            students.forEach(student => {
                sendEmail({
                    email: student.email,
                    subject: `📝 New Exam Scheduled: ${exam.title}`,
                    message: `Hello ${student.name},\n\nA new exam has been scheduled for your cohort:\n\nTitle: ${exam.title}\nDuration: ${exam.duration} Minutes\nScheduled Start: ${new Date(exam.scheduledFor).toLocaleString()}\nScheduled End: ${new Date(exam.endTime).toLocaleString()}\n\nYou can view the details and prepare on the portal: ${frontendUrl}/`
                }).catch(err => console.error(`Failed to send exam notification to ${student.email}`, err));
            });
        } catch (mailErr) {
            console.error('Failed to broadcast exam notification:', mailErr);
        }

        res.status(201).json(exam);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get exam specific details (when started)
router.get('/:id', protect, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.status !== 'active' && req.user.role === 'student') {
             return res.status(403).json({ message: 'Exam is no longer active' });
        }
        
        // Ensure student matches stream
        if (req.user.role === 'student') {
            const User = require('../models/User');
            const currentUser = await User.findById(req.user.id);
            if (exam.stream !== 'All' && currentUser.stream !== exam.stream) {
                 return res.status(403).json({ message: 'Exam is restricted to another academic stream' });
            }
        }
        
        res.json(exam);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// End Exam (Main Admin only)
router.post('/:id/end', protect, mainAdminOnly, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        exam.status = 'ended';
        await exam.save();
        res.json({ message: 'Exam ended successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Publish Results (Main Admin only)
router.put('/:id/publish', protect, mainAdminOnly, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        
        exam.resultsPublished = !exam.resultsPublished;
        await exam.save();

        if (exam.resultsPublished) {
            const Attempt = require('../models/Attempt');
            const User = require('../models/User');
            const sendEmail = require('../utils/sendEmail');

            // Find all students who attempted this exam
            const attempts = await Attempt.find({ examId: exam._id }).populate('userId', 'email name');
            
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const portalName = process.env.PORTAL_NAME || 'Exam Cell';

            // Send emails to each student
            attempts.forEach(attempt => {
                if (attempt.userId && attempt.userId.email) {
                    sendEmail({
                        email: attempt.userId.email,
                        subject: `📊 Results Published: ${exam.title}`,
                        message: `Hello ${attempt.userId.name},\n\nThe results for "${exam.title}" have been officially published by the institution.\n\nYou can now view your detailed transcript and performance analytics on the portal.\n\nAccess Results: ${frontendUrl}/results\n\nBest regards,\n${portalName}`
                    }).catch(err => console.error(`Failed to send result email to ${attempt.userId.email}`, err));
                }
            });
        }
        
        res.json({ message: `Results ${exam.resultsPublished ? 'published' : 'hidden'} successfully`, exam });
    } catch (error) {
        console.error('Publish results error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Hard Delete Exam (Main Admin only)
router.delete('/:id', protect, mainAdminOnly, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        await Exam.deleteOne({ _id: req.params.id });
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
