const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

/**
 * Format currency amounts
 * @param {number} amount Amount in kobo/cents
 * @returns {string} Formatted amount in Naira/Dollars
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount / 100);
};

/**
 * Format date to local string
 * @param {string} date ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Generate a revenue report PDF
 * @param {string} template Template name (e.g., 'revenue-report')
 * @param {object} data Report data
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePDF = (template, data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      switch (template) {
        case 'revenue-report':
          generateRevenueReport(doc, data);
          break;
          
        // Add more templates here as needed
        
        default:
          throw new Error('Unknown template');
      }

      doc.end();

    } catch (error) {
      logger.error('PDF generation error:', error);
      reject(error);
    }
  });
};

/**
 * Generate a revenue report
 * @param {PDFDocument} doc PDFKit document
 * @param {object} data Report data
 */
const generateRevenueReport = (doc, data) => {
  // Header
  doc.fontSize(20)
    .text('Revenue Report', { align: 'center' })
    .moveDown();

  doc.fontSize(12)
    .text(`Period: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`)
    .moveDown();

  // Summary section
  doc.fontSize(14)
    .text('Summary', { underline: true })
    .moveDown();

  doc.fontSize(12)
    .text(`Total Revenue: ${formatCurrency(data.totalRevenue)}`)
    .text(`Total Payments: ${data.paymentCount}`)
    .moveDown();

  // Daily Revenue Chart
  doc.fontSize(14)
    .text('Daily Revenue', { underline: true })
    .moveDown();

  const dailyData = Object.entries(data.dailyRevenue);
  const tableTop = doc.y;
  const columnWidth = (doc.page.width - 100) / 2;

  // Table headers
  doc.fontSize(12)
    .text('Date', 50, tableTop, { width: columnWidth, align: 'left' })
    .text('Revenue', 50 + columnWidth, tableTop, { width: columnWidth, align: 'right' });

  doc.moveDown();
  let yPos = doc.y;

  // Table rows
  dailyData.forEach(([date, amount], index) => {
    if (yPos + 20 > doc.page.height - 50) {
      doc.addPage();
      yPos = 50;
    }

    doc.fontSize(10)
      .text(formatDate(date), 50, yPos, { width: columnWidth, align: 'left' })
      .text(formatCurrency(amount), 50 + columnWidth, yPos, { width: columnWidth, align: 'right' });

    yPos += 20;
  });

  doc.moveDown(2);

  // Revenue by Category
  doc.addPage()
    .fontSize(14)
    .text('Revenue by Category', { underline: true })
    .moveDown();

  const categoryData = Object.entries(data.revenueByCategory);
  const categoryTop = doc.y;

  // Table headers
  doc.fontSize(12)
    .text('Category', 50, categoryTop, { width: columnWidth, align: 'left' })
    .text('Revenue', 50 + columnWidth, categoryTop, { width: columnWidth, align: 'right' });

  doc.moveDown();
  yPos = doc.y;

  // Table rows
  categoryData.forEach(([category, amount]) => {
    doc.fontSize(10)
      .text(category, 50, yPos, { width: columnWidth, align: 'left' })
      .text(formatCurrency(amount), 50 + columnWidth, yPos, { width: columnWidth, align: 'right' });

    yPos += 20;
  });

  // Footer
  doc.fontSize(8)
    .text(
      `Generated on ${new Date().toLocaleString('en-NG')}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
};

module.exports = {
  generatePDF
};