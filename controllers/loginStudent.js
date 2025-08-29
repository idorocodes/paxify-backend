const supabase = require("../database/dbconfig");
const bcrypt = require("bcrypt");

const loginStudent = async (req, res) => {
  const { student_id, password } = req.body;

  if (!student_id || !password) {
    return res.status(400).json({ message: "Student id and password are required" });
  }

  try {
    // Find the student by matric_no OR jamb_reg
    const { data: student, error } = await supabase
      .from("students")
      .select("*")
      .or(`matric_no.eq.${student_id},jamb_reg.eq.${student_id}`)
      .single();

    if (error || !student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      success: true,
      message: "Login successful",
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        matric_no: student.matric_no,
        jamb_reg: student.jamb_reg,
        school_name: student.school_name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", details: err.message });
  }
};

module.exports = loginStudent;
