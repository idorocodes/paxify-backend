const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

/**
 * Get user profile information
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
        .select('id, email, first_name, last_name, phone_number, matric_number, department, level, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Error fetching user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user profile information
 */
const updateProfile = async (req, res) => {
  try {
  const userId = req.user.id;
  const { first_name, last_name, faculty, department, matric_number, level, phone_number } = req.body;

    // Validate level
    if (level && !['100', '200', '300', '400', '500'].includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid level. Must be 100, 200, 300, 400, or 500'
      });
    }

    // Trim and format inputs
    const updates = {
      updated_at: new Date().toISOString()
    };

  if (first_name) updates.first_name = first_name.trim();
  if (last_name) updates.last_name = last_name.trim();
  if (matric_number) updates.matric_number = matric_number.trim().toUpperCase();
  if (level) updates.level = level;
  if (phone_number) updates.phone_number = phone_number.trim();
    if (department) {
      const deptTrim = department.trim();

      // Verify department exists by name or code (case-insensitive)
      const { data: matchedDept, error: deptError } = await supabase
        .from('departments')
        .select('id, name, code')
        .or(`name.ilike.%${deptTrim}%,code.ilike.%${deptTrim}%`)
        .eq('is_active', true)
        .limit(1);

      if (deptError) {
        logger.error('Department lookup error:', deptError);
        return res.status(500).json({
          success: false,
          message: 'Failed to verify department'
        });
      }

      if (!matchedDept || matchedDept.length === 0) {
        // provide a few suggestions to help user pick an existing department
        const { data: suggestions } = await supabase
          .from('departments')
          .select('name, code')
          .eq('is_active', true)
          .order('name', { ascending: true })
          .limit(10);

        return res.status(400).json({
          success: false,
          message: 'Department not found. Please pick an existing department by name or code.',
          suggestions: suggestions || []
        });
      }

      // Store canonical department name
      updates.department = matchedDept[0].name;
    }
    const { data: user, error } = await supabase
      .from('users')
        .update(updates)
        .eq('id', userId)
        .select('id, email, first_name, last_name, phone_number, matric_number, department, level, updated_at')
      .single();

    if (error) {
      logger.error('Error updating user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    // Validate passwords are provided
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user's current password hash
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      logger.error('Error fetching user:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify current password'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 12);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('Error updating password:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all due payments for the user
 */
const getDuePayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, sortBy = 'due_date' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('fee_assignments')
      .select(`
        id,
        amount,
        status,
        due_date,
        description,
        created_at,
        fee_categories:fee_category_id (
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    } else {
      // By default, only show pending and overdue payments
      query = query.in('status', ['pending', 'overdue']);
    }

    // Add sorting
    if (sortBy === 'amount') {
      query = query.order('amount', { ascending: true });
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: false });
    } else {
      // Default sort by due_date
      query = query.order('due_date', { ascending: true });
    }

    // Get total count and paginated results
    const { data: payments, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching due payments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch due payments'
      });
    }

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total: count,
          page,
          limit,
          total_pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get due payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getDuePayments
};