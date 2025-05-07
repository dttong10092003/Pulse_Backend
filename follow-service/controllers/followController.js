const Follow = require('../models/follow');
const axios = require('axios');
const mongoose = require('mongoose');
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

// Follow người dùng khác
const followUser = async (req, res) => {
  const followerId = req.headers['x-user-id'];  // lấy ID người theo dõi từ header
  const { followingId } = req.body;  // lấy ID người cần theo dõi từ body
  console.log('Follower ID:', followerId);
  console.log('Following ID:', followingId);
  if (!followerId || !followingId) {
    return res.status(400).json({ message: 'Missing followerId or followingId.' });
  }

  if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(followingId)) {
    return res.status(400).json({ message: 'Invalid ObjectId.' });
  }

  if (followerId === followingId) {
    return res.status(400).json({ message: 'You cannot follow yourself.' });
  }

  try {
    // Kiểm tra xem mối quan hệ này đã tồn tại chưa
    const existing = await Follow.findOne({ followerId, followingId });
    if (existing) {
      return res.status(409).json({ message: 'Already following this user.' });
    }

    // Tạo mới quan hệ follow
    const follow = await Follow.create({ followerId, followingId });
    return res.status(201).json({
      message: 'Followed successfully.',
      data: follow
    });
  } catch (error) {
    console.error("Error in followUser:", error);  // Log lỗi ở backend
    return res.status(500).json({
      message: 'Internal server error.',
      error: error.message
    });
  }
};

// Hủy follow
const unfollowUser = async (req, res) => {
  const followerId = req.headers['x-user-id'];
  const { followingId } = req.body;

  if (!followerId || !followingId) {
    return res.status(400).json({ message: 'Missing followerId or followingId.' });
  }

  try {
    const deleted = await Follow.findOneAndDelete({ followerId, followingId });
    if (!deleted) {
      return res.status(404).json({ message: 'Not following this user.' });
    }

    return res.status(200).json({
      message: 'Unfollowed successfully.',
      data: deleted
    });
  } catch (error) {
    console.error("Error in unfollowUser:", error);
    return res.status(500).json({
      message: 'Internal server error.',
      error: error.message
    });
  }
};

const getFollowers = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId param.' });
  }

  try {
    const followers = await Follow.find({ followingId: userId });

    if (!followers || followers.length === 0) {
      return res.status(200).json({ message: 'No followers found.', data: [] });
    }

    const followerIds = followers.map(f => f.followerId.toString());

    const response = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
      userIds: followerIds
    });

    const userMap = {};
    response.data.forEach(user => {
      userMap[user.userId] = user;
    });

    const formatted = followers.map(f => ({
      _id: f._id,
      user: {
        _id: f.followerId,
        firstname: userMap[f.followerId.toString()]?.firstname || '',
        lastname: userMap[f.followerId.toString()]?.lastname || '',
        avatar: userMap[f.followerId.toString()]?.avatar || '',
      },
      createdAt: f.createdAt
    }));

    return res.status(200).json({
      message: 'Followers retrieved successfully.',
      data: formatted
    });
  } catch (error) {
    console.error("Error in getFollowers:", error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};


const getFollowings = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId param.' });
  }

  try {
    const followings = await Follow.find({
      followerId: userId,
      followingId: { $ne: userId }  // ❗ loại bỏ trường hợp self-follow
    });

    if (!followings || followings.length === 0) {
      return res.status(200).json({ message: 'No followings found.', data: [] });
    }

    const followingIds = followings.map(f => f.followingId.toString());

    const response = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
      userIds: followingIds
    });

    const userMap = {};
    response.data.forEach(user => {
      userMap[user.userId] = user;
    });

    const authResponse = await axios.post(`${AUTH_SERVICE_URL}/auth/batch-usernames`, {
      userIds: followingIds,
    });
    const usernameMap = authResponse.data;

    const formatted = followings
    .filter(f => f.followerId.toString() !== f.followingId.toString())
      .map(f => ({
        _id: f._id,
        user: {
          _id: f.followingId,
          firstname: userMap[f.followingId.toString()]?.firstname || '',
          lastname: userMap[f.followingId.toString()]?.lastname || '',
          avatar: userMap[f.followingId.toString()]?.avatar || '',
          username: usernameMap[f.followingId.toString()] || '',
        },
        createdAt: f.createdAt
      }));

    return res.status(200).json({
      message: 'Followings retrieved successfully.',
      data: formatted
    });
  } catch (error) {
    console.error("Error in getFollowings:", error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};


module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowings
};