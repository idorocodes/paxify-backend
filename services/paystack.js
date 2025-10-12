const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

class PaystackService {
    constructor() {
        this.secretKey = process.env.PAYSTACK_SECRET_KEY;
        this.baseURL = 'https://api.paystack.co';
    }

    /**
     * Initialize a payment transaction
     */
    async initialize(data) {
        try {
            const response = await axios.post(
                `${this.baseURL}/transaction/initialize`,
                {
                    ...data,
                    callback_url: process.env.PAYMENT_CALLBACK_URL
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.data;
        } catch (error) {
            logger.error('Paystack initialization error:', error.response?.data || error.message);
            throw new Error('Failed to initialize payment');
        }
    }

    /**
     * Verify a payment transaction
     */
    async verify(reference) {
        try {
            const response = await axios.get(
                `${this.baseURL}/transaction/verify/${reference}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.data;
        } catch (error) {
            logger.error('Paystack verification error:', error.response?.data || error.message);
            throw new Error('Failed to verify payment');
        }
    }

    /**
     * Validate webhook signature
     */
    validateWebhook(req) {
        try {
            const hash = crypto.createHmac('sha512', this.secretKey);
            hash.update(JSON.stringify(req.body));
            const signature = hash.digest('hex');
            
            return signature === req.headers['x-paystack-signature'];
        } catch (error) {
            logger.error('Webhook validation error:', error);
            return false;
        }
    }
}

module.exports = new PaystackService();