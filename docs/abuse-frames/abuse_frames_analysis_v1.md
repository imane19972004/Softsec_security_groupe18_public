# Abuse Frames Analysis
## Secure Distributed Notes Storage System

### Document Information
- Project: Secure Notes Storage (Group 18)
- Methodology: Abuse Frames (Requirements Engineering)
- Reference: Lin et al., *Analysing Security Threats and Vulnerabilities Using Abuse Frames*
- Version: v1.0
- Scope: Requirements-level security analysis

---

## 1. Introduction

This document presents a security threat analysis of the Secure Notes Storage System using the **Abuse Frames** methodology.  
Abuse Frames extend traditional problem frames by explicitly modelling malicious intent through **anti-requirements**, allowing early identification of security threats and vulnerabilities at the requirements engineering stage.

The objective of this document is to:
- Identify potential security threats from the attacker’s perspective
- Analyse the conditions under which these threats can be realised
- Derive security requirements to mitigate identified vulnerabilities

This analysis is performed independently of implementation details and focuses on the **problem domain**, as recommended by the Abuse Frames approach.

---

## 2. System Overview (Base Problem)

The system under analysis is a web-based application allowing multiple users to store and manage personal textual notes.

### Key characteristics:
- Web frontend accessed via browser
- Backend REST API
- Two replicated backend servers (Server A and Server B)
- File-based storage of notes
- User authentication and access control
- Note sharing with read-only or write-locked permissions

The primary assets of the system are **user notes**, which must be protected against unauthorised access, modification, and loss.

---

## 3. Abuse Frame Classes

Based on the Abuse Frames taxonomy, the following classes of security threats are considered:

- **Interception (Confidentiality)**
- **Modification (Integrity)**
- **Denial of Access (Availability)**
- **Authentication and Authorization Abuse**
- **Replication Abuse**
- **Logging and Error Disclosure Abuse**

Each abuse frame describes a threat through:
- An **anti-requirement** (attacker goal)
- The **asset under attack**
- The **attacker**
- A **malicious machine**
- An **abuse frame argument**
- Identified **vulnerability conditions**

---

## 4. Abuse Frame AF-01 — Interception of User Notes

### Abuse Frame Class
Interception (Confidentiality)

### Asset (AS)
- Content of user notes stored on backend servers
- Note data transmitted during server replication

### Attacker (AT)
- External attacker with network access
- Malicious authenticated user

### Anti-Requirement (AR)
The attacker succeeds if they can obtain the content of another user’s note, either from persistent storage or during replication, in at least one execution of the system.

### Malicious Machine (M/M)
The malicious machine represents system components or interfaces that unintentionally expose sensitive data, including:
- APIs returning decrypted note content
- Replication endpoints transmitting data without sufficient protection
- File system access paths exposing note files

### Abuse Frame Argument (ABA)
1. The attacker sends a request to retrieve a note or intercepts communication between servers.
2. The malicious machine processes the request or transmits note data.
3. Note content is stored or transmitted in a readable form.
4. The attacker observes the note content.
   
Therefore, the anti-requirement is satisfied.

### Vulnerability Conditions v(W)
The vulnerability exists if the following conditions hold:
- Notes are stored unencrypted.
- Data is transmitted without secure channels.
- Encryption keys are weak or poorly managed.
- APIs expose decrypted sensitive fields.

---

## 5. Abuse Frame AF-02 — Unauthorized Modification of Notes

### Abuse Frame Class
Modification (Integrity)

### Asset (AS)
- Integrity of user notes

### Attacker (AT)
- Malicious authenticated user
- External attacker exploiting missing controls

### Anti-Requirement (AR)
The attacker succeeds if they can modify or corrupt another user’s notes without authorization.

### Malicious Machine (M/M)
- Note update endpoints lacking ownership validation
- File system write access without integrity checks

### Abuse Frame Argument (ABA)
1. The attacker submits a crafted update request targeting another user’s note.
2. The malicious machine accepts the request without verifying ownership.
3. The note is modified or corrupted.
   
