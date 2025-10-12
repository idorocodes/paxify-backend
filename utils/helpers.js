/**
 * Generate a unique reference number
 */
const generateReference = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return `PAY-${timestamp}-${random}`.toUpperCase();
};

module.exports = {
    generateReference
};