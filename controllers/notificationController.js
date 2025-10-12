const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');

/**
 * Create a new notification
 */
const createNotification = async (userId, type, title, message, metadata = {}) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                metadata
            })
            .select()
            .single();

        if (error) {
            logger.error('Error creating notification:', error);
            return null;
        }

        return data;
    } catch (error) {
        logger.error('Create notification error:', error);
        return null;
    }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { data: notifications, error, count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            logger.error('Error fetching notifications:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications'
            });
        }

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    total: count,
                    page,
                    limit,
                    total_pages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Mark notifications as read
 */
const markNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notification_ids } = req.body;

        if (!Array.isArray(notification_ids)) {
            return res.status(400).json({
                success: false,
                message: 'notification_ids must be an array'
            });
        }

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .in('id', notification_ids);

        if (error) {
            logger.error('Error marking notifications as read:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to mark notifications as read'
            });
        }

        res.json({
            success: true,
            message: 'Notifications marked as read successfully'
        });

    } catch (error) {
        logger.error('Mark notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    markNotificationsAsRead
};