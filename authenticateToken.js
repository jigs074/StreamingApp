const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.jwtToken; 
    if (!token) {
        return res.status(401).send({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ error: 'Invalid or expired token.' });
        }
        req.user = decoded;
        next();
    });
};

module.exports = authenticateToken;
