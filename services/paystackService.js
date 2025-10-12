const axios = require('axios');
const { generatePaymentReference, calculatePaystackAmount, verifyPaystackSignature } = require('../utils/payment');
const logger = require('../utils/logger');

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.baseUrl = 'https://api.paystack.co';
    this.headers = {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json'
    };
  }

  async initializePayment({
    email,
    amount,
    metadata = {},
    callback_url = process.env.FRONTEND_URL + '/payment/callback'
  }) {
    try {
      const reference = generatePaymentReference();
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email,
          amount: calculatePaystackAmount(amount), // Convert to kobo
          reference,
          callback_url,
          metadata
        },
        { headers: this.headers }
      );

      return {
        success: true,
        data: {
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          reference
        }
      };
    } catch (error) {
      logger.error('Paystack initialization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment initialization failed'
      };
    }
  }

  async verifyPayment(reference) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        { headers: this.headers }
      );

      const { data } = response.data;

      return {
        success: true,
        data: {
          reference: data.reference,
          amount: data.amount / 100, // Convert from kobo to naira
          status: data.status,
          paid_at: data.paid_at,
          channel: data.channel,
          currency: data.currency,
          fees: data.fees / 100,
          metadata: data.metadata,
          gateway_response: data.gateway_response
        }
      };
    } catch (error) {
      logger.error('Paystack verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment verification failed'
      };
    }
  }

  validateWebhookSignature(signature, rawBody) {
    return verifyPaystackSignature(rawBody, signature);
  }

  async getTransactionList({ from, to, page = 1, perPage = 50 } = {}) {
    try {
      const params = new URLSearchParams({
        page,
        perPage
      });

      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await axios.get(
        `${this.baseUrl}/transaction?${params.toString()}`,
        { headers: this.headers }
      );

      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta
      };
    } catch (error) {
      logger.error('Paystack transaction list error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transactions'
      };
    }
  }

  async refundTransaction(reference, amount = null) {
    try {
      const payload = { transaction: reference };
      if (amount) {
        payload.amount = calculatePaystackAmount(amount);
      }

      const response = await axios.post(
        `${this.baseUrl}/refund`,
        payload,
        { headers: this.headers }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('Paystack refund error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Refund failed'
      };
    }
  }
}

module.exports = new PaystackService();