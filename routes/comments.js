const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  createComment,
  getCommentsByBlog,
  updateComment,
  deleteComment,
  likeComment
} = require('../controllers/commentController');

const router = express.Router();

const createCommentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('blog')
    .notEmpty()
    .withMessage('Blog ID is required')
    .isMongoId()
    .withMessage('Invalid blog ID'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
];

const updateCommentValidation = [
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Comment content cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('isApproved')
    .optional()
    .isBoolean()
    .withMessage('isApproved must be a boolean')
];

router.post('/', auth, createCommentValidation, createComment);
router.get('/blog/:blogId', getCommentsByBlog);
router.put('/:id', auth, updateCommentValidation, updateComment);
router.delete('/:id', auth, deleteComment);
router.post('/:id/like', auth, likeComment);

module.exports = router;
