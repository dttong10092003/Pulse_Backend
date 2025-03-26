const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']; // Không cần tách 'Bearer '

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Giải mã token
        req.user = decoded; // Gắn userId vào req
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token.' });
    }
};

module.exports = verifyToken;
