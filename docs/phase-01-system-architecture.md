# PHASE 1 — SYSTEM ARCHITECTURE
## AI-Driven Criminal Intelligence Platform

---

## 1. Objective

Design the **complete logical and physical architecture** of the platform — defining every major component, data flow path, pipeline type, security posture, and deployment topology — before any code is written.

### Inputs
- Phase 0 Blueprint (system vision, requirements, exclusions, success metrics)
- Government infrastructure constraints (air-gapped or VPN-only networks, on-premise preference)
- Data source inventory (FIR, CCTV metadata, CDR, OSINT, forensic artifacts)

### Outputs
- Logical architecture diagram
- Physical deployment topology
- Data flow specification
- Trust boundary map
- Technology selection rationale

---

## 2. Logical Architecture

### High-Level Component Diagram

```mermaid
graph TB
    subgraph Ingestion["🔵 Data Ingestion Layer"]
        A1[Batch Ingestor<br/>FIR / RMS / Historical]
        A2[Stream Ingestor<br/>CCTV Metadata / Sensors]
        A3[API Gateway<br/>External Feeds / OSINT]
    end

    subgraph Storage["🟢 Data & Storage Layer"]
        B1[(Raw Data Lake<br/>Object Storage)]
        B2[(Processed Data Store<br/>Columnar / TimeSeries)]
        B3[(Graph Database<br/>Neo4j / JanusGraph)]
        B4[(Feature Store<br/>Online + Offline)]
        B5[(Audit Log Store<br/>Append-Only)]
    end

    subgraph Processing["🟠 Processing Layer"]
        C1[ETL / Data Quality<br/>Validation & Cleansing]
        C2[Feature Engineering<br/>Spatial / Temporal / Behavioral]
        C3[Stream Processor<br/>Apache Flink / Kafka Streams]
    end

    subgraph ML["🔴 ML & Analytics Layer"]
        D1[Crime Pattern<br/>Prediction Engine]
        D2[Behavioral Analysis<br/>Engine]
        D3[Network Analysis<br/>Engine]
        D4[Forensic Correlation<br/>Engine]
        D5[Real-Time Anomaly<br/>Detection Engine]
    end

    subgraph Ethics["🟣 Ethics & Governance Layer"]
        E1[Bias Detection<br/>Service]
        E2[Fairness Gate<br/>Pre/Post Inference]
        E3[Explainability<br/>Service SHAP/LIME]
        E4[Audit Logger]
    end

    subgraph Interface["🔷 Presentation Layer"]
        F1[Investigator<br/>Dashboard]
        F2[Command Center<br/>Real-Time View]
        F3[Audit & Oversight<br/>Console]
        F4[Admin & Config<br/>Portal]
    end

    subgraph Ops["⚙️ MLOps & Platform"]
        G1[Model Registry]
        G2[Experiment Tracker]
        G3[Drift Monitor]
        G4[CI/CD Pipeline]
        G5[Alerting & Paging]
    end

    A1 & A2 & A3 --> C1
    C1 --> B1
    B1 --> C2
    C2 --> B4
    A2 --> C3
    B4 --> D1 & D2 & D3 & D4
    C3 --> D5
    D1 & D2 & D3 & D4 & D5 --> E2
    E2 --> F1 & F2
    E1 -.->|monitors| D1 & D2 & D3
    E3 -.->|explains| D1 & D2 & D3 & D4
    E4 -.->|logs| D1 & D2 & D3 & D4 & D5 & F1 & F2
    B3 --> D3
    D1 & D2 & D3 --> G1
    G3 -.->|monitors| D1 & D2 & D3 & D5
    F3 --> B5
```

### Component Summary

| Component | Purpose | Technology Candidates |
|---|---|---|
| **Batch Ingestor** | Load FIR/RMS records, historical crime logs | Apache Spark, dbt, custom ETL |
| **Stream Ingestor** | Consume CCTV metadata, sensor events | Apache Kafka, Apache Pulsar |
| **API Gateway** | Authenticate & route external data feeds | Kong, AWS API Gateway, custom |
| **Raw Data Lake** | Store unprocessed data immutably | MinIO (on-prem S3), HDFS |
| **Processed Data Store** | Queryable, cleaned crime data | PostgreSQL + TimescaleDB |
| **Graph Database** | Criminal network relationships | Neo4j, JanusGraph |
| **Feature Store** | Online (low-latency) + Offline (batch) features | Feast, custom Redis + Parquet |
| **Stream Processor** | Real-time event processing | Apache Flink, Kafka Streams |
| **Crime Pattern Engine** | Hotspot prediction, time-series forecasting | Python, sklearn, Prophet, ST-ResNet |
| **Behavioral Engine** | MO clustering, sequence analysis | Python, HDBSCAN, HMM |
| **Network Engine** | Graph ML, community detection | Python, DGL/PyG, NetworkX |
| **Forensic Engine** | Cross-case matching, timeline building | Elasticsearch, custom |
| **Real-Time Anomaly** | Streaming anomaly detection | Isolation Forest (online), autoencoders |
| **Bias Detection** | Fairness metric computation | AIF360, Fairlearn |
| **Explainability** | Feature attribution | SHAP, LIME |
| **Investigator Dashboard** | Primary UI for officers | React, D3.js, Leaflet/Mapbox |
| **Model Registry** | Version & track models | MLflow |
| **Drift Monitor** | Detect data & concept drift | Evidently AI, custom |

