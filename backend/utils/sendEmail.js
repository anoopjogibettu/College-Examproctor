const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    let transporter;

    // Use test account if no real SMTP credentials exist
    if (!process.env.SMTP_HOST) {
        console.log('No SMTP configuration found in .env. Generating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
    } else {
        // Create a reusable transporter object using the real SMTP transport
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    // Send mail with defined transport object
    const message = {
        from: `${process.env.FROM_NAME || 'Admin'} <${process.env.FROM_EMAIL || 'noreply@proctorai.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
    
    // If using Ethereal, log the preview URL
    if (!process.env.SMTP_HOST) {
        console.log('Preview test email at: %s', nodemailer.getTestMessageUrl(info));
    }
};

module.exports = sendEmail;
