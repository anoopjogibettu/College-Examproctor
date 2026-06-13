# Project Synopsis

**Project Title:** AI-Powered Online Exam Proctoring System (ExamProctor)  
**Institution:** Mangalore Institute of Technology and Engineering (MITE)  
**Platform:** Web Application (MERN Stack)  
**Deployed At:** https://collageexamportal.vercel.app/

---

## 1. Introduction

Running a fair online exam is harder than it sounds. Students sitting at home can look up answers, switch tabs, or have someone else sit in for them — and nobody really knows. This project, built specifically for MITE, tries to fix that. It is a web platform where the entire exam lifecycle lives in one place: account creation, scheduling, taking the test, proctoring it automatically, and grading it. The system is already live and deployed online, restricted to `@mite.ac.in` email addresses only.

---

## 2. Objectives

- Build a complete, institution-locked exam platform for MITE students and faculty.
- Verify student identity before the exam starts using face biometrics stored during registration.
- Continuously monitor the student during the exam using their webcam and the `face-api.js` library running directly in their browser.
- Record the student's screen throughout the exam and capture 10-second video clips as evidence whenever a violation is detected.
- Immediately terminate and submit the exam if a serious violation occurs (tab switch, fullscreen exit, app switch, screen-share stopped).
- Give admins and moderators a full dashboard: view violation logs, play back video evidence, grade subjective answers, manage users, and publish results.
- Send automated email notifications for exam schedules, results publishing, and role changes using Nodemailer.

---

## 3. Problem Statement

Three things make online exams unreliable:

1. **Easy cheating** — switching tabs, using another device, or bringing in a helper is trivially easy when nobody is watching.
2. **No scalable monitoring** — assigning human proctors to watch each student via webcam doesn't scale and is exhausting for staff.
3. **Fragmented workflow** — most setups use one tool for the exam, another for proctoring, and yet another for grading. Nothing talks to each other.

The need was for a single platform that handles all three problems together, specifically for MITE's student population.

---

## 4. Existing System

- Exam platforms like Google Forms or external portals have no built-in proctoring.
- Human proctors monitoring webcam feeds get tired, make mistakes, and can't scale to hundreds of students.
- Browser locking usually requires separate third-party plugins students must download.
- Violation evidence (if it exists at all) is rarely connected to the student's actual exam submission.
- Grading subjective and coding answers happens completely separately from any proctoring data.

---

## 5. Proposed System

ExamProctor solves this by putting everything under one roof. Here is what actually happens in the system as it is built today:

**Registration & Identity**
- Registration is locked to `@mite.ac.in` email addresses. An OTP is sent and verified before the account is created.
- Each student registers their face once (via the `/face-setup` page). The system computes a 128-dimension face descriptor using `face-api.js` and stores it in the database.
- Every student gets a randomly generated 6-character unique ID (e.g., `KZ3WA1`) for internal tracking and admin searches.

**During the Exam (The Secure Environment)**
The exam session (`ExamSession.jsx`) is the most complex part of the system. Before a student can see a single question, the browser requires:
1. Screen sharing permission (full monitor, not just a tab)
2. Webcam permission
3. Full-screen mode is forced programmatically

Once inside, the following happen simultaneously:
- **Face Monitoring:** Every 4 seconds, `face-api.js` scans the webcam feed. It checks for: no face, multiple faces, or a face that doesn't match the registered descriptor (using Euclidean distance with a threshold of 0.6).
- **10-Second Rolling Recording:** Two separate `MediaRecorder` cycles run in parallel — one for the webcam, one for the screen. Every 10 seconds, a new clip begins. When a violation is detected, the most recent clip is captured and sent to the backend as a Base64-encoded video.
- **Fatal Violation Auto-Termination:** Tab switching (`visibilitychange`), fullscreen exit (`fullscreenchange`), app switching via Cmd+Tab (`window blur`), and the user stopping their screen share — all trigger instant exam termination. The exam is auto-submitted and the violation is logged permanently.
- **Keyboard Blocking:** Over 15 keyboard shortcuts are blocked, including Ctrl/Cmd+T, W, R, N, C, V, X, P, Cmd+Q, Cmd+M, F5, F11, Alt+F4, and all Cmd+Shift combinations.
- **Autosave:** Student answers are quietly saved to the database every 5 seconds of inactivity so that no progress is lost.
- **Live Proctor Chat:** Moderators can send real-time messages to a student's exam session using Socket.IO. The message pops up as a dismissible urgent alert in the exam UI.

**Admin & Moderator Dashboard**
- Admins can create exams with questions of three types: MCQ, Text (subjective), and Code.
- Exams can be targeted by stream (Engineering / Post Graduation), branch (CSE, MCA, etc.), and year.
- When an exam is created, all relevant students automatically get an email notification.
- Moderators can view all 200 most recent violation logs, click a log to load its video clip on demand, and send live messages to any active student.
- Exam attempts with text or code questions are marked `pending_review` and queued for manual grading. Admins assign a final score which updates the attempt to `submitted`.
- An analytics heatmap shows per-question statistics: average time spent and success rate across all students.
- Admins can search any student by UID or email and get their full profile, all attempts, and all violation logs in a single report.

