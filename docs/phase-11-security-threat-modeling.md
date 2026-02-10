# PHASE 11 — SECURITY & THREAT MODELING
## AI-Driven Criminal Intelligence Platform

---

## 1. Objective

Defend the platform against **external attacks, internal misuse, and adversarial ML threats**. This is a government system handling sensitive data — security is not a feature, it is a fundamental requirement.

### Inputs
- Zero-trust architecture (Phase 1)
- Access-control matrix (Phase 2)
- Audit logging (Phase 3)
- Model serving infrastructure (Phases 5–7, 10)

### Outputs
- Threat matrix (STRIDE-based)
- Mitigation strategies per threat class
- Red-team checklist
- Security monitoring specification

---

## 2. Threat Matrix (STRIDE Framework)

### 2.1 Spoofing

| # | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| S1 | Attacker impersonates an officer | API Gateway | Medium | Critical | MFA + device certificates + IP allowlisting |
| S2 | Compromised service account | Inter-service comms | Low | Critical | Short-lived tokens (15 min); mTLS; no shared accounts |
| S3 | Fake data source injection | Ingestion pipeline | Medium | High | Source authentication; digital signatures on data feeds |

### 2.2 Tampering

| # | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| T1 | Data poisoning — inject malicious training data | Data Lake | Medium | Critical | Data provenance tracking; anomaly detection on ingestion; human review of new sources |
| T2 | Model file tampering | Model Registry | Low | Critical | Signed model artifacts (SHA-256); integrity checks before serving |
| T3 | Audit log tampering | Audit Store | Low | Critical | WORM storage; cryptographic hash chain; separate access controls |
| T4 | Feature store corruption | Redis / Parquet | Low | High | Checksums on feature batches; consistency validation pipeline |

### 2.3 Repudiation

| # | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | Officer denies accessing sensitive data | Data access log | Medium | Medium | Non-repudiable audit logs with digital signatures |
| R2 | ML Engineer denies deploying a model | Model registry | Low | Medium | Deployment requires signed approval; audit trail |

### 2.4 Information Disclosure

| # | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| I1 | Model inversion — extract training data from model | ML inference API | Medium | Critical | Rate limiting inference API; differential privacy on training; monitor query patterns |
| I2 | PII exposure in logs/errors | Application logs | High | Critical | PII scrubbing in log pipeline; no PII in error messages; structured logging |
| I3 | Unauthorized data export | Dashboard | Medium | Critical | Watermarking on exports; two-person authorization; DLP monitoring |
| I4 | Side-channel timing attack | Inference API | Low | Medium | Constant-time responses (pad to fixed latency) |

### 2.5 Denial of Service

| # | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| D1 | Streaming pipeline overwhelmed | Kafka / Flink | Medium | High | Rate limiting at ingestion; backpressure handling; auto-scaling |
| D2 | Dashboard DDoS | Web frontend | Medium | Medium | WAF; rate limiting; CDN for static assets |
| D3 | Model inference overload | ML serving | Low | High | Request queuing; circuit breaker; auto-scaling |

### 2.6 Elevation of Privilege

| # | Threat | Target | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| E1 | Investigator accesses data outside jurisdiction | Data access layer | Medium | High | Attribute-based access control (ABAC); jurisdiction scoping |
| E2 | Insider with admin access exfiltrates data | All systems | Low | Critical | Separation of duties; privileged access management (PAM); behavioral analytics on admin actions |
| E3 | Container escape on K8s | Infrastructure | Low | Critical | Pod security policies; seccomp profiles; no root containers |

---

## 3. Adversarial ML Threats

| Threat | Description | Detection | Mitigation |
|---|---|---|---|
| **Data poisoning** | Attacker manipulates training data to skew predictions | Statistical anomaly detection on new data; data provenance checks | Multi-source validation; human review of data batches; robust training methods |
| **Evasion attacks** | Adversary modifies behavior to avoid detection | Monitor for sudden drops in detection rate | Adversarial training; ensemble models; feature diversity |
| **Model inversion** | Extract sensitive data by querying the model | Monitor for unusual query patterns (repeated, systematic) | Rate limiting; differential privacy; output perturbation |
| **Model stealing** | Replicate the model through query access | Monitor for high-volume prediction requests | Query quotas per user; watermarking model outputs |
| **Membership inference** | Determine if a specific record was in training data | Monitor for targeted queries | Differential privacy; regularization; limit output precision |

