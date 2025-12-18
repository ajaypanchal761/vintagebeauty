const Announcement = require('../model/Announcement');

// @desc    Get all announcements (Admin)
// @route   GET /api/announcements
// @access  Private/Admin
exports.getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: {
        announcements,
        total: announcements.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active announcements (Public)
// @route   GET /api/announcements/active
// @access  Public
exports.getActiveAnnouncements = async (req, res, next) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      status: 'active',
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    }).sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private/Admin
exports.getAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { announcement }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get announcement stats
// @route   GET /api/announcements/stats
// @access  Private/Admin
exports.getAnnouncementStats = async (req, res, next) => {
  try {
    const total = await Announcement.countDocuments();
    const active = await Announcement.countDocuments({ status: 'active' });
    const draft = await Announcement.countDocuments({ status: 'draft' });
    
    const statsResult = await Announcement.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalClicks: { $sum: '$clicks' }
        }
      }
    ]);

    const totalViews = statsResult[0]?.totalViews || 0;
    const totalClicks = statsResult[0]?.totalClicks || 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          active,
          draft,
          totalViews,
          totalClicks
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create announcement (Admin)
// @route   POST /api/announcements
// @access  Private/Admin
exports.createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create(req.body);

    // Emit Socket.IO event for new announcement notification
    const io = req.app.get('io');
    if (io && announcement.status === 'active') {
      io.emit('new-announcement', {
        id: announcement._id.toString(),
        type: 'announcement',
        title: announcement.title || 'New Announcement',
        message: announcement.content || 'A new announcement has been posted',
        data: {
          announcementId: announcement._id.toString(),
          link: announcement.link || null
        },
        createdAt: announcement.createdAt
      });
    }

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update announcement (Admin)
// @route   PUT /api/announcements/:id
// @access  Private/Admin
exports.updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement (Admin)
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle announcement status (Admin)
// @route   PATCH /api/announcements/:id/toggle-status
// @access  Private/Admin
exports.toggleAnnouncementStatus = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Toggle between active and archived
    if (announcement.status === 'active') {
      announcement.status = 'archived';
    } else if (announcement.status === 'archived') {
      announcement.status = 'active';
    } else {
      // If draft, make it active
      announcement.status = 'active';
    }

    await announcement.save();

    res.status(200).json({
      success: true,
      message: 'Announcement status updated successfully',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Increment announcement views
// @route   PATCH /api/announcements/:id/view
// @access  Public
exports.incrementViews = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Increment announcement clicks
// @route   PATCH /api/announcements/:id/click
// @access  Public
exports.incrementClicks = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

