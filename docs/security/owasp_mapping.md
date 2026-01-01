# OWASP Top 10 Mapping
## Secure Distributed Notes Storage System

### Version
v1.0

---

## 1. Introduction

This document maps identified abuse frames and security requirements to the **OWASP Top 10 (2021)** categories.
The purpose is to demonstrate alignment with industry-recognised security standards.

---

## 2. OWASP Mapping Table

| OWASP Category | Description | Abuse Frames | Security Requirements |
|---------------|------------|--------------|-----------------------|
| A01: Broken Access Control | Unauthorized access to resources | AF-01, AF-02 | SR-01, SR-06, SR-14 |
| A02: Cryptographic Failures | Weak or missing encryption | AF-01 | SR-02, SR-03, SR-04 |
| A03: Injection | Malicious input exploitation | AF-02 | SR-08 |
| A05: Security Misconfiguration | Unsafe defaults | AF-01, AF-06 | SR-05, SR-21 |
| A07: Identification & Authentication Failures | Authentication bypass | AF-04 | SR-13, SR-15 |
| A09: Logging & Monitoring Failures | Insufficient logging | AF-06 | SR-20, SR-22 |
| A10: Server-Side Request Forgery | Backend abuse | AF-05 | SR-17, SR-18 |

---

## 3. Notes on OWASP Coverage

OWASP categories A04 (Insecure Design) and A06 (Vulnerable and Outdated Components) are not explicitly mapped to individual abuse frames.

- **A04 – Insecure Design** is addressed globally through the application of threat modeling, Abuse Frames analysis, and systematic derivation of security requirements at the requirements engineering stage.

- **A06 – Vulnerable and Outdated Components** is implementation-dependent and is therefore addressed during later phases through dependency analysis, vulnerability scanning, and patch management activities.

This approach ensures appropriate coverage of OWASP risks according to the system development lifecycle.


## 4. Conclusion

This mapping confirms that the identified threats and derived security requirements align with the OWASP Top 10 categories.
