# BHOOMI SANKET

### Predictive Analytics System for Early Detection of Land Acquisition Delays
**Problem ID:** SIH26017  
**Team:** Bhoomi Nigrani  

---

> [!IMPORTANT]
> **DEMO MODE NOTICE:** This application runs with synthetic demonstration data to model real-world infrastructure acquisition behavior. It does not fabricate access to live government production databases or unauthorized APIs.

---

## 1. System Overview

Bhoomi Sanket is an AI-powered early warning and risk intelligence platform designed for infrastructure governance under the **Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (RFCTLARR Act 2013)**.

### Core Capabilities
- **Stage-Aware Pacing Intelligence:** Real-time velocity tracking across statutory stages (SIA, Section 11, Section 19, Award, Possession, R&R).
- **1:Many Project Architecture:** Support for infrastructure projects containing multiple acquisition rounds and packages.
- **Predict → Explain → Act Workflow:**
  - Calibrated delay probabilities ($0.0 - 1.0$) with categorized risk tiers.
  - Explainable AI via **SHAP (SHapley Additive exPlanations)** factor attribution.
  - Prioritized, rule-based operational recommendations.
- **GIS Digital Risk Map:** Spatial distribution of infrastructure projects and district-level risk aggregations with React-Leaflet.
- **Strict Anti-Leakage Firewall:** Model features strictly reflect information observable at evaluation time $T$; forward-looking delay targets avoid circular predictions.
- **Immutable Audit Trails:** Append-only logging of case updates, stage transitions, and automated ML evaluations.

---

## 2. Monorepo Repository Structure

```
bhoomi-sanket/
├── app/                  # Next.js 14 App Router (UI & BFF API Layer)
│   ├── (app)/            # Authenticated application views
│   │   ├── dashboard/    # District overview & risk register
│   │   ├── projects/     # Projects & multi-case management
│   │   ├── map/          # GIS Digital Map
│   │   ├── alerts/       # Early warning alert inbox
│   │   └── admin/        # Audit logs & ML service info
│   └── api/v1/           # REST Route Handlers
├── components/           # Reusable UI, Layout, Risk & Map components
├── lib/
│   ├── ml/               # Feature extractor, ML client, Alert evaluator
│   ├── supabase/         # Database clients
│   └── utils/            # Statutory constants & formatters
├── shared/types/         # Shared ML contract (v1) & TypeScript interfaces
├── database/
│   ├── schema.sql        # PostgreSQL 15 + PostGIS DDL & RLS policies
│   └── seeds/            # Realistic synthetic demo seed data
├── ml_service/           # FastAPI ML Inference Service (Python 3.11+)
│   ├── main.py           # FastAPI entrypoint
│   ├── schemas.py        # Pydantic schemas mirroring ML contract
│   ├── stub.py           # Neutral development stub
│   ├── predictor.py      # Artifact loader & inference runner
│   └── artifacts/        # Trained model artifacts directory
└── docs/                 # Architectural specifications & runbooks
```

---

## 3. Quickstart & Local Setup

See [docs/RUNBOOK.md](docs/RUNBOOK.md) for detailed execution instructions.
