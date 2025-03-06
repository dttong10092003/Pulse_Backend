const UserDetail = require('../models/userDetail');

// Lấy thông tin user theo ID
const getUserById = async (req, res) => {
    try {
        const user = await UserDetail.findOne({ userId: req.params.id });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Cập nhật thông tin user (phải đăng nhập)
const updateUser = async (req, res) => {
    try {
        const { firstname, lastname, DOB, gender, phoneNumber, address, bio } = req.body;
        const userId = req.params.id;

        let user = await UserDetail.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstname = firstname || user.firstname;
        user.lastname = lastname || user.lastname;
        user.DOB = DOB || user.DOB;
        user.gender = gender || user.gender;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.address = address || user.address;
        user.bio = bio || user.bio;

        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Tạo thông tin user (khi đăng ký xong từ auth-service)
const createUserDetail = async (req, res) => {
    try {
        const { userId, firstname, lastname, DOB, gender, phoneNumber, address, bio } = req.body;

        const existingUser = await UserDetail.findOne({ userId });
        if (existingUser) {
            return res.status(400).json({ message: 'User detail already exists' });
        }

        const newUser = new UserDetail({ userId, firstname, lastname, DOB, gender, phoneNumber, address, bio });
        await newUser.save();

        res.status(201).json({ message: 'User detail created successfully', newUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


module.exports = { getUserById, updateUser, createUserDetail };
