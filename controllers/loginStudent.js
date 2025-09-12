const supabase = require("../database/dbconfig");
const bcrypt = require("bcrypt");

// login with matric no
const loginStudent = async (req, res) => {
  try {
  
    const { matric_no, password } = req.body;
  


    if (!matric_no || !password) {
      return res
        .status(400)
        .json({ message: "Matric no and password are required" });
    }

    // Find the student by matric_no
    const { data: student, error } = await supabase
      .from("students")
      .select("id, full_name, email, matric_no, password_hash")
      .eq("matric_no", matric_no.toLowerCase()) // normalize
      .single();

    if (error || !student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      message: "Login successful",
      student: {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        matric_no: student.matric_no,
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
