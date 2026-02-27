const express = require('express');
const { body } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllBlogs,
  deleteBlog,
  getDashboardStats
} = require('../controllers/adminController');

const router = express.Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['admin', 'author', 'reader']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], updateUser);
router.delete('/users/:id', deleteUser);

// Blog management
router.get('/blogs', getAllBlogs);
router.delete('/blogs/:id', deleteBlog);

module.exports = router;
