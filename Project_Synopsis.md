# Synopsis Proposal: ProctorAI - Enterprise AI-Powered Online Exam Proctoring System

## 1. Introduction
The rapid shift towards remote education has necessitated the development of secure and scalable online examination platforms. "ProctorAI" is an enterprise-grade, AI-powered online exam proctoring system designed to maintain the highest standards of academic integrity. By integrating advanced facial recognition, behavioral monitoring, and environment lockdown mechanisms, the system ensures that remote assessments are as secure and reliable as traditional in-person examinations.

## 2. Objectives
- To develop a secure online examination portal with Role-Based Access Control (RBAC) for Administrators, Moderators, and Students.
- To implement mandatory AI-driven biometric identity verification before exam authorization.
- To automate proctoring by detecting anomalies such as multiple faces, absence from the camera, and tab-switching.
- To provide a real-time Command Center for moderators to monitor active exams and dispatch warnings.
- To facilitate a seamless evaluation process supporting both automated MCQ grading and manual subjective assessment.

## 3. Problem Statement
Traditional remote examination methods heavily rely on human proctors monitoring students via video conferencing tools (e.g., Zoom, Google Meet). This approach is not scalable, is prone to human error, and suffers from a lack of reliable identity verification. Furthermore, standard browser-based exams are highly susceptible to cheating through impersonation, screen sharing, unauthorized external materials, and environment switching. There is a critical need for an automated system that enforces strict environmental locks and continuous biometric monitoring without requiring excessive human oversight.

## 4. Existing System
- **Manual Human Proctoring:** Relies on a 1:1 or 1:N human-to-student ratio, leading to high operational costs and fatigue.
- **Basic Browser Locking:** Tools that simply force fullscreen are easily bypassed using virtual machines or secondary devices.
- **Lack of Identity Persistence:** Most platforms verify identity via manual ID card checks at the start of the exam, failing to verify if the student swaps places mid-exam.
- **Fragmented Workflows:** Institutions often use disparate systems for exam creation, proctoring, and grading.

## 5. Proposed System
ProctorAI replaces fragmented and manual systems with a unified, automated solution:
- **Pre-Exam Biometric Registration:** Students map their facial geometry (`face-api.js`) which is heavily encrypted and stored. 
- **Continuous AI Proctoring:** The system actively monitors the student's webcam feed during the exam, instantly flagging unauthorized absences or the presence of secondary faces.
- **Environment Lock:** A strict lockdown mode that prevents tab switching, minimizes keyboard shortcuts, and disables context menus.
- **Algorithmic Integrity Scoring:** The system automatically computes a "Cheat Score" based on violation frequency, and captures 10-second video evidence clips of specific infractions.

## 6. Scope of the Project
The project is scoped to serve educational institutions (specifically targeting Engineering and Post-Graduation streams). It covers:
- Complete end-to-end user lifecycle management (Registration via OTP, Login, Biometric Setup).
- Exam blueprinting (MCQ, Subjective, and Coding environments).
- Real-time socket-based moderator communication.
- Comprehensive result publishing with automated SMTP email delivery.

## 7. Methodology
The project follows an **Agile Software Development Lifecycle (SDLC)**. 
1. **Requirement Analysis:** Defining institutional constraints and proctoring parameters.
2. **System Design:** Creating the ER diagrams, UI/UX wireframes, and database schemas.
3. **Implementation:** Full-stack development using the MERN stack alongside specialized Machine Learning models.
4. **Testing:** Unit testing for API routes, integration testing for biometric data flow, and load testing the WebSockets.
5. **Deployment:** Cloud hosting the database and deploying the frontend/backend servers.

## 8. Tools and Technology Used
- **Frontend Layer:** React.js, Vite, Vanilla CSS (CSS Variables/Glassmorphism), Lucide React.
- **Backend Layer:** Node.js, Express.js.
- **Database Layer:** MongoDB, Mongoose ODM.
- **Artificial Intelligence / Machine Learning:** `face-api.js` (TensorFlow.js wrapper) running entirely client-side for privacy preservation.
- **Real-Time Communication:** Socket.io (WebSockets).
- **Security & Utilities:** Bcrypt.js (Hashing), JSON Web Tokens (JWT), Nodemailer (SMTP).

## 9. System Requirement (Hardware and Software)
**Hardware Requirements:**
- **Processor:** Intel Core i3 / AMD Ryzen 3 or higher (for client-side ML processing).
- **RAM:** Minimum 4GB (8GB recommended).
- **Peripherals:** Functioning Webcam and Internet connection (minimum 2 Mbps).
- **Server:** Cloud VPS with at least 2 vCPUs and 4GB RAM.

**Software Requirements:**
- **Operating System:** Windows 10/11, macOS, or Linux.
- **Browser:** Modern browsers like Google Chrome, Mozilla Firefox, or Microsoft Edge (with camera permissions enabled).
- **Runtime Environment:** Node.js (v18+).

## 10. Module Description
1. **Authentication & Identity Module:** Manages OTP-based registration (@mite.ac.in restriction), JWT generation, password resets, and initial facial geometry mapping.
2. **Administrator Module:** Features an exam blueprint generator, user role management (elevating students to moderators), and a dedicated manual assessment grading UI.
3. **Moderator Module (Command Center):** Provides a live overview of all active exam sessions, live cheat scores, and the ability to dispatch direct warnings or forcibly terminate suspicious attempts.
4. **Student Exam Module:** Features a locked-down fullscreen HUD, a code/text editor, and a background AI process that continuously feeds frames to the facial recognition engine and records 10-second violation clips.

## 11. Expected Outcomes
- A highly secure, tamper-proof examination environment.
- Elimination of impersonation through continuous 1:1 biometric mapping.
- Drastic reduction in the manual labor required by human proctors.
- Streamlined administrative workflow from exam creation to result publication.

## 12. Future Enhancement
- **Audio Monitoring (Acoustic AI):** Implementation of microphone access to detect whispering, secondary voices, or keyboard acoustic patterns.
- **Two-Way Real-Time Communication:** A dedicated, persistent chat window allowing students to securely request technical support from moderators during an active exam.
- **Advanced Gaze Tracking:** Enhancing the AI to detect off-screen eye movements rather than just full head orientation.
- **Mobile Application:** Developing a React Native port for students to take exams on tablets or smartphones securely.

## 13. References
- MERN Stack Documentation (React.js, Node.js, MongoDB).
- TensorFlow.js and `face-api.js` official documentation.
- Socket.io Real-Time Engine guidelines.
- IEEE Papers on "Automated Proctoring Systems in E-Learning Environments".
