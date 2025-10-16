const supabase = require("../../database/dbconfig");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail } = require("../../services/emailService");
const logger = require("../../utils/logger");

/**
 * Register a new student account
 */
const registerStudent = async (req, res) => {
    try {
        let { full_name, first_name, last_name, email, password, matric_number } = req.body;

        // Support either a full_name string or separate first_name and last_name fields
        if (full_name && (!first_name || !last_name)) {
            const nameParts = full_name.trim().split(' ');
            first_name = nameParts[0];
            last_name = nameParts.slice(1).join(' '); // Everything after the first name
        }

        // If only one of first_name/last_name provided, require both
        if ((first_name && !last_name) || (!first_name && last_name)) {
            return res.status(400).json({
                success: false,
                message: "Please provide both first_name and last_name"
            });
        }

        // Trim and normalize inputs
        first_name = first_name?.trim();
        last_name = last_name?.trim();
        email = email?.trim().toLowerCase();
        matric_number = matric_number?.trim().toUpperCase();

        // Check for missing required fields
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "First name, last name, email and password are required"
            });
        }

        // Check if student already exists
        const { data: existing, error: checkError } = await supabase
            .from("users")
            .select("id")
            .eq('is_admin', false)
            .eq("email", email)
            .or(matric_number ? `matric_number.eq.${matric_number}` : 'email.eq.' + email);

        if (checkError) {
            logger.error("Database check error:", { error: checkError, email, matric_number });
            return res.status(500).json({ success: false, message: "Database check failed", error: process.env.NODE_ENV === 'development' ? checkError.message : undefined });
        }

        if (existing && existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Student with this email or matric number already exists"
            });
        }

        // Hash the password
        const password_hash = await bcrypt.hash(password, 12);

        // Insert new student
        const { data, error: insertError } = await supabase
            .from("users")
            .insert([{
                first_name,
                last_name,
                email,
                matric_number,
                password_hash,
                is_admin: false,
                created_at: new Date().toISOString()
            }])
            .select('id, first_name, last_name, email, matric_number, created_at');

        if (insertError) {
            logger.error("Database insert error:", { 
                error: insertError,
                email,
                matric_number
            });
            return res.status(500).json({
                success: false,
                message: "Failed to register student",
                error: process.env.NODE_ENV === 'development' ? insertError.message : undefined
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: data[0].id,
                email: data[0].email,
                is_admin: false
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send welcome email
        try {
            await sendWelcomeEmail(email, `${first_name} ${last_name}`);
        } catch (emailError) {
            logger.error("Failed to send welcome email:", { 
                error: emailError, 
                email,
                name: `${first_name} ${last_name}`
            });
            // Continue with registration success even if email fails
        }

        res.status(201).json({
            success: true,
            message: "Student registered successfully",
            data: {
                student: data[0],
                token
            }
        });

    } catch (err) {
        logger.error("Registration error:", { 
            error: err,
            email,
            matric_number,
            stack: err.stack
        });
        res.status(500).json({
            success: false,
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

/**
 * Login a student
 */
const loginStudent = async (req, res) => {
    try {
        // Accept either: { email, password } or { matric_number, password }
        // Behavior: If both email and matric_number provided, search OR. Otherwise detect format and try that column first,
        // then fallback to the other if not found.
        let { email, matric_number, password } = req.body;

        password = password?.trim();
        email = email?.trim();
        matric_number = matric_number?.trim();

        if ((!email && !matric_number) || !password) {
            return res.status(400).json({
                success: false,
                message: "Provide an email or matric_number and a password"
            });
        }

        // Helper to fetch by email
        const fetchByEmail = async (mail) => {
            const { data, error } = await supabase
                .from('users')
                .select('id, first_name, last_name, email, matric_number, password_hash')
                .eq('email', mail.toLowerCase())
                .eq('is_admin', false)
                .single();
            return { data, error };
        };

        // Helper to fetch by matric_number
        const fetchByMatric = async (matric) => {
            const { data, error } = await supabase
                .from('users')
                .select('id, first_name, last_name, email, matric_number, password_hash')
                .eq('matric_number', matric.toUpperCase())
                .eq('is_admin', false)
                .single();
            return { data, error };
        };

        let user, error;

        if (email && matric_number) {
            // Search OR: either matches
            const { data, error: orError } = await supabase
                .from('users')
                .select('id, first_name, last_name, email, matric_number, password_hash')
                .or(`email.eq.${email.toLowerCase()},matric_number.eq.${matric_number.toUpperCase()}`)
                .eq('is_admin', false)
                .single();
            user = data;
            error = orError;
        } else if (email) {
            // If looks like an email, try email first, then matric
            if (/@/.test(email)) {
                ({ data: user, error } = await fetchByEmail(email));
                if (error || !user) {
                    ({ data: user, error } = await fetchByMatric(email));
                }
            } else {
                // email field provided but not an email -> treat as matric first
                ({ data: user, error } = await fetchByMatric(email));
                if (error || !user) {
                    ({ data: user, error } = await fetchByEmail(email));
                }
            }
        } else {
            // only matric_number provided
            ({ data: user, error } = await fetchByMatric(matric_number));
            if (error || !user) {
                ({ data: user, error } = await fetchByEmail(matric_number));
            }
        }

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Update last login
        await supabase
            .from("users")
            .update({ last_login: new Date().toISOString() })
            .eq("id", user.id);

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id,
                email: user.email,
                is_admin: false
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password_hash from response
        delete user.password_hash;

        res.json({
            success: true,
            message: "Login successful",
            data: {
                student: user,
                token
            }
        });

    } catch (err) {
        logger.error("Login error:", { 
            error: err,
            email,
            matric_number,
            stack: err.stack
        });
        res.status(500).json({
            success: false,
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

module.exports = {
    registerStudent,
    loginStudent
};