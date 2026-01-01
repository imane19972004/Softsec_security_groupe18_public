# Security Tools & Security Watch
## Secure Distributed Notes Storage System

### Version
v1.0

---

## 1. Introduction

This document presents the **security tools** and **security watch strategy** selected for the Secure Notes Storage System.
The objective is to demonstrate awareness of professional security practices and tools that support security verification throughout the software development lifecycle.

At this stage, tools are **identified and planned**, not yet executed.

---

## 2. Security Watch Strategy

Security watch (veille sécurité) aims to:
- Monitor common vulnerabilities affecting web applications
- Track security advisories related to used technologies
- Ensure alignment with evolving security standards

### Sources used for security watch:
- OWASP publications and guidelines
- CVE databases (NVD)
- Official documentation of frameworks and libraries
- Security advisories from package managers

---

## 3. Application Security Testing Tools

### 3.1 OWASP ZAP

**Purpose:**  
Dynamic Application Security Testing (DAST)

**Usage in the project:**  
- Automated scanning of the web application
- Detection of common vulnerabilities (XSS, broken access control, security misconfigurations)

**Project phase:**  
- After implementation
- During security testing and validation

---

### 3.2 Burp Suite

**Purpose:**  
Manual security testing and traffic inspection

**Usage in the project:**  
- Manual testing of authentication and authorization
- Manipulation of HTTP requests
- Verification of abuse scenarios identified in Abuse Frames

**Project phase:**  
- After core functionality implementation
- During penetration testing phase

---

### 3.3 SQLMap

**Purpose:**  
Automated detection of SQL injection vulnerabilities

**Usage in the project:**  
- Validation that input validation mechanisms prevent injection attacks

**Project phase:**  
- After implementation (if applicable)

**Note:**  
Although the system uses file-based storage, SQLMap remains relevant as a reference tool for injection testing methodology.

---

## 4. Dependency and Configuration Analysis Tools

### 4.1 npm audit

**Purpose:**  
Detection of known vulnerabilities in third-party dependencies

**Usage in the project:**  
- Identify vulnerable Node.js packages
- Detect outdated or insecure dependencies

**Project phase:**  
- During development
- Before deployment

---

### 4.2 ESLint (Security Rules)

**Purpose:**  
Static analysis of JavaScript code

**Usage in the project:**  
- Detection of insecure coding patterns
- Enforcing secure coding practices

**Project phase:**  
- During development
- Integrated in development workflow

---

## 5. CI/CD and Automation Tools (Planned)

### 5.1 Automated Testing Pipelines

**Purpose:**  
- Ensure security checks are repeatable
- Prevent regression vulnerabilities

**Usage in the project:**  
- Run automated tests on each commit
- Enforce security checks before merging code

**Project phase:**  
- After test implementation

---

## 6. CVE Monitoring

### Strategy:
- Monitor Common Vulnerabilities and Exposures (CVE) related to:
  - Node.js
  - Express.js
  - Authentication libraries
  - Cryptographic libraries

### Sources:
- NVD (National Vulnerability Database)
- GitHub Security Advisories

CVE analysis will be performed once dependencies are selected and frozen.

---

## 7. Relationship with Other Security Documents

- Abuse Frames Analysis defines attack scenarios
- Security Requirements specify expected protections
- Security Testing Plan defines verification activities
- This document identifies the **tools supporting those activities**

---

## 8. Conclusion

This document demonstrates a structured and proactive approach to security tooling and monitoring.
By identifying relevant tools and defining their usage phases, the project ensures that security verification is supported throughout the development lifecycle.
