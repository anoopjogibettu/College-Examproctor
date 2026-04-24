# Enterprise AI Proctoring System

A secure, dual-hardware monitoring examination platform equipped with rigorous anti-cheat mechanisms. This system utilizes a React (Vite) frontend combined with a robust Express (Node.js) & MongoDB backend.

## 🚀 Key Security Features
- **Strict Single-Device Login:** Enforces a rigid cryptographic lock on your session, instantly expiring credentials globally if a simultaneous login occurs from another device.
- **Biometric Face Validation:** Uses `face-api.js` to establish an initial identity scan, tracking the webcam dynamically every 4 seconds.
- **Dual Hardware Media Triggers:** 
  - Records continuous 10-second looping WebM buffers of both the student's **Face (Webcam feed)** and **Entire Machine Desktop (Screen Share)** natively in memory simultaneously.
  - Dynamically extracts the most relevant 10-second proof upon violation trigger (e.g. extracts Screen Share feed when the student explicitly switches tabs away from the active exam).
- **Automated Sanctions:** Auto-terminates the student's attempt immediately after 4 recorded infractions.

---

## 🛠️ Prerequisites
Ensure your local machine has the following tools installed:
- **Node.js** (v16.14.0 or exceptionally higher) 
- **NPM** (Native Package Manager included securely with Node installation)
- **MongoDB** (A valid URI string properly connected to a live Cluster or local DB environment instance)

---

## 💻 Installation

1. **Clone or Extract the Repository:**
   Ensure your entire project structure lives cohesively under `/Desktop/Mini Project/`.

2. **Initialize Backend Dependencies:**
   Navigate into the `backend/` engine directory and strictly install all required APIs:
   ```bash
   cd backend
   npm install
   ```

3. **Initialize Frontend Dependencies:**
   Navigate into the `frontend/` UI directory and safely install all required React components:
   ```bash
   cd frontend
   npm install
   ```

---

## 🔒 Environment Variable Configuration
To properly activate the server mechanisms, you must structurally define an `.env` file deep natively inside the `backend/` directory:

Create the file specifically at `backend/.env`, and insert the following securely formatted keys:
```env
# Your primary local or remote Database Address 
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/proctoring?retryWrites=true&w=majority

# Safe signing hash utilized specifically by JWT for tokens
JWT_SECRET=any_super_secure_random_text_string

# Standard local API port configuration
PORT=5001
```

---

## 🏃 Running the Application

To actively start the platform gracefully, you must launch two completely separate terminal windows (one for the Backend API, one explicitly for the Frontend Server).

### 1. Booting the Backend Server
Open your terminal natively and fire up the Node API. We recommend `nodemon` for safe automatic application reboots.
```bash
# Navigate exactly into the backend folder
cd backend

# Execute via node strictly (or optionally 'npm start' / 'nodemon server.js' if configured globally)

```
*(You will see successful terminal output explicitly reading "Server running on port 5001" followed immediately by "MongoDB connected").*

### 2. Booting the Frontend UI Interface
Open a strictly fresh 2nd terminal instance natively and launch the Vite React process:
```bash
# Return natively strictly into the frontend folder
cd frontend

# Deploy precisely the frontend Hot Reloading UI
npm run dev
```

### 3. Accessing the Platform
Click forcefully or seamlessly highlight the URL provided securely by Vite in your second terminal (typically `http://localhost:5173`) and launch it strictly locally in a supported browser (Google Chrome highly recommended for complete Screen/Media API hardware capabilities).

---

## ⚠️ Important Browser Usage Notes
- **Hardware Authorization Constraints:** Modern browsers fiercely mandate that permissions requests globally (such as explicitly requesting to share a screen or activate a webcam stream) are triggered cleanly by a native "user gesture". When starting the exam, physically clicking **"Capture & Register"** or **"Accept & Share Screen"** securely honors this logic dynamically!
- **Local Network Conflicts:** If testing securely from an external mobile device or different IP, natively ensure your Vite configuration and specific Chrome Network settings actively permit `navigator.mediaDevices` over HTTP (or deploy securely over HTTPS instead for universal access).
