# Security Checklist — OWASP ASVS (Level 2)
## Secure Distributed Notes Storage System

### Version
v1.0

### Reference
OWASP Application Security Verification Standard (ASVS)

### Target Level
ASVS Level 2 — Applications handling sensitive data and authenticated users

---

## 1. Introduction

This document provides a **security verification checklist** inspired by the OWASP Application Security Verification Standard (ASVS).
The checklist is adapted to the Secure Notes Storage System and is used to verify that essential security controls are present.

Each item can be marked as:
- OK (verified)
- NOT OK (missing or incomplete)
- N/A (not applicable)

---

## 2. Architecture, Design & Threat Modeling (ASVS V1)

| ID | Verification Item | Status |
|----|-------------------|--------|
| V1.1 | A documented threat model exists | OK |
| V1.2 | Security requirements are defined | OK |
| V1.3 | Abuse cases or attack scenarios are identified | OK |
| V1.4 | Security is considered at design stage | OK |

---

## 3. Authentication (ASVS V2)

| ID | Verification Item | Status |
|----|-------------------|--------|
| V2.1 | All users are uniquely identified | TBD |
| V2.2 | Authentication is required for protected resources | TBD |
| V2.3 | Passwords are stored securely | TBD |
| V2.4 | Authentication attempts are limited | TBD |
| V2.5 | Authentication tokens expire | TBD |

---

## 4. Session Management (ASVS V3)

| ID | Verification Item | Status |
|----|-------------------|--------|
| V3.1 | Sessions are securely generated | TBD |
| V3.2 | Sessions expire after inactivity | TBD |
| V3.3 | Session identifiers are protected | TBD |
| V3.4 | Session termination is supported | TBD |

---

## 5. Access Control (ASVS V4)

| ID | Verification Item | Status |
|----|-------------------|--------|
| V4.1 | Access control is enforced server-side | TBD |
| V4.2 | Users can only access their own notes | TBD |
| V4.3 | Shared notes respect defined permissions | TBD |
| V4.4 | Unauthorized access attempts are blocked | TBD |

---

## 6. Validation, Sanitization & Encoding (ASVS V5)

| ID | Verification Item | Status |
|----|-------------------|--------|
| V5.1 | All user inputs are validated server-side | TBD |
| V5.2 | Input length and type are constrained | TBD |
| V5.3 | Malicious input is rejected or sanitized | TBD |
| V5.4 | Output encoding is applied where required | TBD |

---

## 7. Cryptography & Data Protection (ASVS V6)

| ID | Verification Item | Status |
|----|-------------------|--------|
| V6.1 | Sensitive data is protected at rest | TBD |
| V6.2 | Sensitive data is protected in transit | TBD |
| V6.3 | Cryptographic keys are securely managed | TBD |
| V6.4 | Weak or obsolete cryptography is avoided | TBD |

---

## 8. Error Handling & Logging (ASVS V7)

| ID | Verification Item | Status |
|----|-------------------|--------|
| V7.1 | Errors do not expose sensitive information | TBD |
| V7.2 | Stack traces are not exposed to users | TBD |
| V7.3 | Security-relevant events are logged | TBD |
| V7.4 | Logs do not contain sensitive data | TBD |

---

## 9. Communications (ASVS V9)

| ID | Verification Item | Status |
|----|-------------------|--------|
| V9.1 | Communication channels are protected | TBD |
| V9.2 | Certificate validation is enforced | TBD |
| V9.3 | Secure protocols are used exclusively | TBD |

---

## 10. File Handling (ASVS V12)

| ID | Verification Item | Status |
|----|-------------------|--------|
| V12.1 | File access is restricted by ownership | TBD |
| V12.2 | Path traversal attacks are prevented | TBD |
| V12.3 | File permissions follow least privilege | TBD |

---

## 11. Configuration & Deployment (ASVS V14)

| ID | Verification Item | Status |
|----|-------------------|--------|
| V14.1 | Secure configuration is enforced | TBD |
| V14.2 | Default credentials are not used | TBD |
| V14.3 | Secrets are not hardcoded | TBD |
| V14.4 | Debug features are disabled in production | TBD |

---

## 12. Conclusion

This checklist provides a structured approach to verifying the security posture of the Secure Notes Storage System.
It complements the Abuse Frames analysis and Security Requirements by offering a **standardized verification baseline**.

Checklist items will be progressively marked as implementation and testing activities are completed.
