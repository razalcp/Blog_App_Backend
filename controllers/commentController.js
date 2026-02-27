const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Blog = require('../models/Blog');

const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { content, blog, parentComment } = req.body;

    const blogExists = await Blog.findById(blog);
    if (!blogExists) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    if (parentComment) {
      const parentExists = await Comment.findById(parentComment);
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    const comment = new Comment({
      content,
      author: req.user.id,
      blog,
      parentComment: parentComment || null
    });

    await comment.save();
    await comment.populate('author', 'username email avatar');

    if (parentComment) {
      await Comment.findByIdAndUpdate(
        parentComment,
        { $push: { replies: comment._id } }
      );
    } else {
      await Blog.findByIdAndUpdate(
        blog,
        { $push: { comments: comment._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment
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

const getCommentsByBlog = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ 
      blog: req.params.blogId,
      parentComment: null,
      isApproved: true 
    })
      .populate('author', 'username email avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username email avatar'
        },
        match: { isApproved: true }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ 
      blog: req.params.blogId,
      parentComment: null,
      isApproved: true 
    });

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
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

const updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    const { content, isApproved } = req.body;

    if (content) comment.content = content;
    if (isApproved !== undefined && req.user.role === 'admin') {
      comment.isApproved = isApproved;
    }

    await comment.save();
    await comment.populate('author', 'username email avatar');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment
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

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(
        comment.parentComment,
        { $pull: { replies: comment._id } }
      );
    } else {
      await Blog.findByIdAndUpdate(
        comment.blog,
        { $pull: { comments: comment._id } }
      );
      
      await Comment.deleteMany({ parentComment: comment._id });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const isLiked = comment.likes.includes(req.user.id);

    if (isLiked) {
      comment.likes.pull(req.user.id);
    } else {
      comment.likes.push(req.user.id);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      message: isLiked ? 'Comment unliked' : 'Comment liked',
      data: {
        likeCount: comment.likes.length,
        isLiked: !isLiked
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
  createComment,
  getCommentsByBlog,
  updateComment,
  deleteComment,
  likeComment
};
