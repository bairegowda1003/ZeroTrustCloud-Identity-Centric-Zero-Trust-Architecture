# ZeroTrustCloud — Implementing and Automating Identity-Centric Zero Trust Architecture for Cloud-Native Environments

> 🚧 **Status: Literature Review Phase**

This project is currently in the literature review and research phase. We are studying existing work on Zero Trust security, refining our system architecture requirements, and building out the roadmap for the ZeroTrustCloud framework.

---

## What is This Project?

**ZeroTrustCloud** is a postgraduate capstone project (PRJ-34) focused on designing and implementing an **Identity-Centric Zero Trust Architecture** for cloud-native environments.

The core idea: instead of trusting anything inside a network perimeter by default, every user, workload, and pipeline job must continuously verify its identity and be checked against policy before it can access any resource.

The project addresses five key problems in cloud security today:

- Perimeter security becoming obsolete in cloud-native setups
- Complexity of Identity and Access Management (IAM) at scale
- Enforcing security policy consistently across large systems
- Securing the CI/CD supply chain
- Maintaining visibility and compliance across the environment

---

## What We Plan to Build

- **IAM Engine** — identity-centric access management for users, services, and workloads
- **Policy-as-Code / OPA Engine** — fine-grained, automated policy enforcement using Open Policy Agent (OPA) and Rego
- **Service Mesh Security** — secure service-to-service communication (mutual TLS) across microservices
- **Continuous Verification** — ongoing, real-time trust evaluation instead of one-time authentication
- **Pipeline Security** — securing the CI/CD supply chain with provenance checks and signed artifacts
- **Observability & Compliance Engine** — continuous visibility, auditing, and compliance reporting across the architecture

---

## Current Progress

The project is progressing through an extended literature review phase. In Week 1, each team member reviewed 10 research papers (30 total) covering the core architectural components above. In Week 3, each member reviewed a further 10 papers focused on cloud-native Zero Trust security, workload identity, service-mesh security, dynamic access control, and multi-cloud security — bringing the combined total to 60 research papers reviewed across the team. These findings are being used to refine the research direction, identify research gaps, and shape the system requirements for the ZeroTrustCloud architecture, with progress tracked through TrackEdge.

---

## Team Members

- **Baire Gowda** — https://github.com/bairegowda1003
- **Sanjay** — https://github.com/sanju722002
- **Hithaishi S P** — https://github.com/HithaishiSP2004

---

## Domain

- **Domain:** Cybersecurity & Cloud-Native Security
- **Academic Program:** Postgraduate — Chanakya University, School of Engineering
- **Project Code:** PRJ-34
- **Academic Year:** 2025–2026

