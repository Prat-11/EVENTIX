
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'eventix_jwt_dev_secret';


export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields required' 
        });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Hash password into 12 salt rounds which add strings every time there is a diffenrent salt which is added to password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: email === 'admin@eventix.com'
    });

    // Generate JWT
    const token = jwt.sign(
      // this is payload
      { id: user._id, email: user.email },
      JWT_SECRET,
      // this is when the token expires 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Check if blocked
    if (user.blocked) {
      return res.status(401).json({ 
        success: false, 
        error: 'Account blocked' 
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin || false,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};


export const me = (req, res) => {
  const { _id, name, email, avatar, isAdmin } = req.user;
  res.json({ 
    success: true, 
    data: { id: _id, name, email, avatar, isAdmin } 
  });
};


export const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
