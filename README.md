📚 Paxify API

A RESTful API built with Node.js, Express, and Supabase to manage student registrations and logins. Supports storing student information securely, including hashed passwords, and allows login via matric number or JAMB registration number.

⚡ Features

Register new students with full details.

Secure password storage using bcrypt hashing.

Login with either matric_no or jamb_reg.

Validate and prevent duplicate registrations.

REST API with JSON responses.

🛠 Technologies Used

Node.js & Express – Backend server

Supabase – PostgreSQL database + REST interface

bcrypt – Password hashing

dotenv – Environment variable management

Postman / cURL – For API testing

🏗 Setup

Clone the repository

> git clone https://github.com/idorocodes/paxify-backend.git
cd student-api


Install dependencies

> npm install


Set up environment variables in a .env file:

SUPABASE_URL=https://your-supabase-url.supabase.co
ANON_KEY=your-supabase-anon-key
PORT=3000


Run the server

node index.js
# Or use nodemon for auto-reload
npx nodemon index.js


Server will start on http://localhost:3000.

🗂 API Endpoints
1. Register Student

POST /registerstudent

Request Body (JSON):

 ``` json
{
  "first_name": "John",
  "last_name": "Amos",
  "matric_no": "CSC/2023/1095",
  "jamb_reg": "20004556600",
  "email": "john@example.com",
  "school_name": "FUOYE",
  "password": "securepassword123"
}

```

Response (Success):
``` json

{
  "success": true,
  "message": "Student registered successfully",
  "student": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Amos",
    "matric_no": "CSC/2023/1095",
    "jamb_reg": "20004556600",
    "email": "john@example.com",
    "school_name": "FUOYE",
    "created_at": "2025-08-29T15:57:01.705"
  }
}

```
Response (Conflict if already exists):
``` json

{
  "success": false,
  "message": "Student with this email, matric number, or JAMB reg already exists"
}
```

2. Login Student

POST /loginstudent

Request Body (JSON):
``` json 
{
  "student_id": "CSC/2023/1095",
  "password": "securepassword123"
}

```
### Notes:

#### student_id can be either matric_no or jamb_reg.

Response (Success):
``` json

{
  "success": true,
  "message": "Login successful",
  "student": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Amos",
    "matric_no": "CSC/2023/1095",
    "jamb_reg": "20004556600",
    "email": "john@example.com",
    "school_name": "FUOYE"
  }
}
```

Response (Invalid credentials):
``` json

{
  "message": "Invalid credentials"
}
```

Response (Student not found):
``` json
{
  "message": "Student not found"
}
```

🔐 Security Notes

Passwords are stored as bcrypt hashes — never store raw passwords.

Make sure your .env file is never pushed to GitHub.

Use HTTPS in production for secure transmission.

📝 Database Schema (PostgreSQL / Supabase)

``` sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  matric_no TEXT UNIQUE NOT NULL,
  jamb_reg TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  school_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
🚀 Future Improvements

JWT-based authentication for session management.

Reset password functionality.

Support login by email as well.

API rate limiting and request validation.