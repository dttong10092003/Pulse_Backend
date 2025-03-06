const mongoose = require('mongoose');

const userDetailSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        unique: true 
    },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    DOB: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phoneNumber: { 
        type: String, 
        required: true,
        match: [/^(\+84|0)[3|5|7|8|9]\d{8}$/, 'Invalid Vietnamese phone number format']    
    },
    address: { type: String },
    bio: { type: String }
});

const UserDetail = mongoose.model('usersDetail', userDetailSchema);
module.exports = UserDetail;
