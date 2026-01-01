# Security Requirements Specification
## Secure Distributed Notes Storage System

### Version
v1.0

### Scope
Derived from Abuse Frames Analysis (Group 18)

---

## 1. Introduction

This document specifies the **security requirements** of the Secure Notes Storage System.  
The requirements are derived systematically from the **Abuse Frames Analysis**, ensuring that each identified threat and vulnerability is addressed at the requirements engineering level.

Security requirements are expressed as **constraints on system behaviour** intended to prevent the satisfaction of attacker anti-requirements.

---

## 2. Derivation Methodology

The security requirements in this document are derived by:
1. Identifying attacker **anti-requirements (AR)** from Abuse Frames
2. Analysing the associated **vulnerability conditions v(W)**
3. Defining **security requirements (SR)** that prevent or mitigate those vulnerabilities

Each security requirement is traceable to one or more abuse frames.

---

## 3. Security Requirements

### 3.1 Confidentiality Requirements

**SR-01**  
The system shall ensure that user notes are protected against unauthorised disclosure.

**SR-02**  
The system shall prevent unauthorised access to note content during storage.

**SR-03**  
The system shall protect note data during transmission between system components.

**SR-04**  
The system shall ensure that encryption keys are securely derived and managed.

**SR-05**  
The system shall ensure that API responses do not expose sensitive note content to unauthorised users.

---

### 3.2 Integrity Requirements

**SR-06**  
The system shall ensure that only authorised users can modify their own notes.

**SR-07**  
The system shall prevent unauthorised modification or corruption of stored notes.

**SR-08**  
The system shall validate and sanitise all user inputs before processing or storage.

**SR-09**  
The system shall detect unauthorised or unexpected changes to stored note data.

---

### 3.3 Availability Requirements

**SR-10**  
The system shall protect services against denial-of-access attacks.

**SR-11**  
The system shall ensure continued availability of user notes in case of server failure.

**SR-12**  
The system shall restrict destructive operations to authorised users only.

---

### 3.4 Authentication and Authorization Requirements

**SR-13**  
The system shall authenticate users before granting access to protected resources.

**SR-14**  
The system shall enforce strict authorisation checks on all note access operations.

**SR-15**  
The system shall limit repeated authentication attempts to prevent brute-force attacks.

**SR-16**  
The system shall ensure that authentication credentials are stored securely.

---

### 3.5 Replication Security Requirements

**SR-17**  
The system shall ensure that replication between servers is authenticated.

**SR-18**  
The system shall protect the confidentiality of data exchanged during replication.

**SR-19**  
The system shall verify the integrity of replicated data before acceptance.

---

### 3.6 Logging and Error Handling Requirements

**SR-20**  
The system shall prevent sensitive data from being exposed through logs.

**SR-21**  
The system shall ensure that error messages do not reveal internal system details.

**SR-22**  
The system shall restrict access to log files to authorised entities only.

---

## 4. Mapping Abuse Frames to Security Requirements

| Abuse Frame ID | Anti-Requirement Summary | Security Requirements |
|---------------|--------------------------|----------------------|
| AF-01 | Disclosure of user notes | SR-01, SR-02, SR-03, SR-04, SR-05 |
| AF-02 | Unauthorized note modification | SR-06, SR-07, SR-08, SR-09 |
| AF-03 | Denial of access to notes | SR-10, SR-11, SR-12 |
| AF-04 | Authentication bypass | SR-13, SR-14, SR-15, SR-16 |
| AF-05 | Replication abuse | SR-17, SR-18, SR-19 |
| AF-06 | Log and error disclosure | SR-20, SR-21, SR-22 |

---

## 5. Conclusion

This Security Requirements Specification ensures that all identified abuse scenarios are mitigated through explicit security constraints.  
By deriving requirements directly from abuse frames, the system’s security is treated as a **first-class concern at the requirements engineering stage**, in accordance with the Abuse Frames methodology.
