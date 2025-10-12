const supabase = require("../../database/dbconfig");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Register a new admin account (Only super admins can create other admins)
 */
const registerAdmin = async (req, res) => {
    try {
        // Check if requester is a super admin
        const requesterId = req.user.id;
        const { data: requester, error: requesterError } = await supabase
            .from("users")
            .select("is_admin, role")
            .eq("id", requesterId)
            .single();

        if (requesterError || !requester.is_admin || requester.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: "Only super admins can create new admin accounts"
            });
        }

        let { first_name, last_name, email, password, role, department, permissions } = req.body;

        // Trim inputs
        first_name = first_name?.trim();
        last_name = last_name?.trim();
        email = email?.trim().toLowerCase();
        role = role?.trim() || 'admin';

        // Check for missing fields
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required"
            });
        }

        // Check if admin already exists
        const { data: existing, error: checkError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .eq("is_admin", true);

        if (checkError) {
            console.error("Database check error:", checkError);
            return res.status(500).json({
                success: false,
                message: "Database check failed"
            });
        }

        if (existing && existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Admin with this email already exists"
            });
        }

        // Hash the password
        const password_hash = await bcrypt.hash(password, 12);

        // Insert new admin
        const { data, error: insertError } = await supabase
            .from("users")
            .insert([{
                first_name,
                last_name,
                email,
                password_hash,
                is_admin: true,
                role,
                department,
                permissions,
                created_at: new Date().toISOString()
            }])
            .select('id, first_name, last_name, email, role, department, created_at');

        if (insertError) {
            console.error("Database insert error:", insertError);
            return res.status(500).json({
                success: false,
                message: "Failed to create admin account",
                details: insertError.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Admin account created successfully",
            data: {
                admin: data[0]
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
 * Login an admin
 */
const loginAdmin = async (req, res) => {
    try {
        let { email, password } = req.body;

        // Trim inputs
        email = email?.trim().toLowerCase();
        password = password?.trim();

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find the admin
        const { data: user, error } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, password_hash, role, department, permissions")
            .eq("email", email)
            .eq("is_admin", true)
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
                is_admin: true,
                role: user.role
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
                admin: user,
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
    registerAdmin,
    loginAdmin
};