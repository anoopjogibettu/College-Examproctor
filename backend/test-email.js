const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sendEmail = require('./utils/sendEmail');

async function testEmail() {
    try {
        console.log('Attempting to send test email to:', process.env.SMTP_EMAIL);
        await sendEmail({
            email: process.env.SMTP_EMAIL,
            subject: 'MITE Exam Portal - System Test',
            message: 'This is a test email to verify that the SMTP configuration is working correctly. If you received this, the system is ready!'
        });
        console.log('SUCCESS: Email sent successfully.');
        process.exit(0);
    } catch (err) {
        console.error('FAILURE: Email could not be sent.');
        console.error('Error Details:', err);
        process.exit(1);
    }
}

testEmail();
