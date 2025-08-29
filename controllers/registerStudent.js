const supabase = require("../database/dbconfig");
const bcrypt = require("bcrypt");

const registerStudent = async (req, res) => {
  const {
    first_name,
    last_name,
    matric_no,
    jamb_reg,
    email,
    school_name,
    password,
  } = req.body;

  if (
    !first_name ||
    !last_name ||
    !matric_no ||
    !jamb_reg ||
    !email ||
    !school_name ||
    !password
  ) {
    return res.status(400).json({ message: "All fields are required"  });
  }

  try {
    // Check if student already exists by email, matric_no, or jamb_reg
    const { data: existing, error: checkError } = await supabase
      .from("students")
      .select("*")
      .or(
        `email.eq.${email},jamb_reg.eq.${jamb_reg}`
      );

    if (checkError) {
      console.error("Supabase check error:", checkError);
      return res.status(500).json({ message: "Database check failed" });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Student with this email or JAMB reg already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashed_password = await bcrypt.hash(password, saltRounds);

    // Insert new student
    const { data, error } = await supabase
      .from("students")
      .insert([
        {
          first_name,
          last_name,
          matric_no,
          jamb_reg,
          email,
          school_name,
          password_hash: hashed_password,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return res
        .status(400)
        .json({ message: "Insert failed", details: error.message });
    }

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      student: data[0],
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error", details: err.message });
  }
};

module.exports = registerStudent;
