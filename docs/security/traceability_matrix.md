# Security Traceability Matrix
## Secure Distributed Notes Storage System

### Version
v1.0

### Derived from
- Abuse Frames Analysis (v1.0)
- Security Requirements Specification (v1.0)

---

## 1. Introduction

This document provides a **traceability matrix** linking:
- Identified **abuse frames**
- Corresponding **attacker anti-requirements**
- Derived **security requirements**
- Planned **security tests**

The objective is to ensure that all identified security threats are systematically addressed and verifiable.

---

## 2. Traceability Conventions

- **AF-XX** : Abuse Frame identifier  
- **AR-XX** : Anti-Requirement identifier  
- **SR-XX** : Security Requirement identifier  
- **T-XX**  : Security Test identifier (planned)

Tests are defined conceptually; implementation details are specified in the Security Testing Plan.

---

## 3. Traceability Matrix

| Abuse Frame | Anti-Requirement (AR) | Security Requirements (SR) | Planned Security Tests |
|------------|-----------------------|----------------------------|-----------------------|
| AF-01 | AR-01: Obtain another user’s note content | SR-01, SR-02, SR-03, SR-04, SR-05 | T-01, T-02, T-03 |
| AF-02 | AR-02: Modify another user’s notes | SR-06, SR-07, SR-08, SR-09 | T-04, T-05 |
| AF-03 | AR-03: Deny access to notes or services | SR-10, SR-11, SR-12 | T-06, T-07 |
| AF-04 | AR-04: Bypass authentication or impersonate a user | SR-13, SR-14, SR-15, SR-16 | T-08, T-09 |
| AF-05 | AR-05: Intercept or modify replicated data | SR-17, SR-18, SR-19 | T-10, T-11 |
| AF-06 | AR-06: Extract sensitive data from logs or errors | SR-20, SR-21, SR-22 | T-12 |

---

## 4. Security Test Mapping (Summary)

| Test ID | Test Objective |
|-------|----------------|
| T-01 | Attempt unauthorised note access |
| T-02 | Inspect stored notes for plaintext content |
| T-03 | Intercept replication traffic |
| T-04 | Attempt unauthorised note modification |
| T-05 | Inject malformed or malicious input |
| T-06 | Flood API endpoints |
| T-07 | Attempt unauthorised delete operations |
| T-08 | Authenticate with invalid credentials |
| T-09 | Reuse expired or forged tokens |
| T-10 | Inject data into replication channel |
| T-11 | Modify replicated data integrity |
| T-12 | Inspect logs and error responses for leaks |

---

## 5. Notes on Completeness

- Every **abuse frame** is mapped to at least one **security requirement**
- Every **security requirement** is covered by one or more **planned tests**
- No security requirement exists without an originating threat

This ensures full bidirectional traceability between threats, requirements, and verification activities.

---

## 6. Conclusion

This traceability matrix demonstrates that the security of the Secure Notes Storage System is:
- **Threat-driven**
- **Requirements-based**
- **Testable**

The matrix provides a clear and auditable link between attacker goals and system security controls, in alignment with the Abuse Frames methodology.