Thus, the anti-requirement is satisfied.

### Vulnerability Conditions v(W)
- Missing authentication or ownership validation.
- Overly permissive file system permissions.
- Absence of integrity verification mechanisms.
- Unsanitized user input.

---

## 6. Abuse Frame AF-03 — Denial of Access to Notes

### Abuse Frame Class
Denial of Access (Availability)

### Asset (AS)
- Availability of user notes and services

### Attacker (AT)
- External attacker
- Malicious authenticated user

### Anti-Requirement (AR)
The attacker succeeds if they can prevent legitimate users from accessing their notes or overwhelm server resources.

### Malicious Machine (M/M)
- Public endpoints without rate limiting
- Deletion operations without sufficient safeguards
- Single points of failure in storage or replication

### Abuse Frame Argument (ABA)
1. The attacker sends a large volume of requests or deletes critical data.
2. The system processes these actions without limitation.
3. Legitimate access becomes unavailable.
   
Therefore, the anti-requirement is satisfied.

### Vulnerability Conditions v(W)
- No rate limiting or flood protection.
- Lack of replication or backup mechanisms.
- Unauthorized delete operations.
- Single-server dependency.

---

## 7. Abuse Frame AF-04 — Authentication and Authorization Abuse

### Abuse Frame Class
Authentication and Authorization Abuse

### Asset (AS)
- User identities and access control mechanisms

### Attacker (AT)
- External attacker
- Malicious user attempting impersonation

### Anti-Requirement (AR)
The attacker succeeds if they can impersonate another user or bypass authentication mechanisms.

### Malicious Machine (M/M)
- Weak credential storage mechanisms
- Authentication tokens without expiration
- Login endpoints without rate limiting

### Abuse Frame Argument (ABA)
1. The attacker exploits weak authentication controls.
2. The system grants access without proper identity verification.
   
Thus, the anti-requirement is satisfied.

### Vulnerability Conditions v(W)
- Weak password storage.
- Tokens that never expire.
- No protection against brute-force attempts.

---

## 8. Abuse Frame AF-05 — Replication Abuse

### Abuse Frame Class
Interception / Modification (Replication)

### Asset (AS)
- Integrity and confidentiality of replicated note data

### Attacker (AT)
- Network attacker
- Compromised server

### Anti-Requirement (AR)
The attacker succeeds if they can inject, alter, or intercept note data during replication between servers.

### Malicious Machine (M/M)
- Replication endpoints without mutual authentication
- Missing integrity verification during synchronization

### Abuse Frame Argument (ABA)
1. The attacker intercepts or injects replication traffic.
2. The system accepts the data without verification.
   
Therefore, the anti-requirement is satisfied.

### Vulnerability Conditions v(W)
- Replication over unprotected channels.
- No mutual authentication.
- No integrity verification.

---

## 9. Abuse Frame AF-06 — Logging and Error Disclosure Abuse

### Abuse Frame Class
Information Disclosure

### Asset (AS)
- Logs and error messages

### Attacker (AT)
- External attacker
- Insider with log access

### Anti-Requirement (AR)
The attacker succeeds if they can extract sensitive data from logs or error messages.

### Malicious Machine (M/M)
- Logging mechanisms storing sensitive information
- Error handlers exposing stack traces

### Abuse Frame Argument (ABA)
1. The attacker accesses logs or error outputs.
2. Sensitive data is revealed.
   
Thus, the anti-requirement is satisfied.

### Vulnerability Conditions v(W)
- Logs contain decrypted data or tokens.
- Error messages expose internal details.
- Log storage is insufficiently protected.

---

## 10. Conclusion

This Abuse Frames analysis identifies multiple security threats affecting confidentiality, integrity, and availability of user notes.  
Each abuse frame highlights conditions under which vulnerabilities arise, enabling the systematic derivation of security requirements addressed in subsequent documentation.

This approach ensures that security is treated as a **requirements engineering concern**, rather than a post-implementation consideration.
