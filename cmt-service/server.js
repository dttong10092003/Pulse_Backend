const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const commentRoutes = require('./routes/commentRoutes');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {

}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

app.use('/comments', commentRoutes);

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`Comment Service is running on port ${PORT}`);
});