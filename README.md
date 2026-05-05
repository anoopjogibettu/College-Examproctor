# ProctorAI: Enterprise Online Exam Proctoring System

ProctorAI is a highly secure, AI-powered online examination platform designed for educational institutions. It enforces academic integrity through continuous biometric verification, automated anomaly detection, and a suite of anti-cheating mechanisms, all while providing a seamless experience for students, moderators, and administrators.

---

## 🎯 Core Objectives

1. **Academic Integrity:** Prevent impersonation and cheating using advanced facial recognition and behavioral tracking.
2. **Access Control:** Role-Based Access Control (RBAC) ensuring students, moderators, and administrators only access appropriate features.
3. **Scalability & Targeting:** Exams can be targeted to specific streams (Engineering, Post-Graduation), branches (CSE, MCA), or academic years.
4. **Seamless Grading:** Support for multiple-choice, subjective text, and coding questions with a dedicated manual review interface.

---

## 🚀 Key Features

### 🔐 Security & Identity Verification
- **AI Biometric Registration:** Students map their facial geometry using TensorFlow's `face-api.js`. This is a mandatory prerequisite for accessing any course material or exams.
- **Continuous Proctoring:** During an exam, the webcam actively monitors the student. It flags multiple faces, unauthorized absences, and off-screen glances.
- **Environment Lock:** Detects and flags tab-switching, window resizing, or attempts to leave the fullscreen exam environment.
- **Cheat Score Algorithm:** Dynamically calculates an integrity score based on the frequency and severity of detected violations.
- **Unique Identifiers:** Automated generation of 6-character UIDs for users and `EXM-XXXX` identifiers for exams.
- **OTP Verification:** Strict @mite.ac.in email requirement enforced via OTP for registration and password resets.

### 👨‍💻 User Roles & Workflows

**1. Students**
- Dashboard showing biometric status, upcoming/active exams, and past results.
- Exam Session HUD displaying live camera feed, connection status, question progression, and proctoring warnings.
- Clean code editor with dark mode for programming questions.

**2. Moderators**
- Live Command Center to monitor active attempts.
- Real-time visibility into student "Cheat Scores" and violation logs.
- Ability to forcibly terminate a suspicious exam attempt remotely.

**3. Administrators**
- Exam Creation Blueprint: Build exams, set duration, and target specific cohorts.
- Role Management: Elevate standard students to Moderator status using their UID.
- Manual Assessment Review: Grade subjective and coding questions through a dedicated high-contrast viewer.
- Results Publishing: One-click publishing that calculates final scores (MCQ + Manual) and sends automated SMTP email notifications to students.

---

## 💻 Technology Stack

### Frontend (Client-Side)
- **Framework:** React.js powered by Vite for rapid development and optimized builds.
- **Styling:** Custom Vanilla CSS utilizing CSS variables for consistent theming, smooth gradients, and glassmorphism.
- **AI/ML:** `face-api.js` (TensorFlow.js) running locally in the browser for privacy-preserving face detection.
- **Routing:** React Router DOM.
- **Icons:** Lucide React.

### Backend (Server-Side)
- **Runtime:** Node.js with Express.js.
- **Database:** MongoDB utilizing Mongoose ODM for structured schemas.
- **Authentication:** JSON Web Tokens (JWT) and Bcrypt.js for secure password hashing.
- **Communications:** Nodemailer for SMTP email broadcasting (OTPs, Exam Alerts, Result Publications).

---

## 📁 Project Structure

```text
Mini Project/
├── frontend/                 # React Vite Application
│   ├── src/
│   │   ├── context/          # AuthContext (State & LocalStorage Sync)
│   │   ├── pages/            # Core Views (Dashboard, Admin, ExamSession)
│   │   ├── index.css         # Global Styles & Design System Tokens
│   │   └── App.jsx           # Routing & Layout Wrapper
│   └── public/
│       └── models/           # Pre-trained TensorFlow Face-API models
│
├── backend/                  # Node/Express API
│   ├── models/               # Mongoose Schemas (User, Exam, Attempt, OTP)
│   ├── routes/               # API Endpoints (Auth, Exams, Attempts, Admin)
│   ├── middleware/           # JWT Verification & RBAC Guards
│   └── server.js             # Express entry point & DB connection
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Cluster (Atlas or Local)
- Gmail Account (for SMTP App Passwords)

### 1. Backend Configuration
Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` root with the following variables:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_string
FRONTEND_URL=http://localhost:5173

# Email SMTP Setup
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_google_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME="ProctorAI Exam Cell"
```

Start the backend server:
```bash
npm start
# or use nodemon for development:
npm run dev
```

### 2. Frontend Configuration
Navigate to the `frontend` directory and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` root:
```env
VITE_API_URL=http://localhost:5001
```

Start the Vite development server:
```bash
npm run dev
```

---

## 🛡️ Security Notes
- **Face Models:** The biometric models are loaded locally from the `frontend/public/models` directory to eliminate external API latency and ensure data privacy. Face descriptors (arrays of numbers) are sent to the server, not raw images.
- **Indexing:** The database uses `sparse: true` unique indexes to handle legacy data safely without collision errors.
- **State Sync:** The frontend `AuthContext` performs forced server-side profile verification on load to prevent cached `localStorage` states from improperly locking/unlocking biometric-restricted features.

---

## 📅 Recent Changelog
- **v1.2:** Fixed critical Vite build errors. Implemented forced profile synchronization for biometric checks. Refined Admin Dashboard UI to prevent badge clipping.
- **v1.1:** Added UID backfill scripts and collision retry logic for automated `EXM-XXXX` generation. Built the Moderator Command Center.
- **v1.0:** Initial AI implementation, OTP flows, and core CRUD operations.
