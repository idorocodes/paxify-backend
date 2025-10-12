const supabase = require('../../config/supabase');
const { sendPasswordResetEmail } = require('../../services/emailService');
const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'Email address not found'
      });
    }

    // Generate 6-digit code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save verification code
    await supabase
      .from('password_reset_tokens')
      .insert([{
        user_id: user.id,
        token: verificationCode,
        expires_at: codeExpiry.toISOString()
      }]);

    // Send email with verification code
    await sendPasswordResetEmail(user.email, verificationCode, user.first_name);

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { new_password, confirm_password, code } = req.body;

    // Validate passwords match
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Find valid token
    const { data: token, error } = await supabase
      .from('password_reset_tokens')
      .select('*, users(*)')
      .eq('token', code)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 12);

    // Update password
    await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', token.user_id);

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', token.id);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password'
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword
};