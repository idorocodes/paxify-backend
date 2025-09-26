const supabase = require("../database/dbconfig");
const crypto = require("crypto");

const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    email = email?.trim().toLowerCase();

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const { data: student, error } = await supabase
      .from("students")
      .select("id, email, full_name")
      .eq("email", email)
      .single();

    if (error || !student) {
      return res
        .status(200)
        .json({ 
          success: true, 
          message: "If the email exists, a reset link has been sent" 
        });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString();

    const { error: updateError } = await supabase
      .from("students")
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry
      })
      .eq("id", student.id);

    if (updateError) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate reset token" });
    }

    res.status(200).json({
      success: true,
      message: "If the email exists, a reset link has been sent",
      resetToken: resetToken
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", details: err.message });
  }
};

module.exports = forgotPassword;
