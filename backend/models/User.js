const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    uid: { type: String, unique: true }, // The new 6 character unique id for RBAC
    password: { type: String, required: true },
    stream: { type: String, enum: ['None', 'PUC', 'Degree', 'Post Graduation', 'Engineering'], default: 'None' },
    specialization: { type: String, default: '' },
    collegeDetails: { type: String, default: '' },
    manualResults: { type: String, default: '' },
    faceEncoding: { type: [Number], default: [] },
    role: { type: String, enum: ['student', 'moderator', 'admin'], default: 'student' },
    activeToken: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
