const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    targetStream: { type: String, default: 'All' }, // All, Engineering, etc.
    targetBranch: { type: String, default: 'All' }, // CSE, MCA, All
    targetYear: { type: Number, default: 0 },       // 0 = all years
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
