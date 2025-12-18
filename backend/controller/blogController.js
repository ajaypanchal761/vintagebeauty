const Blog = require('../model/Blog');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// @desc    Get all blogs (Admin)
// @route   GET /api/blogs
// @access  Private/Admin
exports.getBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: {
        blogs
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get published blogs (Public)
// @route   GET /api/blogs/published
// @access  Public
exports.getPublishedBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .select('-metaTitle -metaDescription -metaKeywords');

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: {
        blogs
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog by ID
// @route   GET /api/blogs/:id
// @access  Private/Admin
exports.getBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        blog
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog by slug (Public)
// @route   GET /api/blogs/slug/:slug
// @access  Public
exports.getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: {
        blog
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create blog (Admin)
// @route   POST /api/blogs
// @access  Private/Admin
exports.createBlog = async (req, res, next) => {
  try {
    const blogData = { ...req.body };

    // Handle featured image upload
    if (req.files && req.files.featuredImage) {
      try {
        const file = Array.isArray(req.files.featuredImage) 
          ? req.files.featuredImage[0] 
          : req.files.featuredImage;

        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'apm-beauty-blogs',
              resource_type: 'image',
              transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          const bufferStream = new Readable();
          bufferStream.push(file.buffer);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        });

        blogData.featuredImage = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload featured image'
        });
      }
    }

    // Parse JSON fields if they come as strings
    if (typeof blogData.tags === 'string') {
      try {
        blogData.tags = JSON.parse(blogData.tags);
      } catch (e) {
        blogData.tags = [];
      }
    }

    if (typeof blogData.metaKeywords === 'string') {
      try {
        blogData.metaKeywords = JSON.parse(blogData.metaKeywords);
      } catch (e) {
        blogData.metaKeywords = [];
      }
    }

    // Convert boolean strings
    if (blogData.isFeatured === 'true' || blogData.isFeatured === true) {
      blogData.isFeatured = true;
    } else {
      blogData.isFeatured = false;
    }

    // Set publishedAt if status is published
    if (blogData.status === 'published') {
      blogData.publishedAt = new Date();
    }

    const blog = await Blog.create(blogData);

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update blog (Admin)
// @route   PUT /api/blogs/:id
// @access  Private/Admin
exports.updateBlog = async (req, res, next) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const blogData = { ...req.body };

    // Handle featured image upload
    if (req.files && req.files.featuredImage) {
      try {
        const file = Array.isArray(req.files.featuredImage) 
          ? req.files.featuredImage[0] 
          : req.files.featuredImage;

        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'apm-beauty-blogs',
              resource_type: 'image',
              transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          const bufferStream = new Readable();
          bufferStream.push(file.buffer);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        });

        blogData.featuredImage = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload featured image'
        });
      }
    }

    // Parse JSON fields if they come as strings
    if (typeof blogData.tags === 'string') {
      try {
        blogData.tags = JSON.parse(blogData.tags);
      } catch (e) {
        // Keep existing tags if parsing fails
      }
    }

    if (typeof blogData.metaKeywords === 'string') {
      try {
        blogData.metaKeywords = JSON.parse(blogData.metaKeywords);
      } catch (e) {
        // Keep existing keywords if parsing fails
      }
    }

    // Convert boolean strings
    if (blogData.isFeatured !== undefined) {
      blogData.isFeatured = blogData.isFeatured === 'true' || blogData.isFeatured === true;
    }

    // Handle status change
    if (blogData.status === 'published' && blog.status !== 'published') {
      blogData.publishedAt = new Date();
    } else if (blogData.status === 'draft' && blog.status === 'published') {
      // Don't change publishedAt if reverting to draft
      delete blogData.publishedAt;
    }

    // Update slug if title changed
    if (blogData.title && blogData.title !== blog.title) {
      blogData.slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      blogData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete blog (Admin)
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle blog status (Admin)
// @route   PATCH /api/blogs/:id/toggle-status
// @access  Private/Admin
exports.toggleBlogStatus = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    
    const updateData = { status: newStatus };
    if (newStatus === 'published' && !blog.publishedAt) {
      updateData.publishedAt = new Date();
    }

    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: `Blog ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`,
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get blog statistics (Admin)
// @route   GET /api/blogs/stats
// @access  Private/Admin
exports.getBlogStats = async (req, res, next) => {
  try {
    const blogs = await Blog.find();

    const stats = {
      total: blogs.length,
      published: blogs.filter(b => b.status === 'published').length,
      draft: blogs.filter(b => b.status === 'draft').length,
      totalViews: blogs.reduce((sum, blog) => sum + (blog.views || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

