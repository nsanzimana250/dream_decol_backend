const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect: auth } = require('../middleware/auth');

// @route   POST /api/booking
// @desc    Create a new booking
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, date, time, serviceType, notes } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !date || !time || !serviceType) {
      return res.status(400).json({
        error: 'All required fields must be provided',
        required: ['name', 'email', 'phone', 'date', 'time', 'serviceType']
      });
    }

    // Check for existing booking at the same date and time
    const existingBooking = await Booking.findOne({
      date,
      time,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(409).json({
        error: 'This time slot is already booked. Please choose a different time.'
      });
    }

    // Create new booking
    const booking = new Booking({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      date,
      time,
      serviceType,
      notes: notes ? notes.trim() : '',
      status: 'pending'
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        date: booking.date,
        time: booking.time,
        serviceType: booking.serviceType,
        notes: booking.notes,
        status: booking.status,
        createdAt: booking.createdAt,
        formattedDate: booking.formattedDate,
        formattedTime: booking.formattedTime
      }
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation error',
        details: messages
      });
    }

    res.status(500).json({
      error: 'Failed to create booking. Please try again.'
    });
  }
});

// @route   GET /api/booking/availability
// @desc    Check availability for a specific date
// @access  Public
router.get('/availability', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Date parameter is required'
      });
    }

    // Get all bookings for the specified date
    const bookings = await Booking.find({
      date,
      status: { $in: ['pending', 'confirmed'] }
    }).select('time');

    const bookedTimes = bookings.map(booking => booking.time);
    
    // Get time slots from configuration
    const allTimeSlots = await Booking.getAvailableTimeSlots();
    
    const availableSlots = allTimeSlots.filter(time => !bookedTimes.includes(time));

    res.json({
      success: true,
      date,
      availableSlots,
      bookedSlots: bookedTimes
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({
      error: 'Failed to check availability'
    });
  }
});

// @route   GET /api/booking/admin
// @desc    Get all bookings (Admin only)
// @access  Private
router.get('/admin', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      serviceType, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (serviceType && serviceType !== 'all') {
      filter.serviceType = serviceType;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count for pagination
    const total = await Booking.countDocuments(filter);
    
    // Get bookings with pagination and sorting
    const bookings = await Booking.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Transform data for frontend
    const transformedBookings = bookings.map(booking => ({
      id: booking._id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      date: booking.date,
      time: booking.time,
      serviceType: booking.serviceType,
      notes: booking.notes,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      formattedDate: new Date(booking.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      formattedTime: (() => {
        const [hours, minutes] = booking.time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      })()
    }));

    res.json({
      success: true,
      bookings: transformedBookings,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: bookings.length,
        totalCount: total
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings'
    });
  }
});

// @route   PUT /api/booking/admin/:id
// @desc    Update booking status or details (Admin only)
// @access  Private
router.put('/admin/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, name, email, phone, date, time, serviceType } = req.body;

    // Find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    // Check for time conflicts if date or time is being updated
    if (date || time) {
      const newDate = date || booking.date;
      const newTime = time || booking.time;
      
      const existingBooking = await Booking.findOne({
        _id: { $ne: id }, // Exclude current booking
        date: newDate,
        time: newTime,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (existingBooking) {
        return res.status(409).json({
          error: 'This time slot is already booked. Please choose a different time.'
        });
      }
    }

    // Update fields
    if (status) booking.status = status;
    if (notes !== undefined) booking.notes = notes;
    if (name) booking.name = name;
    if (email) booking.email = email;
    if (phone) booking.phone = phone;
    if (date) booking.date = date;
    if (time) booking.time = time;
    if (serviceType) booking.serviceType = serviceType;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: {
        id: booking._id,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        date: booking.date,
        time: booking.time,
        serviceType: booking.serviceType,
        notes: booking.notes,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        formattedDate: booking.formattedDate,
        formattedTime: booking.formattedTime
      }
    });
  } catch (error) {
    console.error('Update booking error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation error',
        details: messages
      });
    }

    res.status(500).json({
      error: 'Failed to update booking'
    });
  }
});

// @route   DELETE /api/booking/admin/:id
// @desc    Delete booking (Admin only)
// @access  Private
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      error: 'Failed to delete booking'
    });
  }
});

// @route   GET /api/booking/admin/stats
// @desc    Get booking statistics (Admin only)
// @access  Private
router.get('/admin/stats', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get basic counts
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    // Get recent bookings
    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Get bookings by service type
    const serviceTypeStats = await Booking.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get bookings by status for chart
    const statusStats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily bookings for the last 7 days
    const dailyBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        recent: recentBookings,
        serviceTypes: serviceTypeStats,
        status: statusStats,
        daily: dailyBookings
      }
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch booking statistics'
    });
  }
});

module.exports = router;