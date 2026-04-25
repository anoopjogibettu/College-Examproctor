const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    uid: { type: String, unique: true }, // The new 6 character unique id for RBAC
    password: { type: String, required: true },
    stream: { type: String, enum: ['Engineering', 'Post Graduation'], default: 'Engineering' },
    branch: { type: String, default: '' },         // Mandatory for Engineering
    specialization: { type: String, default: '' }, // Optional for Post Graduation (MCA/MBA/M.Tech)
    year: { type: Number, default: 1 },            // 1-4 for Engineering, 1-2 for PG
    collegeDetails: { type: String, default: '' },
    usn: { type: String, default: '' },            // University Seat Number (issued by Admin)
    faceEncoding: { type: [Number], default: [] },
    role: { type: String, enum: ['student', 'moderator', 'admin'], default: 'student' },
    activeToken: { type: String, default: null },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
