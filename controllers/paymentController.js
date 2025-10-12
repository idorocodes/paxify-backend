const supabase = require('../config/supabase');
const paystackService = require('../services/paystackService');
const fileService = require('../services/fileService');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { generatePaymentReference } = require('../utils/payment');

/**
 * Get list of all payments for a user
 */
const handleWebhook = async (req, res) => {
  try {
    const event = req.body;
    const secretHash = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'];

    // Verify webhook signature
    if (!paystackService.verifyWebhookSignature(event, signature, secretHash)) {
      return res.status(401).send('Invalid signature');
    }

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        const data = event.data;
        const reference = data.reference;

        // Get payment details from database
        const { data: payment, error } = await supabase
          .from('payments')
          .select('*')
          .eq('reference', reference)
          .single();

        if (!error && payment && payment.status !== 'completed') {
          // Update payment status
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              paid_at: data.paid_at,
              payment_gateway_response: data
            })
            .eq('id', payment.id);

          // Log the webhook event
          await supabase
            .from('webhook_logs')
            .insert([
              {
                event_type: event.event,
                reference,
                payload: event,
                processed_at: new Date().toISOString()
              }
            ]);
        }
        break;

      // Add other event types as needed
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.sendStatus(500);
  }
};

/**
 * Get detailed information about a specific payment
 */
const getPaymentDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentId = req.params.id;

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        payment_gateway_response,
        payment_items (
          id,
          amount,
          fee_category:fee_categories (
            name,
            description
          )
        ),
        receipt_url
      `)
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    logger.error('Payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Download payment receipt
 */
const downloadReceipt = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentId = req.params.id;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('receipt_url, status')
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'success' || !payment.receipt_url) {
      return res.status(400).json({
        success: false,
        message: 'Receipt not available'
      });
    }

    // Download receipt from storage
    const receiptBuffer = await fileService.downloadReceipt(payment.receipt_url);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${paymentId}.pdf"`);
    res.send(receiptBuffer);

  } catch (error) {
    logger.error('Receipt download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download receipt'
    });
  }
};

