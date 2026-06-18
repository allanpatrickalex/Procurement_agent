# Procurement Advisor Agent

## MVP Product Requirements Document (PRD)

Version 1.1

---

# Product Overview

## Product Name

Procurement Advisor Agent

## Vision

Build an AI-powered procurement analyst that helps procurement teams:

* Compare supplier quotations
* Review supplier contracts
* Analyze procurement spend
* Identify savings opportunities
* Generate procurement recommendations

The system uses Gemini 2.5 Pro to perform procurement analysis and produce decision-ready reports.

This MVP is intended for local development and customer demonstrations.

---

# MVP Goals

The application must allow users to:

1. Upload supplier quote PDFs
2. Receive supplier rankings and recommendations
3. Upload supplier contracts
4. Receive contract risk assessments
5. Upload spend CSV files
6. Receive savings recommendations
7. View previous reports

---

# Out of Scope

The following are intentionally excluded from MVP:

* User accounts
* Login
* Registration
* JWT Authentication
* OAuth
* Multi-user support
* ERP integrations
* SAP integration
* Oracle integration
* Autonomous purchasing
* Negotiation agents
* Cloud deployment

---

# Technology Stack

## Frontend

* React
* Vite
* Material UI
* Axios

## Backend

* FastAPI
* Python 3.12+

## AI

* Gemini 2.5 Pro
* Google Generative AI SDK

## Database

* SQLite

Database File:

procurement.db

## Storage

Local filesystem

Folders:

uploads/
reports/

---

# Architecture

React Frontend

↓

FastAPI Backend

↓

Agent Layer

↓

Gemini 2.5 Pro

↓

SQLite

↓

Local File Storage

---

# Core Feature 1: Supplier Comparison Agent

## Purpose

Evaluate multiple supplier quotations and recommend the best supplier.

## Inputs

Multiple PDF quote documents.

Example:

* Dell_Quote.pdf
* HP_Quote.pdf
* Lenovo_Quote.pdf

## Extracted Fields

* Supplier Name
* Product/Service
* Price
* Lead Time
* Warranty
* Payment Terms

## AI Tasks

Analyze supplier quotations.

Score suppliers based on:

* Cost
* Delivery Time
* Warranty
* Payment Terms

Generate:

* Supplier ranking
* Recommended supplier
* Procurement reasoning

## Output

Supplier scorecard

Recommendation report

Executive summary

---

# Core Feature 2: Contract Review Agent

## Purpose

Analyze supplier contracts and identify risks.

## Inputs

Single PDF contract.

Examples:

* MSA.pdf
* Supplier_Agreement.pdf

## Extract

* Contract Term
* Renewal Date
* Price Escalation Clauses
* Termination Clauses
* SLA Requirements
* Penalty Clauses

## Risk Detection

Identify:

* Auto-renewal
* Vendor lock-in
* Annual price increases
* Missing SLA language
* Termination restrictions

## AI Tasks

Generate:

* Executive summary
* Risk assessment
* Risk level
* Recommendations

## Output

Contract review report

Risk assessment report

---

# Core Feature 3: Spend Analysis Agent

## Purpose

Analyze procurement spend and identify savings opportunities.

## Input

CSV file.

Example Columns:

Vendor
Category
Amount
Date

## Calculations

* Total spend
* Spend by vendor
* Spend by category
* Top suppliers
* Spend concentration

## AI Tasks

Identify:

* Cost reduction opportunities
* Vendor consolidation opportunities
* Overspending trends
* Procurement insights

## Output

Spend report

Savings recommendations

Executive summary

---

# Dashboard

## Purpose

Display historical analyses.

## Sections

Supplier Analyses

Contract Reviews

Spend Reports

Summary Metrics

---

# Database Design

## supplier_analysis

Fields:

* id
* recommended_supplier
* score
* summary
* created_at

## contract_reviews

Fields:

* id
* risk_level
* summary
* created_at

## spend_reports

Fields:

* id
* total_spend
* savings_estimate
* summary
* created_at

---

# API Endpoints

## Supplier Analysis

POST /api/suppliers/analyze

Upload supplier quote PDFs.

Returns recommendation report.

---

## Contract Analysis

POST /api/contracts/analyze

Upload contract PDF.

Returns contract review report.

---

## Spend Analysis

POST /api/spend/analyze

Upload CSV.

Returns spend analysis report.

---

## Dashboard

GET /api/dashboard

Returns dashboard metrics and historical reports.

---

# Folder Structure

procurement-advisor/

frontend/

src/

pages/

components/

services/

App.jsx

main.jsx

backend/

app/

api/

supplier.py

contracts.py

spend.py

dashboard.py

agents/

supplier_agent.py

contract_agent.py

spend_agent.py

services/

gemini_service.py

pdf_service.py

csv_service.py

database/

db.py

models.py

uploads/

reports/

main.py

.env

requirements.txt

README.md

---

# Environment Variables

GEMINI_API_KEY=YOUR_GEMINI_API_KEY

DATABASE_URL=sqlite:///procurement.db

---

# Required Packages

fastapi

uvicorn

sqlalchemy

python-multipart

pandas

numpy

pdfplumber

PyPDF2

google-genai

python-dotenv

---

# MVP Definition of Done

The MVP is complete when:

1. User uploads supplier quote PDFs.
2. Gemini ranks suppliers.
3. User receives procurement recommendation.
4. User uploads contract PDF.
5. Gemini generates risk assessment.
6. User uploads spend CSV.
7. Gemini generates savings recommendations.
8. Reports are saved to SQLite.
9. Dashboard displays historical reports.
10. Entire application runs locally.

---

# Future Roadmap

Version 2:

* Procurement chatbot
* RAG document search
* Supplier risk scoring
* Contract search
* Analytics dashboard

Version 3:

* Google Cloud deployment
* ERP integrations
* RFQ generation
* Procurement copilot
* Multi-agent procurement workflows

Long-Term Vision:

An AI procurement platform capable of functioning as a virtual procurement analyst and procurement advisor for small and medium-sized businesses.
