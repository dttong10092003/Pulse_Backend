const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const followRoutes = require('./routes/followRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected.'))
    .catch((err) => console.log(err));

app.use('/follow', followRoutes);

const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
    console.log(`Follow-service running on port ${PORT}`);
});
