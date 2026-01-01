# Threat Model
## Secure Distributed Notes Storage System

### Version
v1.0

---

## 1. Introduction

This document presents the **threat model** of the Secure Notes Storage System.
The purpose of this threat model is to identify potential security threats affecting the system assets and to classify them according to their nature and impact.

The threat model is established **prior to implementation** and serves as an input to the Abuse Frames analysis and security requirements definition.

---

## 2. System Scope

The system under analysis includes:
- Web frontend
- Backend REST API
- Two replicated backend servers (Server A and Server B)
- File-based storage
- Network communication channels
- Authentication and authorization mechanisms

The following elements are considered **out of scope**:
- Physical security
- Social engineering attacks
- Client-side device compromise

---

## 3. Assets

The primary assets to be protected are:
- User note content
- User credentials
- Authentication tokens
- Replicated data
- System availability
- Logs and audit data

---

## 4. Threat Actors

| Actor | Description |
|-----|------------|
| External attacker | Unauthenticated attacker with network access |
| Malicious authenticated user | Legitimate user abusing privileges |
| Insider | User with elevated access (logs, servers) |
| Compromised server | One backend server under attacker control |

---

## 5. Threat Categories (STRIDE)

### 5.1 Spoofing
- Identity impersonation
- Token forgery
- Session hijacking

### 5.2 Tampering
- Modification of notes
- Alteration of replicated data
- Log manipulation

### 5.3 Repudiation
- Denial of performed actions
- Lack of traceability

### 5.4 Information Disclosure
- Unauthorized note access
- Leakage via API responses
- Leakage via logs or errors

### 5.5 Denial of Service
- API flooding
- Resource exhaustion
- Data deletion

### 5.6 Elevation of Privilege
- Unauthorized access to admin-level operations
- Bypassing ownership checks

---

## 6. Threat Summary

| Threat Category | Example Threat | Related Abuse Frame |
|----------------|---------------|---------------------|
| Spoofing | Account impersonation | AF-04 |
| Tampering | Unauthorized note modification | AF-02 |
| Information Disclosure | Note interception | AF-01 |
| Denial of Service | API flooding | AF-03 |
| Elevation of Privilege | Accessing other users' notes | AF-02 |

---

## 7. Conclusion

This threat model identifies the main threat classes affecting the Secure Notes Storage System.
The identified threats are further analysed and structured using the Abuse Frames methodology to derive security requirements.
