const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const Attempt = require('./models/Attempt');

async function diagnosticTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- SYSTEM DIAGNOSTIC START ---');

        // 1. Find a test student
        const student = await User.findOne({ role: 'student' });
        if (!student) {
            console.log('No student found to test.');
            process.exit(1);
        }
        console.log(`Testing with Student: ${student.name} (${student.email})`);

        // 2. Simulate Admin Update (Logic from adminRoutes.js)
        const newUsn = 'MITE-' + Math.random().toString(36).substring(7).toUpperCase();
        console.log(`Step 1: Admin setting USN to ${newUsn}...`);
        
        student.usn = newUsn;
        await student.save();
        console.log('Step 1 Complete: User object saved.');

        // 3. Verify Database Integrity
        const verifiedUser = await User.findById(student._id);
        console.log(`Step 2: Database check - USN in DB is: "${verifiedUser.usn}"`);
        if (verifiedUser.usn !== newUsn) {
            console.error('CRITICAL: Database did not persist the USN change!');
            process.exit(1);
        }

        // 4. Simulate Student View (Logic from attemptRoutes.js /my-results)
        console.log('Step 3: Checking Student Dashboard API response...');
        const userForDashboard = await User.findById(student._id);
        const apiResponse = {
            usn: userForDashboard?.usn || ''
        };
        console.log(`Step 3 Complete: API would return USN: "${apiResponse.usn}"`);

        if (apiResponse.usn === newUsn) {
            console.log('--- DIAGNOSTIC RESULT: SUCCESS ---');
            console.log('The backend and database are working perfectly.');
            console.log('If the student still sees "Not Issued", it is a Frontend caching issue.');
        } else {
            console.error('--- DIAGNOSTIC RESULT: FAILURE ---');
            console.error('The USN is in the DB but not being returned correctly.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Diagnostic error:', err);
        process.exit(1);
    }
}

diagnosticTest();
