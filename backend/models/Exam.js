const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    type: { type: String, enum: ['mcq', 'text', 'code'], default: 'mcq' },
    questionText: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, default: '' }
});

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    stream: { type: String, enum: ['All', 'PUC', 'Degree', 'Post Graduation', 'Engineering'], default: 'All' },
    duration: { type: Number, required: true }, // in minutes
    questions: { type: [questionSchema], default: [] },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    resultsPublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
