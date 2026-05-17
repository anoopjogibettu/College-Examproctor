const express = require('express');
const Attempt = require('../models/Attempt');
const Log = require('../models/Log');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Start Exam
router.post('/start', protect, async (req, res) => {
    try {
        const { examId } = req.body;
        
        // Strict lock: Check if any submitted/terminated attempt exists
        const pastAttempt = await Attempt.findOne({ userId: req.user.id, examId, status: { $ne: 'active' } });
        if (pastAttempt) {
             return res.status(403).json({ message: 'Exam limit reached. You have already completed this assessment.' });
        }

        // Check if an active attempt exists
        let attempt = await Attempt.findOne({ userId: req.user.id, examId, status: 'active' });

        if (!attempt) {
            attempt = await Attempt.create({
                userId: req.user.id,
                examId,
                status: 'active'
            });

            await Log.create({
                userId: req.user.id,
                attemptId: attempt._id,
                eventType: 'exam_started',
                description: 'Student started the exam'
            });
        }

        res.json(attempt);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Record Violation
// Autosave Progress
router.patch('/:id/autosave', protect, async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id);
        if (!attempt || attempt.userId.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Attempt not found' });
        }
        if (attempt.status !== 'active') {
            return res.status(400).json({ message: 'Attempt is no longer active' });
        }

        attempt.answers = { ...attempt.answers, ...req.body.answers };
        await attempt.save();
        res.json({ message: 'Progress saved' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/:id/violation', protect, async (req, res) => {
    try {
        const { eventType, description, snapshotVideo } = req.body;
        const attempt = await Attempt.findById(req.params.id);

        if (!attempt || attempt.userId.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (attempt.status !== 'active') {
            return res.status(400).json({ message: 'Exam is no longer active' });
        }

        attempt.violationsCount += 1;
        
        await Log.create({
            userId: req.user.id,
            attemptId: attempt._id,
            eventType,
            description,
            snapshotVideo
        });

        // Auto terminate only for fatal violations
        const fatalViolations = ['tab_switched', 'fullscreen_exit', 'focus_lost', 'screen_stopped'];
        if (fatalViolations.includes(eventType)) {
            attempt.status = 'terminated';
            attempt.submittedAt = new Date();
            
            await Log.create({
                userId: req.user.id,
                attemptId: attempt._id,
                eventType: 'exam_terminated',
                description: `Exam auto-terminated due to fatal violation: ${eventType}`
            });
        }

        await attempt.save();
        res.json({ violationsCount: attempt.violationsCount, status: attempt.status });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Submit Exam
router.post('/:id/submit', protect, async (req, res) => {
    try {
        const { answers, questionStats } = req.body;
        const attempt = await Attempt.findById(req.params.id);

        if (!attempt || attempt.userId.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (attempt.status !== 'active') {
            return res.status(400).json({ message: 'Exam is no longer active' });
        }

        let score = 0;
        let requiresManualReview = false;
        
        attempt.answers = answers || {};
        
        if (answers) {
            const Exam = require('../models/Exam');
            const exam = await Exam.findById(attempt.examId);
            if (exam && exam.questions) {
                exam.questions.forEach((q, idx) => {
                    let studentAnswer = answers[q._id.toString()];
                    if (studentAnswer === undefined) {
                        studentAnswer = answers[`q${idx}`];
                    }
                    
                    if (q.type && q.type !== 'mcq') {
                        requiresManualReview = true;
                    } else if (studentAnswer && studentAnswer === q.correctAnswer) {
                        score += (q.marks || 1);
                    }
                });
            }
        }
        
        if (questionStats && Array.isArray(questionStats)) {
            attempt.questionStats = questionStats;
        }

        attempt.status = requiresManualReview ? 'pending_review' : 'submitted';
        attempt.score = score;
        attempt.submittedAt = new Date();
        await attempt.save();

        await Log.create({
            userId: req.user.id,
            attemptId: attempt._id,
            eventType: 'exam_submitted',
            description: `Student submitted the exam with score: ${score}`
        });

        res.json({ message: 'Exam submitted successfully', score });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get completed exam attempts and manual results for the logged-in student
router.get('/my-results', protect, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        const attempts = await Attempt.find({ 
            userId: req.user.id, 
            status: { $in: ['submitted', 'terminated', 'pending_review'] } 
        }).populate('examId', 'title duration questions resultsPublished');

        res.json({
            attempts,
            usn: user?.usn || ''
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
