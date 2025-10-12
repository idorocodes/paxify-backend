const nodemailer = require('nodemailer');

// Create transporter (configure this with your email service)
const createTransporter = () => {
  // Support both SMTP_* and EMAIL_* env var names for flexibility
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const secure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1';
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  const service = process.env.EMAIL_SERVICE || undefined;

  // If SMTP host is provided, use direct SMTP transport options
  if (host) {
    const opts = {
      host,
      port: port || 587,
      secure: !!secure,
      auth: {
        user,
        pass
      }
    };
    return nodemailer.createTransport(opts);
  }

  // Fallback to service-based transport (e.g., 'gmail')
  return nodemailer.createTransport({
    service: service || 'gmail',
    auth: {
      user,
      pass
    }
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

// Send password reset email with verification code
const sendPasswordResetEmail = async (email, code, name) => {
  const subject = 'Password Reset Verification Code - Paxify';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Please use the following verification code to complete the process:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${code}
      </div>
      <p>This code will expire in 30 minutes.</p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        This is an automated email from Paxify. Please do not reply to this email.
      </p>
    </div>
  `;
  
  const textContent = `
    Password Reset Verification Code

    Hi ${name},

    We received a request to reset your password. Please use the following verification code to complete the process:

    ${code}

    This code will expire in 30 minutes.

    If you did not request a password reset, please ignore this email or contact support if you have concerns.
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

const sendPasswordChangeEmail = async (email, name) => {
  const subject = 'Password Changed - Paxify';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Changed</h2>
      <p>Hi ${name},</p>
      <p>Your password was successfully changed. If you did not make this change, please contact support immediately.</p>
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">This is a security notification from Paxify.</p>
    </div>
  `;
  
  const textContent = `
    Password Changed

    Hi ${name},
    
    Your password was successfully changed. If you did not make this change, please contact support immediately.

    This is a security notification from Paxify.
  `;

  return await sendEmail(email, subject, htmlContent, textContent);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPasswordChangeEmail,
};