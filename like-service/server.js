const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const likeRoutes = require('./routes/likeRoutes');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

app.use('/likes', likeRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`Like Service is running on port ${PORT}`);
});