---

## 3. Data Flow Specification

### 3.1 Batch Analytics Pipeline

```mermaid
flowchart LR
    subgraph Sources
        S1[FIR Database]
        S2[Historical Logs]
        S3[Forensic Records]
    end

    subgraph Ingestion
        I1[Batch Ingestor<br/>Scheduled: Daily]
    end

    subgraph Processing
        P1[Schema Validation]
        P2[Deduplication]
        P3[Geocoding & Normalization]
        P4[Feature Computation]
    end

    subgraph Storage
        ST1[(Data Lake)]
        ST2[(Feature Store<br/>Offline)]
    end

    subgraph ML
        M1[Model Training]
        M2[Batch Prediction]
    end

    subgraph Output
        O1[Prediction Store]
        O2[Dashboard Refresh]
    end

    S1 & S2 & S3 --> I1
    I1 --> P1 --> P2 --> P3 --> ST1
    ST1 --> P4 --> ST2
    ST2 --> M1
    ST2 --> M2 --> O1 --> O2
```

- **Cadence**: Daily for training data refresh; predictions regenerated every 6 hours
- **SLA**: End-to-end batch ≤ 30 minutes
- **Failure mode**: Stale predictions served (last successful run) + alert to ops

### 3.2 Real-Time Pipeline

```mermaid
flowchart LR
    subgraph Sources
        RS1[CCTV Metadata Stream]
        RS2[Sensor/IoT Events]
        RS3[CAD Dispatch Feed]
    end

    subgraph Streaming
        K1[Message Broker<br/>Kafka]
        F1[Stream Processor<br/>Flink]
    end

    subgraph Inference
        RT1[Real-Time Anomaly<br/>Detection]
        RT2[Event Correlation<br/>Engine]
    end

    subgraph Gates
        G1[Confidence Filter<br/>≥ 70%]
        G2[Bias Check]
    end

    subgraph Output
        A1[Priority Alert Queue]
        A2[Command Center<br/>Live Feed]
    end

    RS1 & RS2 & RS3 --> K1
    K1 --> F1
    F1 --> RT1 & RT2
    RT1 & RT2 --> G1 --> G2
    G2 -->|Pass| A1 --> A2
    G2 -->|Fail| L1[Suppress + Log]
```

- **Latency budget**: Source → Alert ≤ 5 seconds (p95)
- **Throughput**: 10,000+ events/second sustained
- **Failure mode**: Queue backpressure → alert ops; never drop events silently

### 3.3 Forensic Intelligence Pipeline

```mermaid
flowchart LR
    subgraph Trigger
        T1[Investigator Query]
        T2[New Case Filed]
    end

    subgraph Processing
        FC1[Cross-Case Similarity<br/>Search]
        FC2[Timeline<br/>Reconstruction]
        FC3[Evidence Graph<br/>Building]
    end

    subgraph Output
        FO1[Similar Cases<br/>Ranked List]
        FO2[Visual Timeline]
        FO3[Inference Trail<br/>Explainable]
    end

    T1 & T2 --> FC1 & FC2 & FC3
    FC1 --> FO1
    FC2 --> FO2
    FC3 --> FO3
```

- **Trigger**: On-demand (investigator) or event-driven (new FIR)
- **SLA**: Results within 60 seconds for investigator queries
- **No real-time constraint**: Quality > speed

---

## 4. Pipeline Separation Rationale

| Dimension | Batch | Real-Time | Forensic |
|---|---|---|---|
| **Trigger** | Scheduled (cron) | Event-driven (stream) | On-demand / event |
| **Latency** | Minutes–hours | Seconds | Seconds–minutes |
| **Data volume** | Full historical corpus | Current event window | Case-specific subset |
| **Failure tolerance** | Retry; serve stale | Alert; never drop | Retry; inform user |
| **Primary consumers** | Prediction store, dashboard | Command center, patrol | Investigators |
| **Scaling strategy** | Vertical (larger Spark jobs) | Horizontal (Flink parallelism) | Query-level (Elasticsearch) |

