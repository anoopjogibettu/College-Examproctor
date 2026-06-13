
# Synopsis Proposal

## AI-Powered Online Exam Proctoring System

**Project Title:** AI-Powered Online Exam Proctoring System (ExamProctor)
**Institution:** Mangalore Institute of Technology and Engineering (MITE)
**Department:** Computer Science and Engineering
**Academic Year:** 2025–2026
**Deployed URL:** https://collageexamportal.vercel.app/

---

## Introduction

The shift to online learning has made remote exams a common reality for students and institutions alike. But making those exams fair and trustworthy is still an unsolved problem for most colleges. When students sit at home, there is very little stopping them from opening another tab, checking their phone, or having someone else answer for them.

This project, ExamProctor, is a web-based exam platform built specifically for MITE. It combines the exam-taking interface and a live AI proctoring system into one unified application — no third-party plugins, no extra software. Students register with their institutional email, set up their face biometrics once, and every exam they take is monitored in real time using their webcam and screen share. Any suspicious activity is automatically logged with a video clip as evidence. The platform is already live and deployed, restricted entirely to `@mite.ac.in` email accounts.

---

## Objectives

- Build a complete exam management platform that covers the full cycle: student registration, exam creation, taking the test, proctoring it, grading it, and publishing results.
- Lock registration to MITE's institutional email domain and verify identity through email OTP before any account is created.
- Register each student's face biometrics at sign-up time, then verify that same face during every exam using AI running directly in the browser.
- Record the student's webcam and screen in parallel 10-second rolling clips throughout the exam. When a violation happens, the most recent clip gets sent to the backend as evidence.
- Automatically terminate and submit the exam the moment a fatal violation is detected — tab switch, fullscreen exit, app switch, or the student stopping their screen share.
- Block over 15 keyboard shortcuts that could be used to escape the exam environment.
- Give admins and moderators a single dashboard where they can watch violation logs, replay video evidence, manually grade text and code answers, run student searches, and publish results.
- Send automatic email alerts to students whenever a new exam is scheduled, when their results go live, or when their role on the platform changes.

---

## Problem Statement

Three specific problems make running a trustworthy online exam genuinely difficult.

First, cheating is too easy. A student can switch to another tab and look up answers in under two seconds. They can bring in a helper, use a second device, or simply have someone else sit in for them — and without active monitoring, there is no way to know.

Second, human proctoring does not scale. Watching 200 students over webcam at the same time requires 200 proctors, and even then, a human gets tired, loses focus, and can only watch one screen at a time. It is expensive, slow, and still unreliable.

Third, the tools are disconnected. Most institutions use one platform for the exam, another for proctoring, and something else entirely for grading. None of it talks to each other. Violation evidence — if it is captured at all — rarely makes it into the same place as the student's submission.

The result is that online exams are either unfair to honest students (easy to cheat) or unfair to all students (overly restrictive without actually being secure). There is a clear need for one platform that handles all three problems at once.

---

## Existing System

- Most existing platforms like Google Forms or basic LMS portals have no built-in proctoring at all. They rely entirely on trust.
- Solutions that do offer proctoring usually require students to download a separate lockdown browser application, which creates friction and technical issues on different operating systems.
- Human proctors watching webcam feeds can only realistically cover a small number of students and are prone to distraction and inconsistency.
- Systems that lock the browser typically cannot detect whether a second person has entered the room or whether the registered student has been swapped out.
- When violations are flagged, the evidence is usually a screenshot or a written note — not a timestamped video clip tied directly to the student's exam attempt.
- Grading subjective and coding questions happens on a completely separate interface, with no connection to the proctoring data.

---

## Proposed System

ExamProctor brings everything into one place. Here is exactly what the system does, based on how it is actually built:

**Institutional Registration**
Sign-up is hard-locked to `@mite.ac.in` email addresses. When a student submits the form, a 6-digit OTP is sent to their email and must be verified before the account is created. Each student is assigned a random 6-character unique ID (like `KZ3WA1`) that admins use to search and pull up comprehensive student reports.

**Face Biometric Enrollment**
After registration, students go through a one-time face setup. The browser uses the `face-api.js` library — running entirely client-side — to compute a 128-dimension face descriptor from the webcam feed. This descriptor is stored in the database and is used during every exam to verify identity.

**The Secure Exam Environment**
Before a student sees a single question, three things must happen: they must grant screen sharing for their entire monitor, grant webcam access, and the browser is forced into full-screen mode. The timer does not start until all three are confirmed.

