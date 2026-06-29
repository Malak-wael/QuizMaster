const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

module.exports = { signToken };
