const supabase = require("../database/dbconfig");
const bcrypt = require("bcrypt");
const { sendWelcomeEmail } = require("../services/emailService");




const registerStudent = async (req, res) => {
  try {
    let { full_name, email, password, matric_no } = req.body;

    // Trim inputs
    full_name = full_name?.trim();
    email = email?.trim().toLowerCase();
    matric_no = matric_no?.trim();

    // Check for missing fields
    if (!full_name || !email || !password || !matric_no) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if student already exists 
    const { data: existing, error: checkError } = await supabase
      .from("students")
      .select("id")
      .or(`email.eq.${email},matric_no.eq.${matric_no}`);

    if (checkError) {
      console.error("Database check error:", checkError);
      return res.status(500).json({ success: false, message: "Database check failed" });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Student with this email or matric number already exists",
      });
    }

    // Hash the password
    const hashed_password = await bcrypt.hash(password, 12);

    // Insert new student
    const { data, error: insertError } = await supabase
      .from("students")
      .insert([{
        full_name,
        email,
        matric_no,
        password_hash: hashed_password,
        created_at: new Date().toISOString(),
      }])
      .select();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return res.status(500).json({ success: false, message: "Failed to register student", details: insertError.message });
    }

    // Send welcome email (optional - don't fail registration if email fails)
    if (process.env.SEND_WELCOME_EMAIL === 'true') {
      try {
        await sendWelcomeEmail(email, full_name);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Continue with registration success even if email fails
      }
    }

    // Success response
    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      student: {
        full_name: data[0].full_name,
        email: data[0].email,
        matric_no: data[0].matric_no,
      },
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ success: false, message: "Server error", details: err.message });
  }
};

module.exports = registerStudent;
