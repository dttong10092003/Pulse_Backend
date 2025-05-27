const express = require('express');
const { getUserById, updateUser, createUserDetail, checkEmailOrPhoneExists, 
    getUserByEmail, getUserDetailsByIds,getTop10Users, getUserDetails, 
    getTopUsersExcludingFollowed,getAllUsers, getUserDetailsByPhoneNumbers } = require('../controllers/userController');

const router = express.Router();

router.get('/top-users',getTopUsersExcludingFollowed);
router.get('/top10-users', getTop10Users);
router.get('/all', getAllUsers);
router.post('/check-email-phone', checkEmailOrPhoneExists);
router.post('/user-details-by-ids', getUserDetailsByIds);
router.post("/by-phone-numbers", getUserDetailsByPhoneNumbers);
router.get('/user-details/:userId', getUserDetails);
router.get('/user-details-email/:email', getUserByEmail);
router.put('/:id', updateUser);
router.get('/:id', getUserById);
router.post('/', createUserDetail);

module.exports = router;
