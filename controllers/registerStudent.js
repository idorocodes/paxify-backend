const supabase = require("../database/dbconfig");
const bcrypt = require("bcrypt");

// function to register student
const registerStudent = async (req, res) => {
  const { full_name, email, password } = req.body; // Destructure the fields from the request body.


  //checks if any of these fields is not submitted 
  if (!full_name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if student already exists by email
    const { data: existing, error: checkError } = await supabase
      .from("students")
      .select("id")
      .eq("email",email);

    if (checkError) {
      console.error("Supabase check error:", checkError);
      return res.status(500).json({success:false, message: "Database check failed" });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Student with this email or full name already exists",
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
          full_name,
          email,
          password_hash: hashed_password,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return res
        .status(400)
        .json({success:false,message: "Insert failed", details: error.message });
    }

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      student:{ full_name: data[0].full_name,
                email:data[0].email,
                matric_no:data[0].matric_no,

      }
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ success:false,message: "Server error", details: err.message });
  }
};

module.exports = registerStudent;
