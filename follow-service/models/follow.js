const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: { type: String, required: true },  // ID người đi follow
  followingId: { type: String, required: true }  // ID người được follow
}, { timestamps: true });

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true }); // Đảm bảo không duplicate follow

module.exports = mongoose.model('Follow', followSchema);
