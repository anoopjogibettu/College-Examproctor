const express = require('express');
const Exam = require('../models/Exam');
const { protect, mainAdminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all active exams for students (Targeted to their stream)
router.get('/', protect, async (req, res) => {
    try {
        const User = require('../models/User');
        const currentUser = await User.findById(req.user.id);
        const userStream = currentUser?.stream || 'None';

        const exams = await Exam.find({ 
            status: 'active',
            stream: { $in: [userStream, 'All'] }
        }).sort({ scheduledFor: 1 });

        const Attempt = require('../models/Attempt');
        // Only lock the UI if the attempt is actually submitted or terminated, allow them to resume active attempts
        const attempts = await Attempt.find({ userId: req.user.id, status: { $ne: 'active' } });
        const attemptedExamIds = attempts.map(a => a.examId.toString());

        const parsedExams = exams.map(exam => {
            return {
                ...exam._doc,
                hasAttempted: attemptedExamIds.includes(exam._id.toString())
            };
        });

        res.json(parsedExams);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Create exam (Main Admin only)
router.post('/create', protect, mainAdminOnly, async (req, res) => {
    try {
        const { title, duration, questions, scheduledFor, stream } = req.body;
        const exam = await Exam.create({ 
            title, 
            duration, 
            questions, 
            scheduledFor,
            stream: stream || 'All',
            status: 'active' 
        });
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
        
        res.json({ message: `Results ${exam.resultsPublished ? 'published' : 'hidden'} successfully`, exam });
    } catch (error) {
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