Once inside the exam:

- **Face Verification Loop:** Every 4 seconds, the system scans the webcam feed using three neural network models (SSD MobileNet v1, Face Landmark 68 Net, Face Recognition Net). It checks for no face, more than one face, or a face that does not match the registered descriptor. Any mismatch beyond a Euclidean distance of 0.6 triggers a violation log.
- **Rolling Video Recording:** Two MediaRecorder instances run in the background — one on the webcam, one on the shared screen. Every 10 seconds, a new recording cycle starts. When a violation is detected, the most recent clip is captured, converted to Base64, and sent to the backend as permanent evidence.
- **Auto-Termination on Fatal Events:** Tab switching, leaving full-screen, switching to another application, or stopping the screen share all immediately trigger exam termination. The attempt is submitted on the spot and the violation is logged permanently.
- **Keyboard Lockdown:** Ctrl+T, Ctrl+W, Ctrl+R, Ctrl+N, Cmd+T, Cmd+W, Cmd+Q, Cmd+M, Cmd+Tab, F5, F11, Alt+F4, and all Cmd+Shift combinations are blocked.
- **Autosave:** Answers are quietly saved every 5 seconds of inactivity so no progress is lost if the exam is terminated.
- **Live Proctor Messaging:** Moderators can send a message directly to any student's exam session in real time via Socket.IO. It appears as a dismissible urgent alert on the student's screen.

**Admin and Moderator Dashboard**
Admins can create exams with MCQ, text, and coding question types, targeted to specific streams, branches, and year groups. On creation, all matching students automatically get an email notification. Moderators can view the 200 most recent violation logs, load video clips on demand, and message active students live. Attempts with text or code answers are held in a pending review queue until an admin assigns a score. A per-question analytics heatmap shows average time spent and success rate across all students for any exam.

**Results**
Results stay hidden until the admin publishes them. On publish, every student who submitted an attempt gets an automated email. Students see their score, violation count, time taken, and current review status.

---

## Scope of the Project

This platform is built specifically for MITE and is already live in production. It handles students in both the Engineering stream (4-year programs) and Post Graduation stream (2-year programs: MCA, MBA, M.Tech). Three question types are supported: MCQ with automatic scoring, and Text and Code answers with manual faculty review.

Three roles are enforced: Student, Moderator, and Admin, with role checks on every API route and every protected page in the frontend.

The system currently supports desktop and laptop browsers with webcam access (Chrome, Edge, Firefox). Mobile devices and automated code execution are outside the current scope.

---

## Methodology

The project was built in well-defined phases, focusing on core security flows first:

**Phase 1 — Auth and Identity**
Email OTP registration, domain restriction, bcrypt password hashing, JWT session tokens, face descriptor enrollment, password reset via OTP.

**Phase 2 — Exam Engine**
Question bank creation, stream/branch/year targeting, exam scheduling, question and option shuffling on delivery, per-answer autosave.

**Phase 3 — Proctoring Core**
Integration of face-api.js neural network models, dual rolling MediaRecorder cycle management, fatal violation auto-termination, keyboard and right-click blocking, Socket.IO real-time proctor messaging.

**Phase 4 — Admin Tooling**
Violation log viewer, on-demand video evidence playback, manual grading workflow, analytics heatmap via MongoDB aggregation pipeline, student search by UID or email, role management with email notification.

**Phase 5 — Deployment**
Frontend deployed to Vercel. Backend running on Node.js with MongoDB Atlas as the cloud database.

---

## Tools and Technology Used

| Category | Technology |
|---|---|
| Frontend Framework | React.js with Vite |
| Styling | Custom CSS design system (dark/light theme) |
| Backend Framework | Node.js with Express.js v5 |
| Database | MongoDB with Mongoose ODM |
| AI / Face Detection | @vladmandic/face-api — SSD MobileNet v1, Face Landmark 68 Net, Face Recognition Net |
| Screen and Webcam Recording | Native MediaRecorder API (WebRTC) |
| Real-time Communication | Socket.IO v4 |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Email Delivery | Nodemailer |
| Version Control | Git and GitHub |
| Deployment | Vercel (frontend), Node.js server (backend), MongoDB Atlas (database) |

---

## System Requirement (Hardware and Software)

### Hardware Requirements

| Component | Specification |
|---|---|
| Student Device | Laptop or desktop computer with a working webcam |
| Internet Speed | Minimum 2 Mbps stable connection |
| Server | Dual-core CPU, minimum 4 GB RAM |
| Database | MongoDB Atlas (cloud-hosted) |

