# 🔒 Security Documentation Overview

This directory contains the complete security documentation for the **Secure Notes Storage System** (Group 18).

## 📊 Security Status

| Category | Status | Coverage |
|----------|--------|----------|
| **Security Tests** | ✅ PASS | 48/48 tests |
| **OWASP Top 10** | ✅ COVERED | 10/10 categories |
| **Abuse Frames** | ✅ COMPLETE | 6 frames identified |
| **Security Requirements** | ✅ DEFINED | 22 requirements |

**Last Updated:** January 2025

---

## 🎯 Quick Navigation

### For Security Reviewers:
1. Start with [Security Testing Report](security/security_testing_report.md) for validation results
2. Review [OWASP Mapping](security/owasp_mapping.md) for compliance
3. Check [Traceability Matrix](security/traceability_matrix.md) for requirement coverage

### For Developers:
1. Read [Threat Model](security/threat_model.md) to understand attack scenarios
2. Review [Security Requirements](security/security_requirements.md) for implementation constraints
3. Consult [Security Testing Plan](security/security_testing_plan.md) before adding features

### For Project Stakeholders:
1. Start with [Architecture Overview](architecture/architecture_overview.md)
2. Review [Risk Matrix](security/risk_matrix.md) for prioritization
3. Check [Security Testing Report](security/security_testing_report.md) for validation

---

## 📁 Document Structure

### 🔍 Analysis (Pre-Implementation)

- **[Architecture Overview](architecture/architecture_overview.md)**  
  System design and component interaction

- **[Threat Model](security/threat_model.md)**  
  STRIDE-based threat identification

- **[Abuse Frames Analysis](abuse-frames/abuse_frames_analysis_v1.md)**  
  Systematic attacker-centric analysis (6 abuse cases)

- **[Risk Matrix](security/risk_matrix.md)**  
  Risk assessment and prioritization

---

### 📜 Security Requirements

- **[Security Requirements Specification](security/security_requirements.md)**  
  22 derived security requirements

- **[Security Traceability Matrix](security/traceability_matrix.md)**  
  Linking threats → requirements → tests

---

### 🧪 Security Verification & Compliance

- **[Security Testing Plan](security/security_testing_plan.md)**  
  Systematic verification strategy

- **[Security Testing Report](security/security_testing_report.md)**  
  **✅ 48/48 tests passed** - Validation results

- **[OWASP Top 10 Mapping](security/owasp_mapping.md)**  
  Industry standard alignment

- **[ASVS Checklist](security/security_checklist_asvs.md)**  
  OWASP Application Security Verification Standard (Level 2)

---

## 🧠 Methodology

The security analysis follows a **threat-driven and requirements-based approach**:

1. **Threat Identification:** STRIDE model
2. **Attacker Modeling:** Abuse Frames (6 anti-requirements)
3. **Requirements Derivation:** 22 security requirements
4. **Traceability:** Complete mapping (threats → requirements → tests)
5. **Verification:** 48 automated security tests
6. **Compliance:** OWASP Top 10 + ASVS Level 2

This methodology ensures:
- ✅ Security by design (not as an afterthought)
- ✅ Systematic coverage of threats
- ✅ Auditable traceability
- ✅ Industry-standard compliance

---

## 📖 Recommended Reading Order

### First-Time Readers:
1. [Architecture Overview](architecture/architecture_overview.md) - Understand the system
2. [Threat Model](security/threat_model.md) - Learn the attack surface
3. [Abuse Frames Analysis](abuse-frames/abuse_frames_analysis_v1.md) - See attacker perspectives
4. [Security Requirements](security/security_requirements.md) - Understand defenses
5. [Security Testing Report](security/security_testing_report.md) - See validation results

### Security Auditors:
1. [Security Testing Report](security/security_testing_report.md) - Validation evidence
2. [Traceability Matrix](security/traceability_matrix.md) - Coverage verification
3. [OWASP Mapping](security/owasp_mapping.md) - Standard compliance
4. [ASVS Checklist](security/security_checklist_asvs.md) - Detailed checks

---

## 🔑 Key Security Features

| Feature | Implementation | Verification |
|---------|---------------|--------------|
| **Encryption at Rest** | AES-256-GCM | ✅ T-03 |
| **Encryption in Transit** | HTTPS/TLS | ✅ T-10 |
| **Authentication** | JWT + bcrypt | ✅ T-01, T-08, T-09 |
| **Authorization** | Per-note ownership | ✅ T-02, T-04 |
| **Input Validation** | express-validator | ✅ T-05 |
| **Rate Limiting** | express-rate-limit | ✅ T-06 |
| **Error Handling** | Sanitized responses | ✅ T-12 |
| **Audit Logging** | Winston | ✅ Complete |

---

## ℹ️ Scope Note

- All documents are written **prior to implementation**
- Focus on **requirements-level security analysis**
- Implementation validation in [Security Testing Report](security/security_testing_report.md)
- Continuous updates as system evolves

---

## 📞 Contact

**Project:** Secure Notes Storage System  
**Group:** 18  
**Institution:** Université Côte d'Azur  
**Contacts:** 
- rajaa.tchani@etu.unice.fr
- guilaye.diop@etu.unice.fr
- imane.amraoui@etu.unice.fr
- mouad.ait-mouloud@etu.unice.fr

---

## 📚 Related Documents

- **[Main README](../README.md)** - Project overview
- **[Setup Guide](../SETUP.md)** - Installation instructions
- **[API Documentation](../backend/serverA/src/config/swagger.config.js)** - Swagger/OpenAPI spec