---

## 4. Red-Team Checklist

### Pre-Deployment (Mandatory before Pilot — Phase 13)

| # | Test Category | Test Description | Pass Criteria |
|---|---|---|---|
| 1 | **Authentication bypass** | Attempt to access API without valid credentials | 0 successful bypasses |
| 2 | **Privilege escalation** | Attempt to access data outside assigned role/jurisdiction | 0 unauthorized accesses |
| 3 | **SQL / NoSQL injection** | Inject malicious queries via all input fields | 0 successful injections |
| 4 | **Data exfiltration** | Attempt bulk data export through UI and API | Blocked by DLP + 2-person auth |
| 5 | **Model inversion** | Attempt to reconstruct training data via inference API | No PII recoverable |
| 6 | **Data poisoning** | Inject crafted records to shift predictions | Anomaly detection flags within 24h |
| 7 | **Audit log tampering** | Attempt to modify or delete audit records | All attempts blocked; all attempts logged |
| 8 | **Insider threat** | Simulate compromised admin account | Behavioral analytics alerts within 1h |
| 9 | **Network penetration** | External scan of all exposed surfaces | No critical or high vulnerabilities |
| 10 | **Container escape** | Attempt breakout from application container | Fails; seccomp + AppArmor blocks |
| 11 | **XSS / CSRF** | Attack dashboard web interface | CSP + CSRF tokens block all attempts |
| 12 | **API abuse** | Automated high-volume requests | Rate limiting engages; alerts fire |

### Ongoing (Quarterly)

- External penetration test by certified third party
- Internal red-team exercise simulating insider threat
- Adversarial ML assessment (evasion + poisoning)
- Social engineering test (phishing simulation for operators)

---

## 5. Security Monitoring

| Monitor | Data Source | Alert Condition | Response |
|---|---|---|---|
| Failed auth attempts | API Gateway logs | > 5 failures in 10 min per IP | Temp block + investigate |
| Unusual data access | Data access audit log | Access outside normal hours or jurisdiction | Alert + require justification |
| Model query patterns | Inference API logs | Repetitive, systematic queries (possible inversion) | Rate limit + investigate |
| Bulk export attempts | Dashboard audit log | Any bulk export request | Require 2-person auth |
| Infrastructure anomalies | K8s + OS metrics | Unexpected process, network connection, or file access | Alert + investigate |
| Audit log integrity | Hash chain verification | Any broken hash link | **P0 CRITICAL** — halt + investigate |
| Privilege escalation | RBAC audit log | Any role change or policy exception | Alert security admin |

---

## 6. Security Architecture Controls

| Layer | Control | Implementation |
|---|---|---|
| **Network** | Micro-segmentation | Kubernetes NetworkPolicies; Istio authorization policies |
| **Network** | Encryption in transit | mTLS between all services (Istio) |
| **Storage** | Encryption at rest | AES-256; KMS-managed keys |
| **Storage** | Column-level encryption | PII fields encrypted with separate key |
| **Application** | Input validation | Schema validation on all API inputs |
| **Application** | Output sanitization | No PII in API responses unless authorized |
| **Identity** | MFA | TOTP + certificate for all human users |
| **Identity** | Service mesh identity | SPIFFE/SPIRE for service-to-service |
| **Monitoring** | SIEM integration | All security events → centralized SIEM |
| **Recovery** | Backup & DR | Daily encrypted backups; DR site with < 4h RPO |

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Red-team finds critical vulnerability pre-pilot | Delays deployment | Build 2-week buffer into schedule; prioritize security fixes |
| Insider threat not detected in time | Data breach | Behavioral analytics + separation of duties + PAM |
| Sophisticated adversarial ML attack | Prediction manipulation | Ensemble models; feature diversity; adversarial training in pipeline |
| Security controls add excessive latency | SLA breach | Performance test all controls; optimize critical path |
| Compliance certification (ISO 27001, etc.) takes longer than expected | Delays handover | Start certification process during Phase 11, not Phase 14 |

---

## 8. Phase 11 Deliverables Checklist

- [x] STRIDE-based threat matrix (Section 2)
- [x] Adversarial ML threat analysis (Section 3)
- [x] Red-team checklist — pre-deployment and ongoing (Section 4)
- [x] Security monitoring specification (Section 5)
- [x] Security architecture controls (Section 6)
- [x] Phase-specific risks & mitigations (Section 7)
