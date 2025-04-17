const Follow = require('../models/follow');
const axios = require('axios');
const mongoose = require('mongoose');

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
    // Tìm tất cả các followers của user
    const followers = await Follow.find({ followingId: userId });

    if (!followers || followers.length === 0) {
      return res.status(200).json({ message: 'No followers found.', data: [] });
    }

    // Trích xuất tất cả các followerIds từ kết quả
    const followerIds = followers.map(f => f.followerId);

    // Gọi API user-service để lấy thông tin người dùng (firstname, lastname, avatar)
    const userDetails = await Promise.all(followerIds.map(async (userId) => {
      try {
        const response = await axios.get(`http://user-service:5002/user-details/${userId}`);
        return response.data; // Đảm bảo API trả về đúng định dạng
      } catch (error) {
        console.error("Error fetching user details:", error);
        return { firstname: '', lastname: '', avatar: '' }; // Trả về mặc định nếu không tìm thấy
      }
    }));

    // Kết hợp thông tin follower với dữ liệu người dùng
    const formatted = followers.map((f, index) => ({
      _id: f._id,
      user: {
        _id: f.followerId,
        firstname: userDetails[index]?.firstname,
        lastname: userDetails[index]?.lastname,
        avatar: userDetails[index]?.avatar,
      },
      createdAt: f.createdAt
    }));

    return res.status(200).json({
      message: 'Followers retrieved successfully.',
      data: formatted
    });
  } catch (error) {
    console.error("Error in getFollowers:", error);
    return res.status(500).json({
      message: 'Internal server error.',
      error: error.message
    });
  }
};

const getFollowings = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId param.' });
  }

  try {
    // Tìm tất cả các followings của user
    const followings = await Follow.find({ followerId: userId });

    if (!followings || followings.length === 0) {
      return res.status(200).json({ message: 'No followings found.', data: [] });
    }

    // Trích xuất tất cả các followingIds từ kết quả
    const followingIds = followings.map(f => f.followingId);

    // Lấy thông tin người dùng cho các followingIds (truy vấn thủ công)
    const userDetails = await Promise.all(followingIds.map(async (userId) => {
      try {
        const response = await axios.get(`http://user-service:5002/user-details/${userId}`);
        console.log(response.data);  // Kiểm tra dữ liệu trả về
        return response.data;
      } catch (error) {
        console.error("Error fetching user details:", error);
        return { firstname: '', lastname: '', avatar: '' };  // Trả về mặc định nếu không tìm thấy
      }
    }));

    // Kết hợp thông tin following với dữ liệu người dùng
    const formatted = followings.map((f, index) => ({
      _id: f._id,
      user: {
        _id: f.followingId,
        firstname: userDetails[index]?.firstname,
        lastname: userDetails[index]?.lastname,
        avatar: userDetails[index]?.avatar,
      },
      createdAt: f.createdAt
    }));

    return res.status(200).json({
      message: 'Followings retrieved successfully.',
      data: formatted
    });
  } catch (error) {
    console.error("Error in getFollowings:", error);
    return res.status(500).json({
      message: 'Internal server error.',
      error: error.message
    });
  }
};

module.exports = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowings
};