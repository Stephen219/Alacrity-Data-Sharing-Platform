---
title: Requrements (functional and non functional)
---

#  Alacrity (Group 8)

**AUTHOR(S):** [Kariuki S](https://git.cardiff.ac.uk/c22067364)  
**Last Updated:** May 2nd, 2025



An updated version of the acceptance checklist can be found here:
[acceptance-v1-g-8.docx](uploads/77e5305ae33bee13442cfecb4ac25807/acceptance-v1-g-8.docx)

---

##  Table of Contents

- [Overview](#overview)
- [Functional Requirements (FR)](#functional-requirements-fr)
  - [Dataset Management and Access](#dataset-management-and-access)
  - [Data Analysis](#data-analysis)
  - [Research Workflow](#research-workflow)
  - [User Management and Collaboration](#user-management-and-collaboration)
  - [Monetisation and Premium Features](#monetisation-and-premium-features)
- [Non-Functional Requirements (NFR)](#non-functional-requirements-nfr)

---

##  Overview

**Alacrity** is a secure, no-code platform that enables organisations to upload healthcare datasets in CSV format for encrypted analysis by researchers—without the data ever leaving the platform. It supports statistical analysis, research submission workflows, secure communication, and monetisation of premium datasets.

This document outlines the core **functional** and **non-functional** requirements for the platform.

---

##  Functional Requirements (FR)

###  Dataset Management and Access

**FR1.** The system shall allow organisations to upload datasets in CSV format including a name, description, and field information (name and data type).  
**FR2.** The system shall allow organisations to assign tags to datasets for improved discoverability.  
**FR3.** The system shall allow researchers to search for datasets using keywords and tags.  
**FR4.** The system shall allow researchers to filter search results by dataset size, tags, and upload date.  
**FR5.** The system shall allow organisations to view all access requests made by researchers.  
**FR6.** The system shall allow organisations to approve or reject dataset access requests.  
**FR7.** The system shall allow researchers to access datasets only after approval from the organisation.  
**FR8.** The system shall allow users to download homomorphically encrypted datasets for secure offline analysis.

###  Data Analysis

**FR9.** The system shall allow researchers to perform descriptive statistics (mean, median, mode) on approved datasets.  
**FR10.** The system shall allow researchers to perform inferential statistical tests (t-tests, chi-square, ANOVA).  
**FR11.** The system shall allow researchers to perform correlational analysis (Pearson, Spearman).  
**FR12.** The system shall provide tools for automatic dataset filtering, cleaning, aggregation, and normalisation.

###  Research Workflow

**FR13.** The system shall allow researchers to submit research findings with a name, process description, raw results, and a summary.  
**FR14.** The system shall allow organisations to review and approve or reject submitted research.  
**FR15.** The system shall allow researchers to publish validated research outputs.  
**FR16.** The system shall allow researchers to set visibility of their published research to either public or private.  
**FR17.** The system shall allow users (researchers, organisations, unauthenticated users) to search through published research outputs.

###  User Management and Collaboration

**FR18.** The system shall allow researchers to register an account to use the platform.  
**FR19.** The system shall allow researchers to bookmark datasets for future reference.  
**FR20.** The system shall allow organisations to create and manage additional user accounts.  
**FR21.** The system shall allow organisations to revoke researcher access to any dataset.  
**FR22.** The system shall allow organisations to view dataset usage metrics such as access and analysis count.  
**FR23.** The system shall allow researchers to chat with other researchers for collaboration.  
**FR24.** The system shall allow researchers to chat directly with the organisation administrators.  
**FR25.** The system shall allow researchers to follow other researchers to stay updated on their research activities.  
**FR26.** The system shall allow researchers to follow organisations to receive dataset or publication updates.

###  Monetisation and Premium Features

**FR27.** The system shall allow organisations to mark specific datasets as premium.  
**FR28.** The system shall allow researchers to make payments to access premium datasets before analysis.

**FR29.** Add notification system (in-app and email) for dataset approvals, rejections, and research updates.

**FR30.** The system should have a secure role based authetication for roles organisation reseacherr and contributers



---

##  Non-Functional Requirements (NFR)

**NFR1.** The system shall use homomorphic encryption to ensure all dataset processing occurs securely without revealing raw data.  
**NFR2.** The platform shall ensure that datasets never leave the platform in an unencrypted form.  
**NFR3.** The system shall enforce role-based access control (RBAC) for researchers, organisations, and administrators.  
**NFR4.** The system shall support horizontal scalability to accommodate large datasets and concurrent users.  
**NFR5.** The platform shall maintain 99.9% uptime for high availability.  
**NFR6.** The frontend built with Next.js and TailwindCSS shall be responsive across desktops, tablets, and mobile devices.  
**NFR7.** Dataset uploads and analysis actions shall be processed within 5 seconds for datasets up to 1 GB.  
**NFR8.** The backend system, developed using Django and deployed via Docker, shall ensure consistent performance across environments.  
**NFR9.** The system shall support CSV files with up to 1 million rows and 100 columns per dataset.  
**NFR10.** Search queries for datasets and research shall return results within 2 seconds under normal load.  
**NFR11.** The system shall retain all dataset and research metadata for a minimum of 5 years for auditability and compliance.  
**NFR12.** The platform shall provide secure payment processing for premium dataset access.  
**NFR13.** The system shall maintain end-to-end encryption for all chat messages between users.  
**NFR14.** The platform shall log all data access, analysis actions, and transactions for traceability.  
**NFR15.** The system shall comply with relevant data protection regulations including GDPR.

## Added Later  
*This section lists additional ideas, features, or requirements proposed for future development. Dates indicate when each item was added to this document for traceability.*

**(Last updated: 2025-05-02)**

| ID     | Type | Description                                                                                     | Date Added   | Status    |
|--------|------|-------------------------------------------------------------------------------------------------|--------------|-----------|
| TBA1   | FR   | Introduce ML model evaluation tools for researchers using encrypted data.                      | 2025-05-02   | Planned   |
