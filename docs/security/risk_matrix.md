# Risk Matrix
## Secure Distributed Notes Storage System

### Version
v1.0

---

## 1. Introduction

This document presents a **risk assessment** of the Secure Notes Storage System based on identified threats and vulnerabilities.
Each risk is evaluated according to its **likelihood** and **impact** before mitigation.

---

## 2. Risk Rating Scale

### Likelihood
- Low
- Medium
- High

### Impact
- Low: Limited user impact
- Medium: Partial data exposure or service disruption
- High: Severe data breach or service outage

---

## 3. Risk Matrix

| Risk ID | Description | Likelihood | Impact | Risk Level | Related Abuse Frame |
|--------|-------------|------------|--------|------------|---------------------|
| R-01 | Unauthorized access to user notes | High | High | Critical | AF-01 |
| R-02 | Unauthorized note modification | Medium | High | High | AF-02 |
| R-03 | Denial of service attack | Medium | Medium | Medium | AF-03 |
| R-04 | Authentication bypass | Medium | High | High | AF-04 |
| R-05 | Replication data tampering | Low | High | Medium | AF-05 |
| R-06 | Information leakage via logs | Low | Medium | Low | AF-06 |

---

## 4. Risk Treatment Strategy

- Critical and High risks must be mitigated through mandatory security requirements.
- Medium risks are mitigated where feasible.
- Low risks are monitored.

---

## 5. Conclusion

This risk matrix supports the prioritisation of security requirements and guides the focus of security testing efforts.
