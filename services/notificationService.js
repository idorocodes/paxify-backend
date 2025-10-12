const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class NotificationService {
    /**
     * Create notifications for a group of users based on criteria
     * @param {Object} options
     * @param {string} options.targetType - 'LEVEL' or 'CUSTOM_GROUP'
     * @param {Object} options.criteria - { level?, departments?, studentIds? }
     * @param {string} options.type - Notification type
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {Object} options.metadata - Additional data
     */
    async createGroupNotification(options) {
        const {
            targetType,
            criteria,
            type,
            title,
            message,
            metadata = {}
        } = options;

        try {
            // Start a query to get target users
            let query = supabase
                .from('users')
                .select('id');

            // Apply filters based on criteria
            // Support both criteria.level (single) and criteria.levels (array)
            if (targetType === 'LEVEL') {
                if (Array.isArray(criteria.levels) && criteria.levels.length > 0) {
                    query = query.in('level', criteria.levels);
                } else if (criteria.level) {
                    query = query.eq('level', criteria.level);
                }
            }

            // Departments filter (array)
            if (criteria.departments && Array.isArray(criteria.departments) && criteria.departments.length > 0) {
                query = query.in('department', criteria.departments);
            }

            // Student IDs filter (array) - sanitize to valid UUID-like strings
            if (criteria.studentIds && Array.isArray(criteria.studentIds) && criteria.studentIds.length > 0) {
                const cleanedIds = criteria.studentIds
                    .filter(id => typeof id === 'string' && id.trim().length > 0)
                    .map(id => id.trim());

                if (cleanedIds.length === 0) {
                    logger.warn('No valid studentIds provided for group notification');
                    return false;
                }

                query = query.in('id', cleanedIds);
            }

            // If targetType is 'ALL', no filters are applied (select all active users)

            // Always restrict to active users
            query = query.eq('is_active', true);

            // Get target users
            const { data: users, error: userError } = await query;

            if (userError) {
                logger.error('Error fetching target users:', userError);
                return false;
            }

            if (!users || users.length === 0) {
                logger.warn('No users found matching the criteria');
                return false;
            }

            // Create notifications for all target users
            const notificationsToInsert = users.map(user => ({
                user_id: user.id,
                type,
                title,
                message,
                metadata,
                target_type: targetType,
                target_criteria: criteria
            }));

            const { error: insertError } = await supabase
                .from('notifications')
                .insert(notificationsToInsert);

            if (insertError) {
                logger.error('Error creating group notifications:', insertError);
                return false;
            }

            return true;
        } catch (error) {
            logger.error('Group notification creation error:', error);
            return false;
        }
    }

    /**
     * Get user notifications with advanced filtering
     */
    async getUserNotifications(userId, options = {}) {
        const {
            page = 1,
            limit = 10,
            type,
            isRead
        } = options;

        try {
            let query = supabase
                .from('notifications')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);

            if (type) {
                query = query.eq('type', type);
            }

            if (typeof isRead === 'boolean') {
                query = query.eq('is_read', isRead);
            }

            const offset = (page - 1) * limit;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                logger.error('Error fetching user notifications:', error);
                return { error };
            }

            return {
                data,
                pagination: {
                    total: count,
                    page,
                    limit,
                    total_pages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('Get user notifications error:', error);
            return { error };
        }
    }
}

module.exports = new NotificationService();