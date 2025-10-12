# Paxify Backend API

A comprehensive RESTful API built with Node.js, Express, and Supabase for managing student authentication and account management. Features secure password handling, email services, and comprehensive API documentation.

## ⚡ Features

- **Student Authentication**
  - Register new students with full name, email, matric number, and password
  - Secure password storage using bcrypt hashing
  - Student login with email and password
  - Prevent duplicate registrations via email/matric number validation

- **Email Services**
  - Password reset emails with secure tokens
  - Optional welcome emails for new registrations
  - HTML and text email templates
  - Configurable email service providers

- **API Documentation**
  - Interactive Swagger UI documentation
  - Complete API schema definitions
  - Request/response examples
  - Available at `/api-docs` endpoint

- **Security & Validation**
  - Input validation and sanitization
  - Secure password hashing with bcrypt
  - Protected email enumeration prevention
  - Environment-based configuration

## 🛠 Technologies Used

- **Backend**: Node.js & Express.js
- **Database**: Supabase (PostgreSQL)
- **Security**: bcrypt for password hashing
- **Email**: Nodemailer with multiple provider support
- **Documentation**: Swagger UI with OpenAPI 3.0
- **Environment**: dotenv for configuration management

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

   Create a `.env` file in the project root (see `.env.example` for reference):

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database Configuration
   SUPABASE_URL=https://your-supabase-url.supabase.co
   ANON_KEY=your-supabase-anon-key
   
   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   EMAIL_FROM=Paxify <noreply@paxify.com>
   
   # Frontend URL (for email links)
   FRONTEND_URL=http://localhost:3000
   
   # Optional Features
   SEND_WELCOME_EMAIL=true
   ```

4. **Run the server**

   Development mode with auto-restart:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

5. **Access API Documentation**

   Once the server is running, visit: `http://localhost:3000/api-docs`

   Server will start on `http://localhost:3000`.

## 📧 Email Configuration

### Email Service Setup

The application uses Nodemailer for sending emails. Configure your preferred email service in the `.env` file:

#### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App-Specific password
3. Use these settings in your `.env`:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   ```

#### Other Email Providers
You can use other SMTP providers by changing the `EMAIL_SERVICE` or configuring custom SMTP settings in `services/emailService.js`.

### Email Features
- **Password Reset**: Sends secure reset links with expiring tokens
- **Welcome Emails**: Optional welcome emails for new registrations (set `SEND_WELCOME_EMAIL=true`)
- **HTML Templates**: Professional email templates with responsive design
- **Error Handling**: Graceful fallback if email service is unavailable

## 📖 API Documentation

Interactive API documentation is available at `/api-docs` when the server is running. Note: the API uses a versioned base path of `/api/v1` — most endpoints are mounted under this prefix. The documentation includes:

- Complete API reference with request/response schemas
- Interactive testing interface (Try it out will use the server base URL shown in the docs)
- Authentication requirements
- Error response examples
- Data validation rules

Key endpoints documented (all are prefixed with `/api/v1`):
- `GET /api/v1/health` - Health check
- `POST /api/v1/student/register` - Student registration
- `POST /api/v1/student/login` - Student authentication
- `POST /api/v1/auth/forgot-password` - Password reset request

## 🗂 API Endpoints

### 1. Register Student

**POST** `/registerstudent`

**Request Body**

```json
{
  "full_name": "Ademide Olamide",
  "email": "john@example.com",
  "matric_number":"csc/2200/1100"
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
    "matric_number": "CSC/2023/1095",
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

**POST** `/api/v1/student/login`

You can authenticate using either an email or a matric number. Examples below show two valid request bodies.

**Request Body (using identifier)**

```json
{
  "identifier": "john@example.com",
  "password": "securepassword123"
}
```

**Request Body (using matric_number)**

```json
{
  "matric_number": "CSC/2023/1095",
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
    "matric_number": "CSC/2023/1095"
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
  matric_number TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  reset_token TEXT,
  reset_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## � Project Structure

```
paxify-backend/
├── config/
│   └── swagger.js           # Swagger/OpenAPI configuration
├── controllers/
│   ├── loginStudent.js      # Student login logic
│   ├── registerStudent.js   # Student registration logic
│   └── forgotPassword.js    # Password reset logic
├── database/
│   └── dbconfig.js         # Supabase database configuration
├── routes/
│   └── authRoutes.js       # API route definitions with Swagger docs
├── services/
│   └── emailService.js     # Email sending functionality
├── .env.example           # Environment variables template
├── package.json           # Project dependencies
├── server.js             # Main application entry point
└── README.md            # Project documentation
```

## �🚀 Recent Additions

### ✅ Completed Features
- ✨ **Nodemailer Integration**: Professional email service with HTML templates
- 📚 **Swagger Documentation**: Interactive API docs at `/api-docs` 
- 🔐 **Enhanced Password Reset**: Email-based password recovery with secure tokens
- 📧 **Welcome Emails**: Optional onboarding emails for new students
- 🛡️ **Security Improvements**: Enhanced input validation and error handling

### 🎯 Future Improvements
- JWT-based authentication for session management
- Add `jamb_reg`, `school_name`, and split `first_name`/`last_name`
- Rate limiting & validation middleware
- Password reset frontend integration
- Multi-language email templates
- Email verification for new accounts