const initializePayment = async (req, res) => {
  try {
    const { fee_ids, idempotency_key: clientProvidedKey } = req.body;
    const user_id = req.user?.sub || req.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!Array.isArray(fee_ids) || fee_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'fee_ids must be a non-empty array'
      });
    }

    // Compute a derived idempotency key when the client doesn't provide one.
    const sortedFeeIds = [...fee_ids].map(String).sort();
    let derivedKey = clientProvidedKey || crypto.createHash('sha256')
      .update(`${user_id}:${sortedFeeIds.join(',')}`)
      .digest('hex');

    // If a payment already exists for this idempotency key, return it (idempotent)
    try {
      const { data: existing, error: existingErr } = await supabase
        .from('payments')
        .select('*')
        .eq('idempotency_key', derivedKey)
        .maybeSingle();

      if (existingErr) {
        logger.warn('Error checking existing idempotency key:', existingErr);
      }

      if (existing) {
        // Completed payments are returned as successful
        if (existing.status === 'completed') {
          return res.json({
            success: true,
            message: 'Payment already completed',
            data: {
              payment_id: existing.id,
              reference: existing.reference,
              status: existing.status,
              paid_at: existing.paid_at,
              total_amount: existing.total_amount,
              receipt_url: existing.receipt_url
            }
          });
        }

        // Pending: return existing initialization details
        if (existing.status === 'pending') {
          // try to extract a previously saved authorization_url from gateway response
          const authUrl = existing.payment_gateway_response?.authorization_url || existing.payment_gateway_response?.data?.authorization_url || null;
          return res.status(200).json({
            success: true,
            message: 'Payment already initialized',
            data: {
              payment_id: existing.id,
              reference: existing.reference,
              status: existing.status,
              total_amount: existing.total_amount,
              authorization_url: authUrl
            }
          });
        }

        // Failed: server will automatically create a fresh idempotency key and proceed
        if (existing.status === 'failed') {
          // create a non-deterministic suffix so we don't collide with previous failed attempts
          const suffix = crypto.randomBytes(8).toString('hex');
          // append suffix to derivedKey to create a new unique key for this attempt
          // this keeps the frontend unchanged while allowing retries after failures
          // (we don't mutate clientProvidedKey; we only use the new key for DB insert)
          const newDerivedKey = `${derivedKey}:${suffix}`;
          // replace derivedKey for subsequent insertion
          derivedKey = newDerivedKey;
          logger.info(`Previous payment failed; using new server-generated idempotency key for user ${user_id}`);
        }
      }
    } catch (e) {
      logger.warn('Idempotency check failed:', e);
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get fee details
    const { data: fees, error: feesError } = await supabase
      .from('fee_categories')
      .select('*')
      .in('id', fee_ids)
      .eq('is_active', true);

    if (feesError || !fees.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fee selection'
      });
    }

    // Calculate total amount
    const total_amount = fees.reduce((sum, fee) => sum + fee.amount, 0);

    // Initialize payment in database (include idempotency key)
    let payment;
    try {
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            user_id,
            total_amount,
            amount: total_amount,
            reference: generatePaymentReference(),
            status: 'pending',
            idempotency_key: derivedKey,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (paymentError) {
        // Handle unique constraint race: try to fetch existing payment by idempotency key
        logger.warn('Payment creation error (attempting idempotency fallback):', paymentError);
        const { data: fallback, error: fallbackErr } = await supabase
          .from('payments')
          .select('*')
          .eq('idempotency_key', derivedKey)
          .maybeSingle();

        if (fallback && !fallbackErr) {
          payment = fallback;
        } else {
          return res.status(500).json({
            success: false,
            message: 'Error creating payment'
          });
        }
      } else {
        payment = paymentData;
      }
    } catch (e) {
      logger.error('Payment creation exception:', e);
      return res.status(500).json({ success: false, message: 'Error creating payment' });
    }

    // Create payment items (idempotent: payment items for a given payment_id should be unique by payment_id + fee_category_id in DB but we assume clean state)
    const payment_items = fees.map(fee => ({
      payment_id: payment.id,
      fee_category_id: fee.id,
      amount: fee.amount
    }));

    await supabase
      .from('payment_items')
      .insert(payment_items);

    // Initialize payment with Paystack
    const paymentResult = await paystackService.initializePayment({
      email: user.email,
      amount: total_amount,
      metadata: {
        user_id,
        payment_id: payment.id,
        fees: fees.map(f => f.id)
      }
    });

    if (!paymentResult.success) {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          payment_gateway_response: { error: paymentResult.error }
        })
        .eq('id', payment.id);

      return res.status(500).json({
        success: false,
        message: 'Payment initialization failed'
      });
    }

    // Update payment reference and store gateway response (helps idempotency clients later)
    await supabase
      .from('payments')
      .update({
        reference: paymentResult.data.reference,
        payment_gateway_reference: paymentResult.data.access_code,
        payment_gateway_response: paymentResult.data
      })
      .eq('id', payment.id);

    res.status(201).json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        payment_id: payment.id,
        reference: paymentResult.data.reference,
        authorization_url: paymentResult.data.authorization_url,
        total_amount,
        items: fees.map(fee => ({
          fee_id: fee.id,
          name: fee.name,
          amount: fee.amount
        }))
      }
    });

  } catch (error) {
    logger.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, users(*), payment_items(*, fee_categories(*))')
      .eq('reference', reference)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // If payment is already completed, return existing data
    if (payment.status === 'completed') {
      return res.json({
        success: true,
        data: {
          reference: payment.reference,
          status: payment.status,
          total_amount: payment.total_amount,
          paid_at: payment.paid_at,
          receipt_url: payment.receipt_url
        }
      });
    }

    // Verify with Paystack
    const verificationResult = await paystackService.verifyPayment(reference);

    if (!verificationResult.success) {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          payment_gateway_response: { error: verificationResult.error }
        })
        .eq('id', payment.id);

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const { data: verifiedPayment } = verificationResult;

    if (verifiedPayment.status === 'success') {
      // Generate receipt
      const receiptData = {
        reference: payment.reference,
        paid_at: verifiedPayment.paid_at,
        student: {
          first_name: payment.users.first_name,
          last_name: payment.users.last_name,
          matric_number: payment.users.matric_number
        },
        total_amount: payment.total_amount,
        items: payment.payment_items.map(item => ({
          name: item.fee_categories.name,
          amount: item.amount
        }))
      };

      const receipt = await fileService.generateReceipt(receiptData);

      // Update payment status
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          paid_at: verifiedPayment.paid_at,
          payment_gateway_response: verifiedPayment,
          receipt_url: receipt.url
        })
        .eq('id', payment.id);

      // Create audit log
      await supabase
        .from('audit_logs')
        .insert([
          {
            user_id: payment.user_id,
            action: 'payment_completed',
            entity_type: 'payment',
            entity_id: payment.id,
            details: {
              reference,
              amount: payment.total_amount
            }
          }
        ]);
    }

    res.json({
      success: true,
      data: {
        payment_id: payment.id,
        reference: payment.reference,
        status: verifiedPayment.status,
        total_amount: payment.total_amount,
        paid_at: verifiedPayment.paid_at,
        receipt_url: receipt?.url
      }
    });

  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const user_id = req.user?.sub || req.user?.id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('payments')
      .select('*, payment_items(*, fee_categories(*))', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Payment history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching payment history'
      });
    }

    // Calculate statistics
    const { data: stats } = await supabase
      .rpc('get_payment_statistics', { user_id });

    res.json({
      success: true,
      data: {
        payments: payments.map(p => ({
          id: p.id,
          reference: p.reference,
          total_amount: p.total_amount,
          status: p.status,
          payment_method: p.payment_method,
          paid_at: p.paid_at,
          created_at: p.created_at,
          receipt_url: p.receipt_url,
          items: p.payment_items.map(item => ({
            name: item.fee_categories.name,
            amount: item.amount
          }))
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        },
        statistics: stats
      }
    });

  } catch (error) {
    logger.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
  downloadReceipt,
  handleWebhook
};