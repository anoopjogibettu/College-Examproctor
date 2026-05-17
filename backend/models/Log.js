const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt' },
    eventType: { type: String, required: true }, // e.g., 'unknown_face', 'multiple_faces', 'no_face', 'tab_switched', 'exam_started', 'exam_terminated'
    description: { type: String }, // optional details
    snapshotVideo: { type: String }, // optional Base64 video clip of the violation
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);
