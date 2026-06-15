import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import db from '../config/db.js';

// Helper to generate token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password, role, specialty } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, password, and clinical role.' });
  }

  try {
    // Check if user already exists
    const checkEmail = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Clinician email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save to DB
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role, specialty) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, specialty',
      [name, email, passwordHash, role, specialty]
    );

    const newUser = result.rows[0];
    const token = generateToken(newUser.id, newUser.role);

    return res.status(201).json({
      success: true,
      message: 'Clinician registered successfully.',
      token,
      user: newUser
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    return res.status(500).json({ success: false, message: 'Server database registration failed.' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid clinical credentials.' });
    }

    const user = result.rows[0];
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid clinical credentials.' });
    }

    const token = generateToken(user.id, user.role);

    return res.json({
      success: true,
      message: 'Secure authorization token issued.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialty: user.specialty
      }
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ success: false, message: 'Server database login request failed.' });
  }
};

export const getMe = async (req, res) => {
  // Return user details bound to token from protect middleware
  return res.json({
    success: true,
    user: req.user
  });
};

export const getUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, specialty, created_at FROM users ORDER BY id ASC');
    return res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (error) {
    console.error("Get Users Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve clinician profiles.' });
  }
};

export const updateProfile = async (req, res) => {
  const { name, specialty } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Please provide a name.' });
  }

  try {
    const result = await db.query(
      `UPDATE users 
       SET name = $1, 
           specialty = $2 
       WHERE id = $3 RETURNING id, name, email, role, specialty`,
      [name, specialty, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Clinician profile not found.' });
    }

    return res.json({
      success: true,
      message: 'Clinical profile updated successfully.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to update clinical profile.' });
  }
};
