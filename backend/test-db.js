require('dotenv').config();
const mongoose = require('mongoose');

console.log('MongoDB URI:', process.env.MONGODB_URI);
console.log('Attempting to connect...');

mongoose.connect(process.env.MONGODB_URI, { 
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
})
  .then(() => {
    console.log('✓ MongoDB connected successfully');
    mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.log('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });
