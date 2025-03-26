const axios = require("axios");

const FOLLOW_SERVICE_URL = process.env.FOLLOW_SERVICE_URL;

const followUser = async (req, res) => {
  try {
    const response = await axios.post(
      `${FOLLOW_SERVICE_URL}/follow`,
      { followingId: req.body.followingId },
      {
        headers: { "x-user-id": req.headers["x-user-id"] }  // hoặc req.headers["x-user-id"] nếu không decode JWT
      }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message
    });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const response = await axios.post(
      `${FOLLOW_SERVICE_URL}/follow/unfollow`,
      { followingId: req.body.followingId },
      {
        headers: { "x-user-id": req.headers["x-user-id"] }
      }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message
    });
  }
};

const getFollowers = async (req, res) => {
  try {
    const response = await axios.get(`${FOLLOW_SERVICE_URL}/follow/followers/${req.params.userId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message
    });
  }
};

const getFollowings = async (req, res) => {
  try {
    const response = await axios.get(`${FOLLOW_SERVICE_URL}/follow/followings/${req.params.userId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowings
};
