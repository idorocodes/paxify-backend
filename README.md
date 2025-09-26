# Paxify API

A RESTful API built with Node.js, Express, and Supabase for managing student registrations and logins. Passwords are hashed with bcrypt for security.

## ⚡ Features

- Register new students with full name, email, and password
- Secure password storage using bcrypt
- Login using matric_no (case-insensitive)
- Prevent duplicate registrations via email check
- REST API with JSON responses

## 🛠 Technologies Used

- Node.js & Express – Backend server
- Supabase – PostgreSQL database + REST interface
- bcrypt – Password hashing
- dotenv – Environment variable management
- Postman / cURL – For API testing

## 🏗 Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/idorocodes/paxify-backend.git
   cd paxify-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:

   ```
   SUPABASE_URL=https://your-supabase-url.supabase.co
   ANON_KEY=your-supabase-anon-key
   PORT=3000
   ```

4. **Run the server**

   ```bash
   node index.js
   ```

   Or for auto-reload:

   ```bash
   npx nodemon index.js
   ```

   Server will start on `http://localhost:3000`.

## 🗂 API Endpoints

### 1. Register Student

**POST** `/registerstudent`

**Request Body**

```json
{
  "full_name": "Ademide Olamide",
  "email": "john@example.com",
  "matric_no":"csc/2200/1100"
  "password": "securepassword123"
}
```

**Success Response**

```json
{
  "success": true,
  "message": "Student registered successfully",
  "student": {
    "full_name": "Ademide Olamide",
    "matric_no": "CSC/2023/1095",
    "email": "john@example.com"
  }
}
```

**Conflict Response**

```json
{
  "success": false,
  "message": "Student with this email already exists"
}
```

### 2. Login Student

**POST** `/loginstudent`

**Request Body**

```json
{
  "matric_no": "CSC/2023/1095",
  "password": "securepassword123"
}
```

**Success Response**

```json
{
  "success": true,
  "message": "Login successful",
  "student": {
    "full_name": "Ademide Olamide",
    "email": "john@example.com",
    "matric_no": "CSC/2023/1095"
  }
}
```

**Invalid Credentials**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Student Not Found**

```json
{
  "success": false,
  "message": "Student not found"
}
```

### 3. Forgot Password

**POST** `/forgotpassword`

**Request Body**

```json
{
  "email": "john@example.com"
}
```

**Success Response**

```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent",
  "resetToken": "a1b2c3d4e5f6789..."
}
```

**Validation Error**

```json
{
  "success": false,
  "message": "Email is required"
}
```

## 🔐 Security Notes

- Passwords are hashed with bcrypt, never stored in plain text
- Do not commit `.env` files to GitHub
- Use HTTPS in production to protect requests

## 📝 Database Schema (Simplified for current version)

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  matric_no TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  reset_token TEXT,
  reset_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 🚀 Future Improvements

- JWT-based authentication for session management
- Add `jamb_reg`, `school_name`, and split `first_name`/`last_name`
- Complete password reset flow with email notifications
- Support login by email as well
- API rate limiting & validation middleware