# Security Testing Report – Phase 1
## Project: Secure Notes Application (Group 18)

---

## 1. Introduction

This document presents the results of the security testing activities conducted during **Phase 1 (Week 2)** of the project.  
The objective of this phase is to **validate the effectiveness of the implemented security mechanisms** through automated tests and security scans, and to provide **objective evidence** supporting the security requirements defined earlier.

This report complements the following documents:
- Threat Model
- Abuse Frames Analysis
- Security Requirements Specification
- Traceability Matrix
- Security Testing Plan

---

## 2. Scope of Testing

### 2.1 In-Scope Components
The following components were included in the security testing scope:
- Authentication and authorization mechanisms
- Secure file storage system (FileManager)
- Input validation and error handling
- API access control
- Rate limiting and request handling
- HTTPS configuration
- Dependency security

### 2.2 Out-of-Scope Components
The following components were excluded from this phase:
- Frontend user interface
- Advanced replication mechanisms
- Performance and stress testing
- Business logic unrelated to security

---

## 3. Testing Methodology

Security testing was conducted using a **defense-in-depth validation approach**, combining:

- Automated security tests (Jest & Supertest)
- Static dependency analysis
- Dynamic application security scanning
- Manual review of test results

Each test case is directly traceable to:
- An identified abuse case
- A security requirement
- A concrete implementation element

This traceability is documented in the **Traceability Matrix**.

---

## 4. Automated Security Tests

### 4.1 Tools Used
- **Jest** – unit and security test framework
- **Supertest** – API-level security testing
- **Node.js test environment**

### 4.2 Executed Test Categories

| Category | Description |
|-------|------------|
| Authentication | Access control enforcement |
| Authorization | User isolation and permission checks |
| Injection | Path traversal and malformed inputs |
| Error Handling | Absence of sensitive data leakage |
| Rate Limiting | Protection against abuse |

### 4.3 Sample Tested Scenarios

| Test ID | Description | Expected Result |
|-------|------------|----------------|
| T-01 | Access without authentication | HTTP 401 |
| T-02 | Access to another user's note | HTTP 403 |
| T-05 | Path traversal attempt | HTTP 400 |
| T-06 | Excessive requests | HTTP 429 |
| T-12 | Internal error exposure | Generic error only |

All automated tests executed successfully and behaved as expected.

---

## 5. Dependency Security Analysis

### 5.1 npm Audit

A dependency vulnerability scan was performed using `npm audit`.

- **Command executed**:
  ```bash
  npm audit --production
