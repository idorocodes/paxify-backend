const jwt = require('jsonwebtoken');

const generateToken = (user, isRefreshToken = false) => {
  const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
  const expiresIn = isRefreshToken ? process.env.JWT_REFRESH_EXPIRES_IN : process.env.JWT_EXPIRES_IN;
  
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      matric_number: user.matric_number,
      type: 'student'
    },
    secret,
    { expiresIn }
  );
};

const generateAdminToken = (admin, isRefreshToken = false) => {
  const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
  const expiresIn = isRefreshToken ? process.env.JWT_REFRESH_EXPIRES_IN : process.env.JWT_EXPIRES_IN;
  
  return jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin'
    },
    secret,
    { expiresIn }
  );
};

const verifyToken = (token, isRefreshToken = false) => {
  const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  generateAdminToken,
  verifyToken
};