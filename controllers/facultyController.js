const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Create a new faculty
 */
const createFaculty = async (req, res) => {
    try {
        const { name, code } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: 'Faculty name and code are required'
            });
        }
        const { data: faculty, error } = await supabase
            .from('faculties')
            .insert([{
                name,
                code,
                created_by: req.admin.sub
            }])
            .select()
            .single();

        if (error) {
            logger.error('Create faculty error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create faculty'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Faculty created successfully',
            data: faculty
        });

    } catch (error) {
        logger.error('Create faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Update a faculty
 */
const updateFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, is_active } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (code) updates.code = code;
        if (is_active !== undefined) updates.is_active = is_active;
        updates.updated_at = new Date().toISOString();
        updates.updated_by = req.admin?.sub || null;

        const { data: faculty, error } = await supabase
            .from('faculties')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Update faculty error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update faculty'
            });
        }

        res.json({
            success: true,
            message: 'Faculty updated successfully',
            data: faculty
        });

    } catch (error) {
        logger.error('Update faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Get all faculties (public endpoint)
 */
const getAllFaculties = async (req, res) => {
    try {
        const { search } = req.query;
        
        let query = supabase
            .from('faculties')
            .select('id, name, code, is_active, created_at')
            .eq('is_active', true)
            .order('name', { ascending: true });

        // Add search filter if provided
        if (search) {
            query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data: faculties, error } = await query;

        if (error) {
            logger.error('Get faculties error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch faculties'
            });
        }

        res.json({
            success: true,
            data: faculties
        });

    } catch (error) {
        logger.error('Get faculties error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Delete a faculty (soft delete)
 */
const deleteFaculty = async (req, res) => {
    try {
        const { id } = req.params;

        // First, check if the faculty exists and is active
        const { data: existingFaculty, error: fetchError } = await supabase
            .from('faculties')
            .select('id, name')
            .eq('id', id)
            .eq('is_active', true)
            .single();

        if (fetchError || !existingFaculty) {
            return res.status(404).json({
                success: false,
                message: 'Faculty not found or already deleted'
            });
        }

        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('faculties')
            .update({
                is_active: false,
                updated_at: new Date().toISOString(),
                updated_by: req.admin?.sub || null
            })
            .eq('id', id);

        if (error) {
            logger.error('Delete faculty error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete faculty'
            });
        }

        res.json({
            success: true,
            message: 'Faculty deleted successfully'
        });

    } catch (error) {
        logger.error('Delete faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    createFaculty,
    updateFaculty,
    getAllFaculties,
    deleteFaculty
};