**Results**
- Results are hidden until the admin explicitly publishes them. When published, every student who attempted the exam gets an email.
- Students see their score, violation count, time taken, and whether the exam is under pending review.

---

## 6. Scope of the Project

The platform is built for MITE specifically and is already deployed. It covers:
- Students in both Engineering (4-year) and Post Graduation (2-year, MCA/MBA/M.Tech) streams.
- Three question types: MCQ (auto-graded), Text (manual review), and Code (manual review).
- Three user roles: Student, Moderator, and Admin, with strict route-level access control enforced both in the frontend and backend.
- Desktop and laptop browsers with webcam (Chrome, Edge, Firefox).

It does not currently cover mobile devices or automated code execution/evaluation.

---

## 7. Methodology

The project was built in phases, focusing on getting core security and data flows right first:

- **Phase 1 — Auth & Identity:** Email OTP registration locked to institutional domain, bcrypt password hashing, JWT sessions, face encoding storage.
- **Phase 2 — Exam Engine:** Question bank creation, stream/branch/year targeting, exam scheduling, shuffled question/option delivery, autosave.
- **Phase 3 — Proctoring Core:** Face-api.js integration, dual MediaRecorder cycles, fatal violation detection, keyboard/context menu blocking, Socket.IO real-time messaging.
- **Phase 4 — Admin Tooling:** Violation log viewer with on-demand video playback, manual grading interface, analytics heatmap, student search, role management, email notifications.
- **Phase 5 — Deployment:** Frontend deployed to Vercel, backend on a Node.js server with MongoDB Atlas.

---

## 8. Tools and Technology Used

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, CSS (custom design system) |
| Backend | Node.js, Express.js v5 |
| Database | MongoDB, Mongoose |
| AI / Face Detection | `@vladmandic/face-api` (TensorFlow.js), SSD MobileNet v1, FaceLandmark68Net, FaceRecognitionNet |
| Screen & Webcam Recording | Native MediaRecorder API (WebRTC) |
| Real-time Communication | Socket.IO |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Email | Nodemailer |
| Deployment | Vercel (frontend), Node.js server (backend) |

---

## 9. System Requirement

**Hardware:**
| Component | Requirement |
|---|---|
| Student Client | Laptop/Desktop with a working webcam, stable internet (min. 2 Mbps) |
| Server | Dual-core CPU, minimum 4 GB RAM, MongoDB Atlas (cloud) |

**Software:**
| Component | Requirement |
|---|---|
| Student Browser | Google Chrome, Microsoft Edge, or Firefox (latest version) |
| Server Runtime | Node.js v18+, MongoDB |
| OS | Windows 10/11, macOS, or Linux |

---

## 10. Module Description

1. **Auth Module** (`authRoutes.js`, `Register.jsx`, `Login.jsx`, `FaceSetup.jsx`)  
   OTP-based institutional registration, bcrypt login, JWT session management, face descriptor registration, forgot/reset password via OTP.

2. **Exam Management Module** (`examRoutes.js`, `AdminDashboard.jsx`)  
   Create, target, schedule, and delete exams. Three question types. Automatic email broadcast to targeted students on creation.

3. **Exam Session Module** (`ExamSession.jsx`, `attemptRoutes.js`)  
   The secure exam UI. Dual screen+webcam recording, face verification loop, fatal violation auto-termination, keyboard blocking, autosave, timer, submit.

4. **Violation Logging Module** (`Log.js`, `attemptRoutes.js`)  
   Every event — exam started, violation recorded (with Base64 video), exam submitted/terminated — is persisted to the `Log` collection.

5. **Admin/Moderator Dashboard** (`AdminDashboard.jsx`, `ModeratorDashboard.jsx`, `adminRoutes.js`)  
   Violation log viewer, on-demand video playback, live proctor messaging, manual grading queue, analytics heatmap, student search, role management, USN assignment.

6. **Results Module** (`Results.jsx`, `examRoutes.js`)  
   Admin controls result visibility. Email sent to all students on publish. Students see score, violations, and status.

7. **Announcement Module** (`announcementRoutes.js`)  
   Admins post announcements visible to relevant student groups.

---

## 11. Expected Outcomes

- A working, deployed, and institution-locked exam platform for MITE.
- Reduction in tab switching and identity fraud through biometric face matching and browser lockdown.
- A clear, timestamped audit trail (with video evidence) for every suspicious event during an exam.
- A clean workflow for faculty to create exams, monitor live sessions, manually grade subjective answers, and publish results — all from one page.

---

## 12. Future Enhancement

- **Eye tracking** to detect students looking away at a second monitor or phone.
- **Audio analysis** to catch whispering or background conversation.
- **Automated code execution** to actually run and evaluate code answers instead of relying on manual review.
- **Mobile support** for students on tablets.
- **Detailed result analytics** for students showing question-level performance breakdowns.

---

## 13. References

1. `@vladmandic/face-api` — Browser-based face detection and recognition library built on TensorFlow.js.
2. MDN Web Docs — MediaRecorder API, Fullscreen API, Visibility API, WebRTC.
3. Socket.IO documentation — Real-time bidirectional event-based communication.
4. MongoDB Mongoose documentation — ODM for Node.js.
5. JSON Web Tokens (JWT) — RFC 7519 standard for stateless authentication.
6. Nodemailer documentation — Email delivery for Node.js.