> [!NOTE]
> The three pipelines share a **common feature store** and **common ethics layer** to ensure consistency. A prediction made in batch uses the same fairness gates as a real-time alert.

---

## 5. Zero-Trust Security Posture

### Principles

1. **Never trust, always verify** — every request authenticated and authorized regardless of network location
2. **Least privilege** — every service, user, and process gets minimum necessary permissions
3. **Assume breach** — design as if the perimeter has already been compromised
4. **Encrypt everything** — at rest (AES-256), in transit (mTLS), in processing (secure enclaves where feasible)

### Implementation

```mermaid
graph TB
    subgraph External["External Zone"]
        EX1[Data Source APIs]
        EX2[Officer Mobile Devices]
    end

    subgraph DMZ["DMZ / Edge"]
        DM1[API Gateway<br/>Rate Limiting + Auth]
        DM2[WAF / IDS]
    end

    subgraph Internal["Internal Trust Zone"]
        subgraph App["Application Tier"]
            AP1[Microservices<br/>mTLS between all]
        end
        subgraph Data["Data Tier"]
            DA1[Encrypted Storage<br/>Column-Level Encryption]
        end
        subgraph ML_Zone["ML Tier"]
            ML1[Inference Services<br/>Isolated Network]
        end
    end

    subgraph Audit["Audit Zone (Read-Only)"]
        AU1[Immutable Audit Logs]
        AU2[Oversight Console]
    end

    EX1 --> DM1
    EX2 --> DM1
    DM1 --> DM2 --> AP1
    AP1 <-->|mTLS| DA1
    AP1 <-->|mTLS| ML1
    AP1 -->|append-only| AU1
    AU1 --> AU2
```

### Access Control Matrix

| Role | Data Lake | Feature Store | ML Models | Predictions | Audit Logs | Admin |
|---|---|---|---|---|---|---|
| Investigator | ❌ | ❌ | ❌ | 🔍 Read | ❌ | ❌ |
| Analyst | 🔍 Read | 🔍 Read | ❌ | 🔍 Read | ❌ | ❌ |
| ML Engineer | 🔍 Read | ✏️ Write | ✏️ Write | 🔍 Read | 🔍 Read | ❌ |
| Data Engineer | ✏️ Write | ✏️ Write | ❌ | ❌ | 🔍 Read | ❌ |
| Ethics Officer | 🔍 Read | 🔍 Read | 🔍 Read | 🔍 Read | 🔍 Read | ❌ |
| Security Admin | ❌ | ❌ | ❌ | ❌ | 🔍 Read | ✏️ Full |
| System Admin | ⚙️ Ops | ⚙️ Ops | ⚙️ Ops | ⚙️ Ops | 🔍 Read | ✏️ Full |

---

## 6. Physical Deployment Topology

### Primary: On-Premise Government Data Center

```mermaid
graph TB
    subgraph DC1["Primary Data Center"]
        subgraph Compute["Compute Cluster (Kubernetes)"]
            N1[Control Plane<br/>3 nodes HA]
            N2[Worker Pool: App<br/>8-16 nodes]
            N3[Worker Pool: ML<br/>4-8 GPU nodes]
            N4[Worker Pool: Stream<br/>4-8 nodes]
        end
        subgraph Storage_Hw["Storage"]
            S1[Object Storage<br/>MinIO Cluster]
            S2[PostgreSQL<br/>Primary + 2 Replicas]
            S3[Neo4j Cluster<br/>3 nodes]
            S4[Kafka Cluster<br/>5 brokers]
            S5[Redis Cluster<br/>6 nodes]
            S6[Elasticsearch<br/>5 nodes]
        end
        subgraph Network["Network"]
            FW[Firewall / WAF]
            LB[Load Balancer]
            VPN[VPN Gateway]
        end
    end

    subgraph DC2["DR Data Center"]
        DR1[Cold Standby<br/>Storage Replication]
        DR2[Minimal Compute<br/>Failover Ready]
    end

    subgraph Edge["Field / Edge"]
        E1[Officer Laptops<br/>via VPN]
        E2[Station Terminals]
    end

    Edge -->|VPN / mTLS| FW --> LB --> Compute
    Compute --> Storage_Hw
    DC1 -.->|Async Replication| DC2
```

### Resource Estimation (Pilot Scale)

| Resource | Specification | Count |
|---|---|---|
| App worker nodes | 16 vCPU, 64 GB RAM | 8 |
| ML worker nodes | 16 vCPU, 64 GB RAM, 1× A100 GPU | 4 |
| Stream worker nodes | 16 vCPU, 32 GB RAM | 4 |
| Object storage | 50 TB usable | 1 cluster |
| PostgreSQL | 32 vCPU, 128 GB RAM, 2 TB SSD | 3 (1P + 2R) |
| Kafka brokers | 8 vCPU, 32 GB RAM, 1 TB SSD | 5 |
| Neo4j | 16 vCPU, 64 GB RAM, 500 GB SSD | 3 |

