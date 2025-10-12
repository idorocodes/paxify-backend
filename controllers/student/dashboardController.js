const supabase = require("../../database/dbconfig");

/**
 * Get dashboard statistics for a student
 */
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get total payments count
        const { count: totalPayments } = await supabase
            .from('payments')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

        // Get upcoming payments (pending payments)
        const { data: upcomingPayments } = await supabase
            .from('fee_assignments')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .not('fee_id', 'in', 
                supabase.from('payment_items')
                .select('fee_category_id')
                .eq('status', 'success')
            );

        // Get pending payments (initiated but not completed)
        const { data: pendingPayments } = await supabase
            .from('payments')
            .select(`
                id,
                amount,
                status,
                created_at,
                payment_items (
                    fee_category_id,
                    fee_categories (name)
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        // Get recent transactions
        const { data: recentTransactions } = await supabase
            .from('payments')
            .select(`
                id,
                amount,
                status,
                created_at,
                payment_items (
                    fee_category_id,
                    fee_categories (name)
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        res.json({
            success: true,
            data: {
                total_payments: totalPayments || 0,
                upcoming_payments: upcomingPayments?.length || 0,
                pending_payments: pendingPayments?.length || 0,
                recent_transactions: recentTransactions?.map(payment => ({
                    id: payment.id,
                    amount: payment.amount,
                    status: payment.status,
                    created_at: payment.created_at,
                    fee_name: payment.payment_items?.[0]?.fee_categories?.name || 'Payment'
                })) || []
            }
        });

    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
};

module.exports = {
    getDashboardStats
};