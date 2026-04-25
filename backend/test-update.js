const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function testUpdate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ role: 'student' });
        if (!user) {
            console.log('No student found to test update');
            process.exit(0);
        }

        console.log('Testing update for:', user.email);
        
        // Simulate the update logic from adminRoutes.js
        user.name = user.name;
        user.email = user.email;
        user.stream = 'Engineering';
        user.branch = 'Computer Science';
        user.year = 2;
        user.usn = 'TEST-USN-123';
        user.collegeDetails = 'MITE';
        
        await user.save();
        console.log('Update Successful!');
        process.exit(0);
    } catch (err) {
        console.error('Update Failed with Error:', err);
        process.exit(1);
    }
}

testUpdate();
