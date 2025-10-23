const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Create a new department
 */
const createDepartment = async (req, res) => {
    try {
        const { name, code, faculty } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Department name is required'
            });
        }

        // Check if department already exists
        const { data: existing, error: checkError } = await supabase
            .from('departments')
            .select('id')
            .or(`name.ilike.${name},code.eq.${code}`);

        if (checkError) {
            logger.error('Department check error:', checkError);
            return res.status(500).json({
                success: false,
                message: 'Failed to check for existing department'
            });
        }

        if (existing && existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Department with this name or code already exists'
            });
        }

        // Determine actor id (admin middleware attaches req.admin)
        const actorId = req.admin?.sub || req.admin?.user_id || req.admin?.id || req.user?.id;

        if (!actorId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Create new department
        const { data: department, error } = await supabase
            .from('departments')
            .insert([{
                name,
                code,
                faculty_id: faculty,
                created_by: actorId,
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            logger.error('Create department error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create department'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: department
        });

    } catch (error) {
        logger.error('Create department error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Update a department
 */
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, faculty, is_active } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (code) updates.code = code;
        if (faculty) updates.faculty = faculty;
        if (is_active !== undefined) updates.is_active = is_active;
        
    updates.updated_at = new Date().toISOString();
    updates.updated_by = req.admin?.sub || req.admin?.user_id || req.admin?.id || req.user?.id;

        // Check if department exists
        const { data: existing, error: checkError } = await supabase
            .from('departments')
            .select('id')
            .eq('id', id)
            .single();

        if (checkError || !existing) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        const { data: department, error } = await supabase
            .from('departments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Update department error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update department'
            });
        }

        res.json({
            success: true,
            message: 'Department updated successfully',
            data: department
        });

    } catch (error) {
        logger.error('Update department error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Delete a department
 */
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if department exists
        const { data: existing, error: checkError } = await supabase
            .from('departments')
            .select('id')
            .eq('id', id)
            .single();

        if (checkError || !existing) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error('Delete department error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete department'
            });
        }

        res.json({
            success: true,
            message: 'Department deleted successfully'
        });

    } catch (error) {
        logger.error('Delete department error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Get departments list (for public access)
 */
const getDepartments = async (req, res) => {
    try {
        const { faculty, search } = req.query;
        
        let query = supabase
            .from('departments')
            .select('*')
            .eq('is_active', true);

        // Apply faculty filter
        if (faculty) {
            query = query.eq('faculty', faculty);
        }

        // Apply search filter
        if (search) {
            query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data: departments, error } = await query
            .order('name', { ascending: true });

        if (error) {
            logger.error('Get departments error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch departments'
            });
        }

        res.json({
            success: true,
            data: departments
        });

    } catch (error) {
        logger.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartments
};