# Security Policy

## Reporting Security Issues

The ProctorAI maintainers take security seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us responsibly.

Please do not report security vulnerabilities through public GitHub issues or discussions.

Instead, please report security concerns privately to:
- **Email:** security@example.com (or initiate a private GitHub Security Advisory)

When submitting a report, please include:
- A detailed description of the issue and potential impact
- Clear steps to reproduce the vulnerability or proof-of-concept (PoC) code
- Affected components, endpoints, or dependencies
- Any proposed remediations or patches

We will acknowledge receipt of your report within 48 hours and provide an estimated timeline for remediation.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | Yes                |
| < 1.0   | No                 |

---

## Data Privacy and Biometric Policy

1. **Client-Side Processing:** Facial landmark extraction and biometric descriptor computation are executed locally on the client's device using `@vladmandic/face-api`.
2. **Descriptor Vector Storage:** Only mathematical vector descriptors (128-dimensional floating point embeddings) are stored in the database for identity matching. Raw webcam video streams are never continuously saved or sent to the backend.
3. **Infraction Snapshots:** Webcam snapshots are only captured upon specific detection events (such as multiple faces or absence from camera) and are restricted to authorized proctors and administrative staff for review purposes.
4. **Credential Isolation:** Passwords must be hashed using bcrypt before database persistence. Sensitive API keys and tokens must always be provided via environment variables (`.env`) and never committed to source control.
