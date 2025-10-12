const supabase = require('../../database/dbconfig');
const logger = require('../../utils/logger');
const { generateReference } = require('../../utils/helpers');
const paystack = require('../../services/paystack');

/**
 * Initialize a new payment
 */
const initializePayment = async (req, res) => {
    try {
        const { fee_ids } = req.body;
        const user_id = req.user.id;

        if (!fee_ids || !Array.isArray(fee_ids) || fee_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one fee id is required'
            });
        }

        // Get fee details and calculate total
        const feeIds = fee_ids;
        const { data: fees, error: feeError } = await supabase
            .from('fee_categories')
            .select('id, name, amount')
            .in('id', feeIds)
            .eq('is_active', true);

        if (feeError || !fees) {
            logger.error('Fee fetch error:', feeError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch fee details'
            });
        }

        // Validate all fees exist and are active
        if (fees.length !== feeIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more fee categories are invalid or inactive'
            });
        }

        // Calculate total amount
        const total_amount = fees.reduce((sum, fee) => sum + Number(fee.amount), 0);

        // Get user details for payment
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email, first_name, last_name')
            .eq('id', user_id)
            .single();

        if (userError || !user) {
            logger.error('User fetch error:', userError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch user details'
            });
        }

        // Generate unique payment reference
        const reference = generateReference();

        // Create payment record
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([{
                user_id,
                amount: total_amount,
                reference,
                description: `Payment for ${fees.map(f => f.name).join(', ')}`,
                status: 'pending',
                provider: 'paystack',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (paymentError) {
            logger.error('Payment creation error:', paymentError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment record'
            });
        }

        // Create payment items
        const payment_items = fees.map(fee => ({
            payment_id: payment.id,
            fee_category_id: fee.id,
            amount: fee.amount
        }));

        const { error: itemsError } = await supabase
            .from('payment_items')
            .insert(payment_items);

        if (itemsError) {
            logger.error('Payment items creation error:', itemsError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment items'
            });
        }

        // Initialize payment with Paystack
        const paymentData = {
            amount: total_amount * 100, // Convert to kobo
            email: user.email,
            reference,
            metadata: {
                user_id,
                payment_id: payment.id,
                full_name: `${user.first_name} ${user.last_name}`
            }
        };

        const initializeResponse = await paystack.initialize(paymentData);

        res.json({
            success: true,
            message: 'Payment initialized successfully',
            data: {
                payment_id: payment.id,
                reference,
                amount: total_amount,
                authorization_url: initializeResponse.authorization_url
            }
        });

    } catch (error) {
        logger.error('Payment initialization error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize payment'
        });
    }
};

/**
 * Verify payment status
 */
const verifyPayment = async (req, res) => {
    try {
        const { reference } = req.params;

        // Get payment details
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('reference', reference)
            .single();

        if (paymentError || !payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Check if payment is already completed
        if (payment.status === 'completed') {
            return res.json({
                success: true,
                message: 'Payment already verified',
                data: {
                    status: payment.status,
                    reference: payment.reference,
                    receipt_url: payment.receipt_url
                }
            });
        }

        // Verify with Paystack
        const verificationResponse = await paystack.verify(reference);

        if (verificationResponse.status === 'success') {
            // Update payment status
            const { error: updateError } = await supabase
                .from('payments')
                .update({
                    status: 'completed',
                    provider_reference: verificationResponse.reference,
                    provider_response: verificationResponse,
                    payment_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', payment.id);

            if (updateError) {
                logger.error('Payment update error:', updateError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update payment status'
                });
            }

            // Generate receipt
            await generateReceipt(payment.id);

            res.json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    status: 'completed',
                    reference: payment.reference
                }
            });
        } else {
            res.json({
                success: false,
                message: 'Payment verification failed',
                data: {
                    status: verificationResponse.status
                }
            });
        }

    } catch (error) {
        logger.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment'
        });
    }
};

/**
 * Handle payment webhook
 */
const handleWebhook = async (req, res) => {
    try {
        const event = req.body;

        // Verify webhook signature
        const isValid = paystack.validateWebhook(req);
        if (!isValid) {
            return res.status(400).send('Invalid signature');
        }

        const { reference } = event.data;

        // Update payment status based on event
        if (event.event === 'charge.success') {
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .select('id, status')
                .eq('reference', reference)
                .single();

            if (paymentError || !payment) {
                logger.error('Payment not found:', reference);
                return res.send('OK');
            }

            if (payment.status !== 'completed') {
                const { error: updateError } = await supabase
                    .from('payments')
                    .update({
                        status: 'completed',
                        provider_reference: event.data.reference,
                        provider_response: event.data,
                        payment_date: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', payment.id);

                if (updateError) {
                    logger.error('Payment update error:', updateError);
                } else {
                    // Generate receipt
                    await generateReceipt(payment.id);
                }
            }
        }

        res.send('OK');

    } catch (error) {
        logger.error('Webhook processing error:', error);
        res.send('OK');
    }
};

/**
 * Get user payment history
 */
const getPaymentHistory = async (req, res) => {
    try {
        const { status, from_date, to_date } = req.query;
        const user_id = req.user.id;

        let query = supabase
            .from('payments')
            .select(`
                *,
                payment_items (
                    id,
                    fee_category_id,
                    amount,
                    academic_session,
                    semester,
                    fee_categories (name)
                )
            `)
            .eq('user_id', user_id)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (from_date) {
            query = query.gte('created_at', from_date);
        }

        if (to_date) {
            query = query.lte('created_at', to_date);
        }

        const { data: payments, error } = await query;

        if (error) {
            logger.error('Payment history fetch error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch payment history'
            });
        }

        res.json({
            success: true,
            data: payments || []
        });

    } catch (error) {
        logger.error('Get payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment history'
        });
    }
};

module.exports = {
    initializePayment,
    verifyPayment,
    handleWebhook,
    getPaymentHistory
};