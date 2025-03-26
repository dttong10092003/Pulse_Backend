const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const notificationRoute = require('./routes/notificationRoutes');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    ssl: true,
    tlsAllowInvalidCertificates: true
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Notification Service is running...');
});

app.use('/', notificationRoute); // mount route gốc

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
    console.log(`🚀 Notification Service is running on port ${PORT}`);
});
