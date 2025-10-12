const supabase = require("../database/dbconfig");
const bcrypt = require("bcrypt");

// login with matric no
const loginStudent = async (req, res) => {
  try {
    let { matric_number, password } = req.body;

    // Trim & normalize inputs
    matric_number = matric_number?.trim().toLowerCase();
    password = password?.trim();

    if (!matric_number || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Matric number and password are required" });
    }

    // Find the student by matric_number
    const { data: student, error } = await supabase
      .from("students")
      .select("id, full_name, email, matric_number, password_hash")
      .eq("matric_number", matric_number)
      .single();

    // Avoid revealing which part is wrong
    if (error || !student) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Optional: update last login timestamp
    await supabase
      .from("students")
      .update({ last_login: new Date().toISOString() })
      .eq("id", student.id);

    // Success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      student: {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        matric_number: student.matric_number,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", details: err.message });
  }
};

module.exports = loginStudent;
