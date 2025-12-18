const Support = require('../model/Support');

// @desc    Get all support queries (Admin)
// @route   GET /api/support/queries
// @access  Private/Admin
exports.getQueries = async (req, res, next) => {
  try {
    const queries = await Support.find({ type: 'query' })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    res.status(200).json({
      success: true,
      count: queries.length,
      data: {
        queries,
        total: queries.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all support tickets (Admin)
// @route   GET /api/support/tickets
// @access  Private/Admin
exports.getTickets = async (req, res, next) => {
  try {
    const tickets = await Support.find({ type: 'ticket' })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: {
        tickets,
        total: tickets.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single support item (Admin)
// @route   GET /api/support/:id
// @access  Private/Admin
exports.getSupportItem = async (req, res, next) => {
  try {
    const supportItem = await Support.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!supportItem) {
      return res.status(404).json({
        success: false,
        message: 'Support item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: supportItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create support query (Public)
// @route   POST /api/support/queries
// @access  Public
exports.createQuery = async (req, res, next) => {
  try {
    const { subject, message, customerName, customerEmail, customerPhone, category, priority, userId } = req.body;

    const query = await Support.create({
      type: 'query',
      subject,
      message,
      customerName,
      userName: customerName,
      customerEmail,
      email: customerEmail,
      customerPhone,
      phone: customerPhone,
      category: category || 'general',
      priority: priority || 'medium',
      userId,
      status: 'new'
    });

    res.status(201).json({
      success: true,
      message: 'Query submitted successfully',
      data: query
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create support ticket (Public)
// @route   POST /api/support/tickets
// @access  Public
exports.createTicket = async (req, res, next) => {
  try {
    const { title, description, customerName, customerEmail, customerPhone, category, priority, userId } = req.body;

    const ticket = await Support.create({
      type: 'ticket',
      title,
      description,
      customerName,
      userName: customerName,
      customerEmail,
      email: customerEmail,
      customerPhone,
      phone: customerPhone,
      category: category || 'general',
      priority: priority || 'medium',
      userId,
      status: 'new'
    });

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add response to query (Admin)
// @route   POST /api/support/queries/:id/response
// @access  Private/Admin
exports.addQueryResponse = async (req, res, next) => {
  try {
    const { message, senderName, senderEmail } = req.body;
    const query = await Support.findById(req.params.id);

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    if (query.type !== 'query') {
      return res.status(400).json({
        success: false,
        message: 'This is not a query'
      });
    }

    const response = {
      message,
      sender: 'admin',
      senderName: senderName || 'Admin',
      senderEmail: senderEmail || 'admin@vintagebeauty.com',
      isAdmin: true
    };

    query.responses.push(response);
    await query.save();

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: {
        response: query.responses[query.responses.length - 1]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add message to ticket (Admin)
// @route   POST /api/support/tickets/:id/message
// @access  Private/Admin
exports.addTicketMessage = async (req, res, next) => {
  try {
    const { message, senderName, senderEmail } = req.body;
    const ticket = await Support.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.type !== 'ticket') {
      return res.status(400).json({
        success: false,
        message: 'This is not a ticket'
      });
    }

    const newMessage = {
      message,
      sender: 'admin',
      senderName: senderName || 'Admin',
      senderEmail: senderEmail || 'admin@vintagebeauty.com',
      isAdmin: true
    };

    ticket.messages.push(newMessage);
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Message added successfully',
      data: {
        message: ticket.messages[ticket.messages.length - 1]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update support item status (Admin)
// @route   PATCH /api/support/:id/status
// @access  Private/Admin
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const supportItem = await Support.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true
      }
    );

    if (!supportItem) {
      return res.status(404).json({
        success: false,
        message: 'Support item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: supportItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update support item (Admin)
// @route   PUT /api/support/:id
// @access  Private/Admin
exports.updateSupportItem = async (req, res, next) => {
  try {
    const supportItem = await Support.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!supportItem) {
      return res.status(404).json({
        success: false,
        message: 'Support item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Support item updated successfully',
      data: supportItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete support item (Admin)
// @route   DELETE /api/support/:id
// @access  Private/Admin
exports.deleteSupportItem = async (req, res, next) => {
  try {
    const supportItem = await Support.findById(req.params.id);

    if (!supportItem) {
      return res.status(404).json({
        success: false,
        message: 'Support item not found'
      });
    }

    await supportItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Support item deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's support items (User)
// @route   GET /api/support/my
// @access  Private/User
exports.getMySupport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const supportItems = await Support.find({ userId })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: supportItems.length,
      data: {
        items: supportItems,
        total: supportItems.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get support statistics (Admin)
// @route   GET /api/support/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const queries = await Support.find({ type: 'query' });
    const tickets = await Support.find({ type: 'ticket' });

    const stats = {
      totalQueries: queries.length,
      openQueries: queries.filter(q => q.status === 'open' || q.status === 'new').length,
      resolvedQueries: queries.filter(q => q.status === 'resolved').length,
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status === 'open' || t.status === 'new').length,
      resolvedTickets: tickets.filter(t => t.status === 'resolved').length
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};


