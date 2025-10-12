const supabase = require("../../database/dbconfig");
const bcrypt = require("bcrypt");
const { sendPasswordChangeEmail } = require("../../services/emailService");

/**
 * Update user's password when they're logged in
 */
const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password, confirm_password } = req.body;

        // Validate inputs
        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match"
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long"
            });
        }

        // Get current user
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("password_hash, email, first_name")
            .eq("id", userId)
            .single();

        if (userError || !user) {
            console.error("User fetch error:", userError);
            return res.status(500).json({
                success: false,
                message: "Failed to verify current password"
            });
        }

        // Verify current password
        const isValid = await bcrypt.compare(current_password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const password_hash = await bcrypt.hash(new_password, 12);

        // Update password
        const { error: updateError } = await supabase
            .from("users")
            .update({ 
                password_hash,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (updateError) {
            console.error("Password update error:", updateError);
            return res.status(500).json({
                success: false,
                message: "Failed to update password"
            });
        }

        // Send notification email
        try {
            await sendPasswordChangeEmail(user.email, user.first_name);
        } catch (emailError) {
            console.error("Failed to send password change email:", emailError);
            // Continue with success response even if email fails
        }

        res.json({
            success: true,
            message: "Password updated successfully"
        });

    } catch (err) {
        console.error("Password update error:", err);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating password"
        });
    }
};

module.exports = {
    updatePassword
};