---

## 7. Trust Boundaries

```mermaid
graph TB
    subgraph TB1["Trust Boundary 1: External"]
        direction LR
        EXT1[Data Sources]
        EXT2[Officer Devices]
    end

    subgraph TB2["Trust Boundary 2: Edge / DMZ"]
        direction LR
        EDGE1[API Gateway]
        EDGE2[WAF / IDS]
        EDGE3[Auth Service<br/>MFA + Token]
    end

    subgraph TB3["Trust Boundary 3: Application"]
        direction LR
        APP1[Business Logic Services]
        APP2[Feature Engineering]
    end

    subgraph TB4["Trust Boundary 4: ML / Sensitive"]
        direction LR
        ML1[Inference Services]
        ML2[Training Pipeline]
        ML3[Model Registry]
    end

    subgraph TB5["Trust Boundary 5: Data"]
        direction LR
        DATA1[Crime Data Lake]
        DATA2[PII Vault<br/>Tokenized]
    end

    subgraph TB6["Trust Boundary 6: Audit (Immutable)"]
        direction LR
        AUDIT1[Audit Logs]
        AUDIT2[Ethics Reports]
    end

    TB1 ==>|"Validate + Authenticate"| TB2
    TB2 ==>|"Authorize + Rate Limit"| TB3
    TB3 ==>|"Service Mesh mTLS"| TB4
    TB3 ==>|"Encrypted Queries"| TB5
    TB4 ==>|"Append-Only Writes"| TB6
    TB3 ==>|"Append-Only Writes"| TB6
```

### Boundary Crossing Rules

| From → To | Auth Required | Encryption | Logging | Rate Limited |
|---|---|---|---|---|
| External → DMZ | MFA + API Key | TLS 1.3 | Full | Yes |
| DMZ → Application | Service token (JWT) | mTLS | Full | Yes |
| Application → ML | Service mesh identity | mTLS | Full | No |
| Application → Data | Service mesh identity | mTLS + column encryption | Query log | No |
| Any → Audit | Write token (append-only) | mTLS | Self-logging | No |
| Audit → External | ❌ Blocked | N/A | N/A | N/A |

---

## 8. Technical Decisions & Rationale

| Decision | Choice | Rationale |
|---|---|---|
| **Container orchestration** | Kubernetes (on-prem) | Government prefers on-prem; K8s is cloud-agnostic |
| **Message broker** | Apache Kafka | Proven at scale; replayable log semantics for audit |
| **Stream processing** | Apache Flink | True stream processing (not micro-batch); low latency |
| **Primary RDBMS** | PostgreSQL + TimescaleDB | Open-source; time-series extension for crime temporal data |
| **Graph DB** | Neo4j | Mature; native graph storage; Cypher query language |
| **Object storage** | MinIO | S3-compatible; on-prem deployable |
| **ML framework** | PyTorch + scikit-learn | PyTorch for deep learning; sklearn for classical; large ecosystem |
| **Feature store** | Feast | Open-source; supports online (Redis) + offline (Parquet) |
| **Model registry** | MLflow | Industry standard; tracks experiments, models, metrics |
| **Search engine** | Elasticsearch | Forensic full-text search; timeline queries |
| **Frontend** | React + D3.js + Leaflet | Rich interactive maps and charts; large talent pool |
| **Service mesh** | Istio | mTLS, observability, traffic management on K8s |

---

## 9. Risks & Mitigations (Architecture-Specific)

| Risk | Impact | Mitigation |
|---|---|---|
| On-prem GPU availability limited | Delayed ML training | Pre-provision GPU nodes; use model distillation for smaller models |
| Kafka cluster failure | Real-time pipeline down | Multi-AZ brokers; Kafka MirrorMaker to DR site |
| Neo4j scaling limitations | Large graph queries slow | Partition by jurisdiction; cache frequent subgraphs |
| Network latency between DC and field | Slow dashboard loads | CDN-like edge caching for static assets; pre-computed predictions |
| Service mesh complexity | Ops overhead | Dedicated platform team; phased Istio rollout |

---

## 10. Phase 1 Deliverables Checklist

- [x] Logical architecture diagram (Section 2)
- [x] Technology selection with rationale (Section 8)
- [x] Data flow specification — batch, real-time, forensic (Section 3)
- [x] Pipeline separation rationale (Section 4)
- [x] Zero-trust security posture (Section 5)
- [x] Physical deployment topology (Section 6)
- [x] Trust boundary map (Section 7)
- [x] Architecture-specific risks (Section 9)
