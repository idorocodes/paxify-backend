const nodemailer = require('nodemailer');

// Create transporter (configure this with your email service)
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use app-specific password for Gmail
    },
  });
};

// Send email function
const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, studentName) => {
  const subject = 'Password Reset Request - Paxify';
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello ${studentName},</p>
      <p>You requested a password reset for your Paxify account. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
      </p>
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        This is an automated email from Paxify. Please do not reply to this email.
      </p>
    </div>
  `;
  
  const textContent = `
    Password Reset Request
    
    Hello ${studentName},
    
    You requested a password reset for your Paxify account. 
    Please visit this link to reset your password: ${resetUrl}
    
    This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
  `;

  return await sendEmail(email, subject, htmlContent, textContent);
};

// Send welcome email
const sendWelcomeEmail = async (email, studentName) => {
  const subject = 'Welcome to Paxify!';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Paxify!</h2>
      <p>Hello ${studentName},</p>
      <p>Your account has been successfully created. Welcome to the Paxify community!</p>
      <p>You can now log in to your account and start using our platform.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
           style="background-color: #28a745; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Login Now
        </a>
      </div>
      <p>If you have any questions, feel free to contact our support team.</p>
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        This is an automated email from Paxify. Please do not reply to this email.
      </p>
    </div>
  `;
  
  const textContent = `
    Welcome to Paxify!
    
    Hello ${studentName},
    
    Your account has been successfully created. Welcome to the Paxify community!
    You can now log in to your account and start using our platform.
    
    Login at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
  `;

  return await sendEmail(email, subject, htmlContent, textContent);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};