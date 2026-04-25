const mongoose = require('mongoose');

const userOtpSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: '10m' } } // Auto-delete after 10 mins
});

module.exports = mongoose.model('UserOTP', userOtpSchema);
