const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const { generatePDF } = require('../services/pdfService');

/**
 * Get dashboard statistics for admin
 */
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get various statistics in parallel
    const [
      { data: totalPayments, error: paymentsError },
      { data: monthlyPayments, error: monthlyError },
      { data: activeUsers, error: usersError },
      { data: recentPayments, error: recentError }
    ] = await Promise.all([
      // Total payments
      supabase.from('payments')
        .select('total_amount', { count: 'exact' })
        .eq('status', 'completed'),
      
      // Monthly payments
      supabase.from('payments')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString()),
      
      // Active users count
      supabase.from('users')
        .select('id', { count: 'exact' })
        .eq('is_active', true),
      
      // Recent payments
      supabase.from('payments')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          users (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    if (paymentsError || monthlyError || usersError || recentError) {
      throw new Error('Error fetching dashboard statistics');
    }

    const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + p.total_amount, 0);

    res.json({
      success: true,
      data: {
        total_payments: totalPayments.count,
        total_revenue: totalPayments.reduce((sum, p) => sum + p.total_amount, 0),
        monthly_revenue: monthlyTotal,
        active_users: activeUsers.count,
        recent_payments: recentPayments
      }
    });

  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

/**
 * Get all payments with filtering and pagination
 */
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('payments')
      .select(`
        *,
        users (
          first_name,
          last_name,
          email,
          matric_number
        ),
        payment_items (
          amount,
          fee_categories (
            name
          )
        )
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: payments, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
};

/**
 * Get all users with filtering and pagination
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,matric_number.ilike.%${search}%`);
    }

    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Remove sensitive information
    const sanitizedUsers = users.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      success: true,
      data: {
        users: sanitizedUsers,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

/**
 * Create a new fee category
 */
const createFeeCategory = async (req, res) => {
  try {
    const { name, description, amount } = req.body;

    // Validate required fields
    if (!name || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Name and valid amount are required'
      });
    }

    const { data: fee, error } = await supabase
      .from('fee_categories')
      .insert([{
        name,
        description,
        amount,
        created_by: req.user.id,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      logger.error('Create fee category error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create fee category'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Fee category created successfully',
      data: fee
    });

  } catch (error) {
    logger.error('Create fee category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update a fee category
 */
const updateFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, amount } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (amount && amount > 0) updates.amount = amount;
    updates.updated_at = new Date().toISOString();
    updates.updated_by = req.user.id;

    const { data: fee, error } = await supabase
      .from('fee_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Update fee category error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update fee category'
      });
    }

    res.json({
      success: true,
      message: 'Fee category updated successfully',
      data: fee
    });

  } catch (error) {
    logger.error('Update fee category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Deactivate a fee category (soft delete)
 */
const deactivateFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('fee_categories')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: req.user.id
      })
      .eq('id', id);

    if (error) {
      logger.error('Deactivate fee category error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to deactivate fee category'
      });
    }

    res.json({
      success: true,
      message: 'Fee category deactivated successfully'
    });

  } catch (error) {
    logger.error('Deactivate fee category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Generate revenue report
 */
const generateRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Get payment data
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        payment_items (
          amount,
          fee_categories (
            name
          )
        )
      `)
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Calculate statistics
    const totalRevenue = payments.reduce((sum, p) => sum + p.total_amount, 0);
    const dailyRevenue = payments.reduce((acc, p) => {
      const date = p.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + p.total_amount;
      return acc;
    }, {});

    // Generate revenue by fee category
    const revenueByCategory = payments.reduce((acc, p) => {
      p.payment_items.forEach(item => {
        const categoryName = item.fee_categories.name;
        acc[categoryName] = (acc[categoryName] || 0) + item.amount;
      });
      return acc;
    }, {});

    // Generate PDF report
    const reportData = {
      startDate,
      endDate,
      totalRevenue,
      dailyRevenue,
      revenueByCategory,
      paymentCount: payments.length
    };

    const pdfBuffer = await generatePDF('revenue-report', reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=revenue-report-${startDate}-${endDate}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    logger.error('Generate revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue report'
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllPayments,
  getAllUsers,
  createFeeCategory,
  updateFeeCategory,
  deactivateFeeCategory,
  generateRevenueReport
};