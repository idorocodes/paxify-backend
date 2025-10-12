const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');
const { generateToken } = require('../utils/jwt');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const logger = require('../utils/logger');
const crypto = require('crypto');

const signup = async (req, res) => {
  try {
    let { first_name, last_name, email, password, matric_number, department, level } = req.body;

    // Trim inputs
    first_name = first_name?.trim();
    last_name = last_name?.trim();
    email = email?.trim().toLowerCase();
    matric_number = matric_number?.trim().toUpperCase();
    department = department?.trim();
    level = level?.trim();

    // Check for existing user
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},matric_number.eq.${matric_number}`)
      .single();

    if (checkError) {
      logger.error('Database check error:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Error checking user existence'
      });
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or matric number already exists'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create verification token
    const verification_token = crypto.randomBytes(32).toString('hex');
    const token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert([
        {
          first_name,
          last_name,
          email,
          matric_number,
          password_hash,
          department,
          level,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (createError) {
      logger.error('User creation error:', createError);
      return res.status(500).json({
        success: false,
        message: 'Error creating user account'
      });
    }

    // Create verification token record
    await supabase
      .from('email_verification_tokens')
      .insert([
        {
          user_id: user.id,
          token: verification_token,
          expires_at: token_expires.toISOString()
        }
      ]);

    // Send welcome email with verification link
    await sendWelcomeEmail(
      user.email,
      user.first_name,
      verification_token
    );

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: user.id,
          action: 'signup',
          entity_type: 'user',
          entity_id: user.id,
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        }
      ]);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          matric_number: user.matric_number,
          is_verified: false
        }
      }
    });

  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  try {
    const { matric_number, password } = req.body;

    // Get user with password_hash
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('matric_number', matric_number.trim().toUpperCase())
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const access_token = generateToken(user);
    const refresh_token = generateToken(user, true);

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: user.id,
          action: 'login',
          entity_type: 'user',
          entity_id: user.id,
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        }
      ]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          matric_number: user.matric_number,
          department: user.department,
          level: user.level,
          is_verified: user.is_verified
        },
        access_token,
        refresh_token,
        expires_in: 3600
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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

    // We don't want to reveal if the email exists or not
    if (error || !user) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, password reset instructions will be sent'
      });
    }

    // Generate reset token
    const reset_token = crypto.randomBytes(32).toString('hex');
    const token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await supabase
      .from('password_reset_tokens')
      .insert([
        {
          user_id: user.id,
          token: reset_token,
          expires_at: token_expires.toISOString()
        }
      ]);

    // Send reset email
    await sendPasswordResetEmail(
      user.email,
      reset_token,
      user.first_name
    );

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: user.id,
          action: 'password_reset_requested',
          entity_type: 'user',
          entity_id: user.id,
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        }
      ]);

    res.json({
      success: true,
      message: 'If the email exists, password reset instructions will be sent'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    // Still return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If the email exists, password reset instructions will be sent'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    // Find valid reset token
    const { data: resetToken, error } = await supabase
      .from('password_reset_tokens')
      .select('*, users(*)')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 12);

    // Update password
    await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', resetToken.user_id);

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id);

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: resetToken.user_id,
          action: 'password_reset_completed',
          entity_type: 'user',
          entity_id: resetToken.user_id,
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        }
      ]);

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Find valid verification token
    const { data: verificationToken, error } = await supabase
      .from('email_verification_tokens')
      .select('*, users(*)')
      .eq('token', token)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user verification status
    await supabase
      .from('users')
      .update({
        is_verified: true,
        email_verified_at: new Date().toISOString()
      })
      .eq('id', verificationToken.user_id);

    // Mark token as verified
    await supabase
      .from('email_verification_tokens')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verificationToken.id);

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: verificationToken.user_id,
          action: 'email_verified',
          entity_type: 'user',
          entity_id: verificationToken.user_id,
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        }
      ]);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail
};