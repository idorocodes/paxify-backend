const supabase = require('../config/supabase');
const logger = require('../utils/logger');

const getAllFees = async (req, res) => {
  try {
    const {
      category_type,
      is_mandatory,
      academic_session,
      department,
      level
    } = req.query;

    let query = supabase
      .from('fee_categories')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category_type) {
      query = query.eq('category_type', category_type);
    }
    if (is_mandatory !== undefined) {
      query = query.eq('is_mandatory', is_mandatory === 'true');
    }
    if (academic_session) {
      query = query.eq('academic_session', academic_session);
    }
    if (department) {
      query = query.or(`department.eq.${department},department.is.null`);
    }
    if (level) {
      query = query.or(`level.eq.${level},level.is.null`);
    }

    const { data: fees, error } = await query;

    if (error) {
      logger.error('Error fetching fees:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching fees'
      });
    }

    res.json({
      success: true,
      data: {
        fees: fees.map(fee => ({
          id: fee.id,
          name: fee.name,
          description: fee.description,
          amount: fee.amount,
          category_type: fee.category_type,
          department: fee.department,
          level: fee.level,
          is_mandatory: fee.is_mandatory,
          academic_session: fee.academic_session,
          due_date: fee.due_date
        })),
        total: fees.length
      }
    });

  } catch (error) {
    logger.error('Fee listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getFeeDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: fee, error } = await supabase
      .from('fee_categories')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee not found'
      });
    }

    res.json({
      success: true,
      data: fee
    });

  } catch (error) {
    logger.error('Fee details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const createFee = async (req, res) => {
  try {
    const admin_id = req.admin.sub;
    const {
      name,
      description,
      amount,
      category_type,
      department,
      level,
      is_mandatory,
      academic_session,
      due_date
    } = req.body;

    const { data: fee, error } = await supabase
      .from('fee_categories')
      .insert([
        {
          name,
          description,
          amount,
          category_type,
          department,
          level,
          is_mandatory,
          academic_session,
          due_date,
          created_by: admin_id,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error('Fee creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating fee category'
      });
    }

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert([
        {
          admin_id,
          action: 'fee_created',
          entity_type: 'fee_category',
          entity_id: fee.id,
          details: { name, amount }
        }
      ]);

    res.status(201).json({
      success: true,
      message: 'Fee category created successfully',
      data: fee
    });

  } catch (error) {
    logger.error('Fee creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.admin?.sub;
    const {
      name,
      description,
      amount,
      is_recurring,
      frequency,
      is_active
    } = req.body;

    // Only include fields that exist in the fee_categories table
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (amount !== undefined) updates.amount = amount;
    if (is_recurring !== undefined) updates.is_recurring = is_recurring;
    if (frequency !== undefined) updates.frequency = frequency;
    if (is_active !== undefined) updates.is_active = is_active;

    // Don't include updated_at, let the database trigger handle it

    const { data: fee, error } = await supabase
      .from('fee_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Fee update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating fee category',
        error: error.message
      });
    }

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee category not found'
      });
    }

    // Create audit log if admin_id is available
    if (admin_id) {
      try {
        await supabase
          .from('audit_logs')
          .insert([
            {
              admin_id,
              action: 'fee_updated',
              entity_type: 'fee_category',
              entity_id: fee.id,
              details: updates
            }
          ]);
      } catch (auditError) {
        logger.error('Audit log error:', auditError);
        // Don't fail the request if audit logging fails
      }
    }

    res.json({
      success: true,
      message: 'Fee category updated successfully',
      data: fee
    });

  } catch (error) {
    logger.error('Fee update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const deactivateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.admin.sub;

    const { data: fee, error } = await supabase
      .from('fee_categories')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Fee deactivation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deactivating fee category'
      });
    }

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee category not found'
      });
    }

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert([
        {
          admin_id,
          action: 'fee_deactivated',
          entity_type: 'fee_category',
          entity_id: fee.id
        }
      ]);

    res.json({
      success: true,
      message: 'Fee category deactivated successfully'
    });

  } catch (error) {
    logger.error('Fee deactivation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllFees,
  getFeeDetails,
  createFee,
  updateFee,
  deactivateFee
};