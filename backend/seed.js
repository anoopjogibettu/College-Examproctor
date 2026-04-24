require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Exam = require('./models/Exam');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected for Seeding...');
    
    // Create Admin
    const salt = await bcrypt.genSalt(10);
    const adminExists = await User.findOne({ email: 'admin@edu.com' });
    if (!adminExists) {
        await User.create({
            name: 'System Admin',
            email: 'admin@edu.com',
            password: await bcrypt.hash('admin123', salt),
            role: 'admin'
        });
        console.log('Admin user created (admin@edu.com / admin123)');
    }

    // Create Sample Exam
    const examExists = await Exam.findOne({ title: 'JavaScript Fundamentals' });
    if (!examExists) {
        await Exam.create({
            title: 'JavaScript Fundamentals',
            duration: 10, // 10 minutes
            questions: [
                {
                    questionText: 'What is a closure in JavaScript?',
                    options: ['A function bundled with its lexical environment', 'A type of loop', 'A DOM element'],
                    correctAnswer: 'A function bundled with its lexical environment'
                },
                {
                    questionText: 'Which keyword is used to declare a constant?',
                    options: ['var', 'let', 'const'],
                    correctAnswer: 'const'
                }
            ]
        });
        console.log('Sample Exam created');
    }

    mongoose.disconnect();
    console.log('Seeding complete.');
  })
  .catch(err => console.log(err));
