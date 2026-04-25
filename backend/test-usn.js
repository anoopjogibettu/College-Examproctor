const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function testUsnFlow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ role: 'student' });
        if (!user) {
            console.log('No student found');
            process.exit(0);
        }

        const testUsn = 'USN-' + Math.floor(Math.random() * 10000);
        console.log('Original USN:', user.usn);
        console.log('Setting USN to:', testUsn);
        
        user.usn = testUsn;
        await user.save();
        
        const updatedUser = await User.findById(user._id);
        console.log('Verified USN in DB:', updatedUser.usn);
        
        if (updatedUser.usn === testUsn) {
            console.log('SUCCESS: USN saved correctly.');
        } else {
            console.log('FAILURE: USN did not match.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

testUsnFlow();
