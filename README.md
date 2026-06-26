# Procurement Advisor Agent

[![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18%2B-green)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.100%2B-success)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/react-18%2B-blue)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Local-first AI procurement analyst** for supplier quote comparison, contract review, and spend analysis using **Gemini 2.5 Pro**.

![Procurement Advisor Agent](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Frontend Usage](#frontend-usage)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

---

## Features

### 🏢 Supplier Quote Analysis
- Upload multiple supplier quotation PDFs
- AI-powered supplier comparison and ranking
- Evaluation on cost, delivery time, warranty, and payment terms
- Detailed recommendation reports with reasoning

### 📋 Contract Review
- Analyze supplier contracts for commercial risks
- Risk level assessment (Low/Medium/High)
- Identification of auto-renewal, vendor lock-in, and price escalation clauses
- Actionable recommendations for negotiation

### 💰 Spend Analysis
- Upload procurement spend data (CSV format)
- Spend pattern analysis and concentration metrics
- Identification of cost reduction opportunities
- Vendor consolidation recommendations
- Estimated savings calculations

### 📊 Dashboard
- Historical reports and analyses
- Summary metrics and KPIs
- Quick access to previous results
- Total spend and savings tracking

---

## Technology Stack

### Backend
- **Framework**: FastAPI 0.100+
- **Language**: Python 3.12+
- **Database**: SQLite with SQLAlchemy ORM
- **AI**: Google Gemini 2.5 Pro via google-genai SDK
- **PDF Processing**: pdfplumber + PyPDF2
- **Data Processing**: pandas + numpy

### Frontend
- **Framework**: React 18.3+
- **Build Tool**: Vite 6.0
- **UI Library**: Material-UI 6.4
- **HTTP Client**: Axios 1.7+
- **Routing**: React Router 7.1+

### Deployment
- **Local Development**: Vite dev server + Uvicorn
- **Production Ready**: Containerization with Docker (optional)

---

## Prerequisites

### System Requirements
- **OS**: Windows, macOS, or Linux
- **Python**: 3.12 or higher
- **Node.js**: 18 or higher
- **npm**: 9 or higher
- **Git**: Latest version

### API Keys
- **Gemini API Key**: Get it free from [Google AI Studio](https://ai.google.dev/)

### Disk Space
- Minimum: 2GB
- Recommended: 5GB

---

## Installation

### 1. Clone or Extract the Repository

```bash
cd PROCUREMENT
```

### 2. Create Python Virtual Environment

#### Windows (PowerShell)
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

#### macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

**Note**: If you encounter issues with `pdfplumber`, install Visual C++ Build Tools on Windows, or use:
```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Configuration

### 1. Create Environment File

Copy the `.env.example` to `.env`:

```bash
cp .env.example .env
```

On Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

### 2. Configure Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key" (sign in with your Google account if needed)
3. Create a new API key
4. Edit `.env` and add your key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Optional: Configure Database Path

By default, SQLite database is created in the project root. To use a different location:

```env
DATABASE_URL=sqlite:///absolute/path/to/procurement.db
```

---

## Running the Application

### Option 1: Run Backend and Frontend Separately (Recommended for Development)

#### Terminal 1 - Start Backend (Port 8000)
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Output should show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

#### Terminal 2 - Start Frontend (Port 5173)
```bash
cd frontend
npm run dev
```

---

## Quick Demo (5 minutes)

1. Create a `.env` in the project root and add `GEMINI_API_KEY=your_key_here`.
2. Install backend deps: `pip install -r requirements.txt`.
3. Start backend: `uvicorn app.main:app --reload --port 8000` (run from `backend`).
4. Start frontend: `npm install` then `npm run dev` (run from `frontend`).
5. Open the UI and upload `DEMO_DATA/procurement_test_upload.csv` to the Spend Analysis page.


Output should show:
```
  VITE v6.0.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

#### Access the Application
Open your browser and navigate to:
```
http://localhost:5173
```

### Option 2: Run with Docker (Optional)

Build and run the application in containers:

```bash
docker-compose up --build
```

Access at: `http://localhost:5173`

---

## API Documentation

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok"
}
```

#### Analyze Supplier Quotes
```http
POST /api/suppliers/analyze
```

**Request**: Multipart form-data with multiple PDF files

**Response:**
```json
{
  "id": 1,
  "recommended_supplier": "Acme Corp",
  "supplier_scores": [
    {
      "supplier_name": "Acme Corp",
      "score": 95,
      "rank": 1,
      "highlights": ["Best price", "Quick delivery"]
    }
  ],
  "reasoning": "...",
  "executive_summary": "...",
  "score": 95,
  "created_at": "2024-01-15T10:30:00",
  "uploaded_files": ["quote1.pdf", "quote2.pdf"]
}
```

#### Analyze Contract
```http
POST /api/contracts/analyze
```

**Request**: Multipart form-data with single PDF file

**Response:**
```json
{
  "id": 1,
  "executive_summary": "...",
  "risk_level": "Medium",
  "risks": [
    {
      "category": "Auto-renewal",
      "description": "Contract auto-renews annually",
      "severity": "High"
    }
  ],
  "recommendations": ["Negotiate renewal terms", "..."],
  "created_at": "2024-01-15T10:30:00",
  "uploaded_file": "contract.pdf"
}
```

#### Analyze Spend
```http
POST /api/spend/analyze
```

**Request**: Multipart form-data with CSV file

**Response:**
```json
{
  "id": 1,
  "total_spend": 500000,
  "savings_estimate": 50000,
  "executive_summary": "...",
  "savings_opportunities": [
    {
      "category": "IT Equipment",
      "description": "Consolidate vendors",
      "estimated_savings": 30000
    }
  ],
  "recommendations": ["..."],
  "metrics": { "...": "..." },
  "created_at": "2024-01-15T10:30:00",
  "uploaded_file": "spend.csv"
}
```

#### Get Dashboard
```http
GET /api/dashboard
```

**Response:**
```json
{
  "summary": {
    "total_supplier_analyses": 5,
    "total_contract_reviews": 3,
    "total_spend_reports": 2,
    "total_spend_analyzed": 1000000,
    "total_savings_identified": 100000,
    "high_risk_contracts": 1
  },
  "supplier_analyses": [...],
  "contract_reviews": [...],
  "spend_reports": [...]
}
```

---

## Frontend Usage

### Dashboard
- View summary metrics
- Access historical analyses
- Click on any report to view details

### Supplier Analysis
1. Navigate to **Suppliers** tab
2. Upload 2+ supplier quote PDFs
3. Click "Select Quote PDFs" or drag & drop
4. Gemini will analyze and rank suppliers
5. View recommendations and detailed analysis

### Contract Review
1. Navigate to **Contracts** tab
2. Upload a contract PDF
3. Gemini will assess risks and severity
4. Review identified risks and recommendations

### Spend Analysis
1. Navigate to **Spend** tab
2. Upload a CSV file with spend data
3. CSV format: Vendor, Category, Amount, Date (optional)
4. Gemini will identify savings opportunities
5. View metrics and recommendations

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Browser (React)                    │
│          http://localhost:5173                      │
└────────────────┬────────────────────────────────────┘
                 │ HTTP/WebSocket
                 ▼
┌─────────────────────────────────────────────────────┐
│            Vite Dev Server (Proxy)                  │
│       Proxies /api to http://localhost:8000         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend                        │
│          http://localhost:8000                      │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │         API Routes Layer                     │  │
│  │  /suppliers, /contracts, /spend, /dashboard │  │
│  └──────────────────────────────────────────────┘  │
│                       │                             │
│  ┌────────────────────┴─────────────────────────┐  │
│  │         Agent Layer (Business Logic)         │  │
│  │  SupplierAgent, ContractAgent, SpendAgent    │  │
│  └──────────────────────────────────────────────┘  │
│                       │                             │
│  ┌────────────────────┼─────────────────────────┐  │
│  │    Services Layer  │                         │  │
│  │  ┌────────────────┴─────────────────────┐   │  │
│  │  │ GeminiService │ PDFService│CSVService│   │  │
│  │  └─────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────┘  │
│                       │                             │
│                       ▼                             │
│  ┌────────────────────────────────────────────┐   │
│  │        External Services                   │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │  Google Gemini 2.5 Pro API           │  │   │
│  │  │  https://generativelanguage.googleapis │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────┘   │
│                       │                             │
│  ┌────────────────────┴─────────────────────────┐  │
│  │         Data Persistence Layer              │  │
│  │  ┌──────────────────────────────────────┐   │  │
│  │  │   SQLAlchemy ORM + SQLite            │   │  │
│  │  │   procurement.db                     │   │  │
│  │  └──────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────┘   │
│                       │                             │
│  ┌────────────────────┴─────────────────────────┐  │
│  │         File Storage                        │  │
│  │  uploads/       (source files)              │  │
│  │  reports/       (generated reports)         │  │
│  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Project Structure

```
PROCUREMENT/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry point
│   │   │
│   │   ├── api/                       # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── supplier.py            # POST /api/suppliers/analyze
│   │   │   ├── contracts.py           # POST /api/contracts/analyze
│   │   │   ├── spend.py               # POST /api/spend/analyze
│   │   │   └── dashboard.py           # GET /api/dashboard
│   │   │
│   │   ├── agents/                    # AI agent business logic
│   │   │   ├── __init__.py
│   │   │   ├── supplier_agent.py      # Supplier quote comparison
│   │   │   ├── contract_agent.py      # Contract risk analysis
│   │   │   └── spend_agent.py         # Spend opportunity analysis
│   │   │
│   │   ├── services/                  # Shared services
│   │   │   ├── __init__.py
│   │   │   ├── gemini_service.py      # Gemini 2.5 Pro integration
│   │   │   ├── pdf_service.py         # PDF text extraction
│   │   │   └── csv_service.py         # CSV parsing & metrics
│   │   │
│   │   ├── database/                  # SQLAlchemy ORM
│   │   │   ├── __init__.py
│   │   │   ├── db.py                  # SQLite config & session
│   │   │   └── models.py              # ORM models
│   │   │
│   │   ├── prompts/                   # Gemini prompt templates
│   │   │   ├── supplier_analysis.txt
│   │   │   ├── contract_review.txt
│   │   │   └── spend_analysis.txt
│   │   │
│   │   ├── uploads/                   # User-uploaded files
│   │   │   ├── suppliers/
│   │   │   ├── contracts/
│   │   │   └── spend/
│   │   │
│   │   └── reports/                   # Generated JSON reports
│   │
│   ├── requirements.txt               # Python dependencies
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── pages/                     # Route pages
│   │   │   ├── Dashboard.jsx          # Summary & historical
│   │   │   ├── SupplierAnalysis.jsx   # Upload suppliers
│   │   │   ├── ContractReview.jsx     # Upload contract
│   │   │   └── SpendAnalysis.jsx      # Upload spend CSV
│   │   │
│   │   ├── components/                # Reusable components
│   │   │   ├── Navbar.jsx             # Navigation
│   │   │   ├── FileUpload.jsx         # Drag & drop upload
│   │   │   └── ReportViewer.jsx       # Result display
│   │   │
│   │   ├── services/
│   │   │   └── api.js                 # Axios API client
│   │   │
│   │   ├── App.jsx                    # Routing & theme
│   │   └── main.jsx                   # React entry point
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
│
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
├── PRD.md                             # Product requirements
├── README.md                          # This file
└── procurement.db                     # SQLite database (auto-created)
```

---

## Troubleshooting

### Issue: "GEMINI_API_KEY is not set"

**Solution:**
1. Verify `.env` file exists in project root
2. Check that `GEMINI_API_KEY=...` is set with your actual key
3. Restart backend server after updating `.env`

### Issue: PDF Text Extraction Fails

**Solution:**
1. Ensure PDF is not corrupted (try opening in Adobe Reader)
2. Some encrypted PDFs require password
3. Try a different PDF if possible
4. Check backend logs for detailed error

### Issue: Backend Shows "Address already in use"

**Solution:**
```bash
# Kill process using port 8000 (Windows PowerShell)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

Then restart backend.

### Issue: CSV parsing fails "No such column"

**Solution:**
1. Ensure CSV has header row
2. Use column names: `Vendor`, `Category`, `Amount` (case-insensitive)
3. Verify Amount column has numeric values
4. Check for extra spaces in column names

### Issue: Frontend shows "Cannot GET /"

**Solution:**
1. Ensure Vite dev server is running on port 5173
2. Check terminal output for build errors
3. Try: `npm run dev` in frontend directory
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue: CORS errors in browser console

**Solution:**
1. Verify backend is running on `http://localhost:8000`
2. Check that Vite proxy is configured in `vite.config.js`
3. Restart both frontend and backend servers

---

## Development

### Backend Development

#### Code Style
- Use type hints for all functions
- Follow PEP 8 with 88-char line width
- Use Pydantic models for validation

#### Adding a New Agent
1. Create `backend/app/agents/new_agent.py`
2. Implement agent class with analysis method
3. Create API route in `backend/app/api/`
4. Add prompt template in `backend/app/prompts/`

#### Adding a New Service
1. Create `backend/app/services/new_service.py`
2. Add helper methods for integration
3. Handle errors with custom exceptions
4. Log important operations

### Frontend Development

#### Adding a New Page
1. Create component in `src/pages/`
2. Add route to `src/App.jsx`
3. Add navigation link to `src/components/Navbar.jsx`
4. Use `FileUpload` for uploads

#### Styling
- Use Material-UI theme from `App.jsx`
- Prefer `sx` prop over `styled()` for simplicity
- Follow responsive design (mobile-first)

### Testing

#### Backend Testing
```bash
cd backend
pytest tests/ -v
```

#### Frontend Testing
```bash
cd frontend
npm test
```

---

## Performance Tips

1. **Large Files**: Consider chunking uploads for files >20MB
2. **Caching**: Enable Redis for dashboard queries
3. **Async Processing**: Use Celery for long-running analyses
4. **Rate Limiting**: Implement rate limiting for Gemini API

---

## Security Considerations

- ✅ No user authentication (single-user MVP)
- ✅ API keys stored in `.env` (not in code)
- ✅ Input validation for all file uploads
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ⚠️ HTTPS recommended for production
- ⚠️ Implement CORS restrictions in production

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | - | Google Gemini API key |
| `GEMINI_MODEL` | ❌ No | `gemini-2.5-pro` | Model to use |
| `DATABASE_URL` | ❌ No | `sqlite:///procurement.db` | Database connection URL |
| `SQL_ECHO` | ❌ No | `false` | Log SQL queries |

---

## Version History

### v1.0.0 (Current)
- ✅ Supplier quote analysis
- ✅ Contract risk assessment
- ✅ Spend analysis
- ✅ Dashboard with historical reports
- ✅ Material UI frontend
- ✅ FastAPI backend

### Roadmap (v2.0)
- 🔄 Procurement chatbot
- 🔄 RAG document search
- 🔄 Supplier risk scoring
- 🔄 Advanced analytics

---

## Support & Contributing

### Report Issues
Open an issue with:
- Error message and stack trace
- Steps to reproduce
- Environment details (OS, Python version)

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [Google Gemini API](https://ai.google.dev/) for AI capabilities
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://react.dev/) & [Material-UI](https://mui.com/) for the frontend
- [SQLAlchemy](https://www.sqlalchemy.org/) for ORM

---

## Contact & Questions

For questions or feedback:
- Create an issue on GitHub
- Check existing documentation
- Review the PRD.md for feature details

---

**Happy analyzing! 🚀**
```

## Technology Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, Vite, Material UI, Axios     |
| Backend  | FastAPI, Python 3.12+               |
| AI       | Gemini 2.5 Pro (google-genai SDK)   |
| Database | SQLite                              |
| Storage  | Local filesystem                    |

## Environment Variables

Copy `.env.example` to `.env` and set your values:

```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
DATABASE_URL=sqlite:///procurement.db
```

## Development Phases

1. Project structure
2. Database models
3. Gemini service
4. Supplier agent
5. Contract agent
6. Spend agent
7. API endpoints
8. React frontend
9. Dashboard
10. Setup instructions
