const supabase = require("../../database/dbconfig");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail } = require("../../services/emailService");

/**
 * Register a new student account
 */
const registerStudent = async (req, res) => {
    try {
        let { first_name, last_name, email, password, matric_number } = req.body;

        // Trim inputs
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
            console.error("Database check error:", checkError);
            return res.status(500).json({ success: false, message: "Database check failed" });
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
            console.error("Database insert error:", insertError);
            return res.status(500).json({
                success: false,
                message: "Failed to register student",
                details: insertError.message
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: data[0].id,
                is_admin: false
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send welcome email
        try {
            await sendWelcomeEmail(email, `${first_name} ${last_name}`);
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
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
        console.error("Server error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            details: err.message
        });
    }
};

/**
 * Login a student
 */
const loginStudent = async (req, res) => {
    try {
        let { matric_number, password } = req.body;

        // Trim inputs
        matric_number = matric_number?.trim().toUpperCase();
        password = password?.trim();

        if (!matric_number || !password) {
            return res.status(400).json({
                success: false,
                message: "Matric number and password are required"
            });
        }

        // Find the student
        const { data: user, error } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, matric_number, password_hash")
            .eq("matric_number", matric_number)
            .eq("is_admin", false)
            .single();

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
                user_id: user.id,
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
        console.error("Login error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            details: err.message
        });
    }
};

module.exports = {
    registerStudent,
    loginStudent
};