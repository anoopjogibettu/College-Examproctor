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
    stream: { type: String, enum: ['All', 'Engineering', 'Post Graduation'], default: 'All' },
    targetBranch: { type: String, default: 'All' }, // e.g. 'CSE', 'MCA', 'All'
    targetYear: { type: Number, default: 0 },        // 0 = all years, 1-4 = specific year
    duration: { type: Number, required: true },
    questions: { type: [questionSchema], default: [] },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    resultsPublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
