const jwt = require("jsonwebtoken")

const genererToken = (user) => {
    return jwt.sign(
        {sub: user._id.toString(),},process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

module.exports = genererToken