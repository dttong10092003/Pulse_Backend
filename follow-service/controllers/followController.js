const Follow = require('../models/follow');

// Follow người dùng khác
exports.followUser = async (req, res) => {
    const followerId = req.headers['x-user-id'];
    const { followingId } = req.body;

    if (!followerId || !followingId) {
        return res.status(400).json({ message: 'Missing followerId or followingId.' });
    }

    if (followerId === followingId) {
        return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    try {
        // Không có index unique, nên xử lý duplicate bằng logic
        const existing = await Follow.findOne({ followerId, followingId });
        if (existing) {
            return res.status(409).json({ message: 'Already following this user.' });
        }

        const follow = await Follow.create({ followerId, followingId });
        return res.status(201).json({
            message: 'Followed successfully.',
            data: follow
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error.',
            error: error.message
        });
    }
};

// Hủy follow
exports.unfollowUser = async (req, res) => {
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
        return res.status(500).json({
            message: 'Internal server error.',
            error: error.message
        });
    }
};

// Lấy danh sách người theo dõi user (followers)
exports.getFollowers = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: 'Missing userId param.' });
    }

    try {
        const followers = await Follow.find({ followingId: userId });
        return res.status(200).json({
            message: 'Followers retrieved successfully.',
            data: followers
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error.',
            error: error.message
        });
    }
};

// Lấy danh sách người mà user đang theo dõi (followings)
exports.getFollowings = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: 'Missing userId param.' });
    }

    try {
        const followings = await Follow.find({ followerId: userId });
        return res.status(200).json({
            message: 'Followings retrieved successfully.',
            data: followings
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error.',
            error: error.message
        });
    }
};
