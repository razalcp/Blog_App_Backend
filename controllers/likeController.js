const { validationResult } = require('express-validator');
const Like = require('../models/Like');
const Blog = require('../models/Blog');

const toggleLike = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { blog, type } = req.body;

    const blogExists = await Blog.findById(blog);
    if (!blogExists) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const existingLike = await Like.findOne({ 
      user: req.user.id, 
      blog 
    });

    if (existingLike) {
      if (existingLike.type === type) {
        await Like.findByIdAndDelete(existingLike._id);
        
        await Blog.findByIdAndUpdate(
          blog,
          { $pull: { likes: req.user.id } }
        );

        res.status(200).json({
          success: true,
          message: `${type} removed`,
          data: {
            isLiked: false,
            likeCount: blogExists.likes.length - 1
          }
        });
      } else {
        existingLike.type = type;
        await existingLike.save();

        res.status(200).json({
          success: true,
          message: `Changed to ${type}`,
          data: {
            isLiked: true,
            likeType: type,
            likeCount: blogExists.likes.length
          }
        });
      }
    } else {
      const like = new Like({
        user: req.user.id,
        blog,
        type: type || 'like'
      });

      await like.save();

      await Blog.findByIdAndUpdate(
        blog,
        { $push: { likes: req.user.id } }
      );

      res.status(201).json({
        success: true,
        message: `Blog ${type}d`,
        data: {
          isLiked: true,
          likeType: type,
          likeCount: blogExists.likes.length + 1
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getBlogLikes = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId)
      .populate('likes', 'username email avatar');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const likes = await Like.find({ blog: req.params.blogId })
      .populate('user', 'username email avatar')
      .sort({ createdAt: -1 });

    const likeStats = {
      totalLikes: likes.filter(like => like.type === 'like').length,
      totalDislikes: likes.filter(like => like.type === 'dislike').length,
      total: likes.length
    };

    res.status(200).json({
      success: true,
      data: {
        likes: blog.likes,
        stats: likeStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getUserLikeStatus = async (req, res) => {
  try {
    const like = await Like.findOne({ 
      user: req.user.id, 
      blog: req.params.blogId 
    });

    res.status(200).json({
      success: true,
      data: {
        isLiked: !!like,
        likeType: like ? like.type : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  toggleLike,
  getBlogLikes,
  getUserLikeStatus
};
