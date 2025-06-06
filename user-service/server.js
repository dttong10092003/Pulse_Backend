const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI, {
   
}).then(() => {
    
    console.log("Connected to MongoDB (User Service)");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

app.use('/users', userRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`);
});
