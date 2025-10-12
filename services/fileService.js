const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

const uploadFile = async (file, folder = 'receipts') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: `fuoye-payments/${folder}`,
      resource_type: 'auto'
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const generateReceipt = async (paymentData) => {
  try {
    // Generate HTML receipt
    const receiptHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .receipt { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin: 20px 0; }
            .items { border-collapse: collapse; width: 100%; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; }
            .footer { margin-top: 30px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>Payment Receipt</h1>
              <p>Federal University Oye-Ekiti</p>
            </div>
            
            <div class="details">
              <p><strong>Reference:</strong> ${paymentData.reference}</p>
              <p><strong>Date:</strong> ${new Date(paymentData.paid_at).toLocaleDateString()}</p>
              <p><strong>Student Name:</strong> ${paymentData.student.first_name} ${paymentData.student.last_name}</p>
              <p><strong>Matric Number:</strong> ${paymentData.student.matric_number}</p>
            </div>

            <table class="items">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${paymentData.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>₦${item.amount.toLocaleString()}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>₦${paymentData.total_amount.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              <p>Thank you for your payment</p>
              <small>This is a computer-generated receipt</small>
            </div>
          </div>
        </body>
      </html>
    `;

    // Convert HTML to PDF and upload to Cloudinary
    // Note: You might want to use a PDF generation library like puppeteer here
    const result = await cloudinary.uploader.upload(
      { content: receiptHtml },
      {
        folder: 'fuoye-payments/receipts',
        public_id: `receipt-${paymentData.reference}`,
        resource_type: 'raw',
        format: 'pdf'
      }
    );

    return {
      success: true,
      url: result.secure_url
    };
  } catch (error) {
    logger.error('Receipt generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  uploadFile,
  generateReceipt
};