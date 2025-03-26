const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const postRoute = require('./routes/postRoute');

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

app.use('/posts', postRoute);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Post Service is running on port ${PORT}`);
});
