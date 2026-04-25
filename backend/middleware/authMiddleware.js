const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check active session lock
            const User = require('../models/User');
            const currentUser = await User.findById(decoded.id);

            if (!currentUser || currentUser.activeToken !== token) {
                return res.status(401).json({ message: 'Session expired or logged in from another device' });
            }

            req.user = decoded; // Contains id and role
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const mainAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as main admin' });
    }
};

const moderatorOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized. Elevated permissions required.' });
    }
};

module.exports = { protect, mainAdminOnly, moderatorOrAdmin };