### Software Requirements

| Component | Specification |
|---|---|
| Student Browser | Google Chrome, Microsoft Edge, or Mozilla Firefox (latest version) |
| Server Runtime | Node.js v18 or higher |
| Database | MongoDB v6 or higher (Atlas cloud) |
| Operating System (Client) | Windows 10/11, macOS, or Linux |

---

## Module Description

**Module 1 — Authentication Module**
Files: authRoutes.js, Register.jsx, Login.jsx, FaceSetup.jsx, ForgotPassword.jsx, ResetPassword.jsx

Handles OTP-based registration locked to the institutional domain, bcrypt-hashed password storage, JWT generation and validation, 128-dimension face descriptor enrollment, and OTP-based password reset.

**Module 2 — Exam Management Module**
Files: examRoutes.js, AdminDashboard.jsx

Admins create exams with a title, duration, schedule date, and a question bank of MCQ, text, or coding questions. Exams are targeted by stream, branch, and year. Students outside the target group are blocked from accessing those exams. On creation, targeted students automatically receive an email.

**Module 3 — Exam Session Module**
Files: ExamSession.jsx, attemptRoutes.js

The core exam-taking interface. Manages the screen sharing gate, webcam initialization, face-api model loading, full-screen enforcement, dual rolling MediaRecorder cycles, 4-second face monitoring loop, keyboard blocking, 5-second autosave, countdown timer, and final submission.

**Module 4 — Violation Logging Module**
Files: Log.js, attemptRoutes.js

Every significant event is written to the Log collection with a timestamp: exam started, violation recorded (with Base64 video clip), exam submitted, exam terminated. Fatal violations automatically flip the attempt status to terminated.

**Module 5 — Admin and Moderator Dashboard Module**
Files: AdminDashboard.jsx, ModeratorDashboard.jsx, adminRoutes.js

Violation log table with on-demand video playback, live proctor messaging, manual grading interface for pending review attempts, per-question analytics heatmap, full student report by UID or email, role management, and USN assignment.

**Module 6 — Results Module**
Files: Results.jsx, examRoutes.js

Results stay hidden until the admin publishes them. On publish, an automated email goes to every student who attempted the exam. Students see their score, violation count, time taken, and whether the exam is under pending review.

**Module 7 — Announcement Module**
Files: announcementRoutes.js

Admins can post announcements targeted to specific student groups, which appear on the student dashboard.

---

## Expected Outcomes

- A fully working, production-deployed exam platform restricted to MITE's institutional domain.
- A measurable reduction in tab-switching and identity fraud through real-time biometric face verification and hard browser lockdown.
- A permanent, timestamped audit trail with video evidence for every suspicious event in any exam session.
- A single workflow for faculty — create the exam, monitor live sessions, grade pending answers, and publish results — without switching between different tools.
- Students receive automatic email updates at every important stage: exam scheduled, results published, and role changed.

---

## Future Enhancement

- **Eye Tracking:** Detect when a student consistently looks away from the screen — possibly at a phone or second monitor — using gaze estimation models.
- **Audio Analysis:** Flag whispering, background conversation, or a second voice using microphone input and audio classification.
- **Automated Code Evaluation:** Run code answers against test cases in a sandboxed server environment and auto-score them instead of relying on manual review.
- **Mobile App Support:** A dedicated Android and iOS app with equivalent security constraints for students on tablets.
- **Detailed Student Performance Analytics:** Per-question breakdowns showing time spent, class average comparison, and topic suggestions.
- **Plagiarism Detection:** Compare text answers across all submissions for the same exam to identify copy-paste between students.

---

## References

1. @vladmandic/face-api — Browser-based face detection, landmark, and recognition library built on TensorFlow.js. https://github.com/vladmandic/face-api
2. MDN Web Docs — MediaRecorder API, Fullscreen API, Page Visibility API, WebRTC. https://developer.mozilla.org
3. Socket.IO Documentation — Real-time bidirectional communication between browser and server. https://socket.io/docs/
4. Mongoose Documentation — MongoDB object modeling for Node.js. https://mongoosejs.com/docs/
5. JSON Web Token (JWT) — RFC 7519 Internet Standard for compact, URL-safe, token-based authentication. https://jwt.io
6. Nodemailer — Email sending library for Node.js. https://nodemailer.com/about/
7. Vercel Documentation — Frontend deployment and hosting. https://vercel.com/docs
