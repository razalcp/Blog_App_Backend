const { validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const Category = require('../models/Category');

const createBlog = async (req, res) => {

  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { title, content, excerpt, category, tags, featuredImage, status } = req.body;
   
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    const blog = new Blog({
      title,
      content,
      excerpt,
      author: req.user.id,
      category,
      tags: tags || [],
      featuredImage: featuredImage || '',
      status: status || 'draft',
      isPublished: status === 'published'
    });

   
    await blog.save();
  
    
    await blog.populate('author', 'username email avatar');
    await blog.populate('category', 'name color');

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: {
        blog
      }
    });
  } catch (error) {

    console.log("create blog error : ----------------> ",error);
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { category, author, search, status } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (author) {
      query.author = author;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    } else {
      query.status = 'published';
    }

    const blogs = await Blog.find(query)
      .populate('author', 'username email avatar')
      .populate('category', 'name color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        blogs,
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

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'username email avatar bio')
      .populate('category', 'name color')
      .populate('comments');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: {
        blog
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

const updateBlog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }

    const { title, content, excerpt, category, tags, featuredImage, status } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
      blog.category = category;
    }

    if (title) blog.title = title;
    if (content) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (tags) blog.tags = tags;
    if (featuredImage !== undefined) blog.featuredImage = featuredImage;
    if (status) {
      blog.status = status;
      blog.isPublished = status === 'published';
    }

    await blog.save();
    await blog.populate('author', 'username email avatar');
    await blog.populate('category', 'name color');

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: {
        blog
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

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getMyBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status } = req.query;
    let query = { author: req.user.id };

    if (status) {
      query.status = status;
    }

    const blogs = await Blog.find(query)
      .populate('category', 'name color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        blogs,
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

module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getMyBlogs
};
