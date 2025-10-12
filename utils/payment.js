const crypto = require('crypto');

const generatePaymentReference = () => {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(4).toString('hex');
  return `PAX-${timestamp}-${random}`;
};

const calculatePaystackAmount = (amount) => {
  // Convert amount to kobo (multiply by 100)
  return Math.round(amount * 100);
};

const verifyPaystackSignature = (requestBody, paystackSignature) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(requestBody))
    .digest('hex');
  
  return hash === paystackSignature;
};

module.exports = {
  generatePaymentReference,
  calculatePaystackAmount,
  verifyPaystackSignature
};