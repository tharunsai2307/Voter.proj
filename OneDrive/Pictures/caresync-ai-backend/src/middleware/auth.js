import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import db from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token required.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // Fetch user details from DB / Mock
    const userResult = await db.query('SELECT id, name, email, role, specialty FROM users WHERE id = $1', [decoded.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Authorized user not found in database.' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authorization token.' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Access restricted. Required roles: [${roles.join(', ')}]. Current role: ${req.user ? req.user.role : 'None'}` 
      });
    }
    next();
  };
};
