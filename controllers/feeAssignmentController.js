const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');

/**
 * Assign fee to students based on criteria
 */
const assignFeeToStudents = async (req, res) => {
    try {
        const { 
            fee_category_id,
            target_type,           // 'LEVEL', 'FACULTY', 'DEPARTMENT', or 'CUSTOM_GROUP'
            levels,                // Array of levels for level-based assignment
            faculty_ids,           // Array of faculty IDs for faculty-based assignment
            departments,           // Array of department IDs for department-based assignment
            student_ids,           // Optional array of specific student IDs
            due_date,              // Optional due date for the payment
            description            // Optional description
        } = req.body;

        // Validate required fields
        // Allow target_type 'ALL' to assign to all active students
        const allowedTypes = ['LEVEL', 'FACULTY', 'DEPARTMENT', 'CUSTOM_GROUP', 'ALL'];
        if (!fee_category_id || !target_type) {
            return res.status(400).json({
                success: false,
                message: 'Fee category and target type are required'
            });
        }

        if (!allowedTypes.includes(target_type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid target_type. Allowed values: ${allowedTypes.join(', ')}`
            });
        }

        // Validate target type specific requirements
        if (target_type === 'LEVEL' && (!levels || !Array.isArray(levels) || levels.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'At least one level is required for level-based fee assignment'
            });
        }

        if (target_type === 'FACULTY' && (!faculty_ids || !Array.isArray(faculty_ids) || faculty_ids.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'At least one faculty is required for faculty-based fee assignment'
            });
        }

        if (target_type === 'DEPARTMENT' && (!departments || !Array.isArray(departments) || departments.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'At least one department is required for department-based fee assignment'
            });
        }

        if (target_type === 'CUSTOM_GROUP' && (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'At least one student is required for custom group fee assignment'
            });
        }

        // Get fee category details
        const { data: feeCategory, error: feeError } = await supabase
            .from('fee_categories')
            .select('*')
            .eq('id', fee_category_id)
            .maybeSingle();

        if (feeError || !feeCategory) {
            logger.error('Fee category fetch error:', feeError);
            return res.status(404).json({
                success: false,
                message: 'Fee category not found'
            });
        }

        // Build query to get target students
        let query = supabase.from('users').select('id, first_name, last_name, email, level, department');

        if (target_type === 'LEVEL') {
            query = query.in('level', levels);
            if (departments && departments.length > 0) {
                query = query.in('department', departments);
            }
        } else if (target_type === 'FACULTY') {
            query = query.in('faculty_id', faculty_ids);
            if (levels && levels.length > 0) {
                query = query.in('level', levels);
            }
            if (departments && departments.length > 0) {
                query = query.in('department', departments);
            }
        } else if (target_type === 'DEPARTMENT') {
            query = query.in('department', departments);
        } else if (target_type === 'CUSTOM_GROUP' && student_ids && student_ids.length > 0) {
            query = query.in('id', student_ids);
        }

        // Ensure we only select active non-admin students
        query = query.eq('is_active', true).neq('is_admin', true);

        // Get target students
        const { data: students, error: studentsError } = await query;

        if (studentsError) {
            logger.error('Students fetch error:', studentsError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch target students'
            });
        }

        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found matching the criteria'
            });
        }

        // Create fee assignments and notifications for each student
        const actorId = req.admin?.sub || req.admin?.user_id || req.admin?.id || req.user?.id;
        if (!actorId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const assignments = students.map(student => ({
            user_id: student.id,
            fee_category_id,
            amount: feeCategory.amount,
            status: 'pending',
            due_date: due_date || null,
            description: description || null,
            created_by: actorId
        }));

        // Insert fee assignments
        const { error: assignError } = await supabase
            .from('fee_assignments')
            .insert(assignments);

        if (assignError) {
            logger.error('Fee assignment error:', assignError);
            return res.status(500).json({
                success: false,
                message: 'Failed to assign fees'
            });
        }

        // Create notifications for all students
        await notificationService.createGroupNotification({
            targetType: target_type,
            criteria: {
                levels: levels || null,
                departments: departments || null,
                studentIds: student_ids || null
            },
            type: 'FEE_ASSIGNED',
            title: 'New Fee Assignment',
            message: `A new fee of ₦${feeCategory.amount} has been assigned to you as ${feeCategory.name}`,
            metadata: {
                fee_category_id,
                fee_name: feeCategory.name,
                amount: feeCategory.amount,
                due_date
            }
        });

        const assigned_user_ids = students.map(s => s.id);
        const assigned_users = students.map(s => ({ id: s.id, email: s.email, name: `${s.first_name} ${s.last_name}` }));
        logger.info(`Fee assigned by ${actorId} to users: ${assigned_user_ids.join(',')}`);

        res.json({
            success: true,
            message: `Fee successfully assigned to ${students.length} students`,
            data: {
                fee_category: feeCategory,
                assigned_count: students.length,
                assigned_user_ids,
                assigned_users,
                target_type,
                levels: levels || null,
                faculty_ids: faculty_ids || null,
                departments: departments || null
            }
        });

    } catch (error) {
        logger.error('Assign fee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign fee'
        });
    }
};

module.exports = {
    assignFeeToStudents
};