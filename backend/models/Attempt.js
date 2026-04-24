const mongoose = require('mongoose');

const questionStatSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    timeSpentSeconds: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: false }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    status: { type: String, enum: ['active', 'submitted', 'terminated', 'pending_review'], default: 'active' },
    score: { type: Number, default: 0 },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} }, // Maps questionId to text payload
    questionStats: { type: [questionStatSchema], default: [] }, // Array of question focus telemetry
    violationsCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Attempt', attemptSchema);
