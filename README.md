# ProctorAI

ProctorAI is an advanced, AI-powered examination and assessment platform. It leverages biometric face registration and facial recognition to ensure academic integrity during online tests.

## Features

- **Biometric Registration:** Students register their facial geometry using their webcam to map their identity securely before taking any assessments.
- **AI-Powered Proctoring:** Built-in face detection during exams ensures the right candidate is taking the test.
- **Institutional Dashboard:** A centralized place for students to view upcoming tests, urgent tasks, institutional announcements, and their official academic transcript.
- **Real-Time Search:** Easily filter and find specific assessments directly from the dashboard.
- **Assessment Engine:** Take multiple-choice and manual-graded exams directly within the platform.
- **Automated Grading:** Get instant results and detailed breakdowns for objective questions.

## Tech Stack

- **Frontend:** React, Vite, Lucide-React (for icons), and `@vladmandic/face-api` (for face detection/recognition models).
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB.

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- MongoDB running locally or a MongoDB Atlas URI

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd examproctor
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

Create a `.env` file in the `backend` directory and add your environment variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Create a `.env` file in the `frontend` directory and add the backend API URL:
```env
VITE_API_URL=http://localhost:5000
```

### Running the Application

You'll need two terminal windows to run the frontend and backend simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
npm start
# or node server.js
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The React app will typically be available at `http://localhost:5173`.

## Face Recognition Models
The face detection requires models which are hosted locally. Ensure the `models` directory is present in your frontend `public/` directory (or wherever your static assets are served from) for the AI tracking to initialize properly.

## License
MIT
