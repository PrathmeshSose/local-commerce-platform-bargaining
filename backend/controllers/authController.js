const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, businessName } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }
    const user = await User.create({
      name, email, password,
      role: role || 'CUSTOMER',
      businessName: role === 'SELLER' ? businessName : undefined,
    });
    if (user) {
      res.status(201).json({
        status: 'success',
        data: { _id: user.id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) },
      });
    } else {
      res.status(400).json({ status: 'error', message: 'Invalid user data' });
    }
  } catch (error) { next(error); }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
    res.json({
      status: 'success',
      data: { _id: user.id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) },
    });
  } catch (error) { next(error); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ status: 'success', data: user });
  } catch (error) { next(error); }
};

// NEW FIX: Allow updating location so sellers can actually list products
const updateProfile = async (req, res, next) => {
  try {
    const { lng, lat, businessName } = req.body;
    const user = await User.findById(req.user.id);
    
    if (lng !== undefined && lat !== undefined) {
      // Basic validation for lat/lng bounds
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ status: 'error', message: 'Invalid coordinates' });
      }
      user.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
    }
    if (businessName && user.role === 'SELLER') user.businessName = businessName;
    
    await user.save();
    res.status(200).json({ status: 'success', data: user });
  } catch (error) { next(error); }
};

module.exports = { registerUser, loginUser, getMe, updateProfile };
