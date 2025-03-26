const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { // Lưu ID thay vì populate từ auth-service
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    media: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    tags: [{
        type: String
    }]
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
