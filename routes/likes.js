const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  toggleLike,
  getBlogLikes,
  getUserLikeStatus
} = require('../controllers/likeController');

const router = express.Router();

const toggleLikeValidation = [
  body('blog')
    .notEmpty()
    .withMessage('Blog ID is required')
    .isMongoId()
    .withMessage('Invalid blog ID'),
  body('type')
    .optional()
    .isIn(['like', 'dislike'])
    .withMessage('Type must be like or dislike')
];

router.post('/', auth, toggleLikeValidation, toggleLike);
router.get('/blog/:blogId', getBlogLikes);
router.get('/blog/:blogId/status', auth, getUserLikeStatus);

module.exports = router;
