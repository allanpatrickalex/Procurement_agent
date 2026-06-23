DEMO Guide

This folder contains demo data and instructions to run Procurement Advisor Agent demos.

Files included:
- `procurement_test_upload.csv` — sample spend CSV used in demo.

Quick demo steps (backend):

1. Create a `.env` file in the project root with your Gemini API key:

   GEMINI_API_KEY=your_key_here

2. Install Python dependencies:

   pip install -r requirements.txt

3. Start the backend API (from `backend` folder):

```bash
uvicorn app.main:app --reload --port 8000
```

Quick demo steps (frontend):

1. From `frontend` folder, install dependencies:

```bash
npm install
npm run dev
```

2. Open the UI and navigate to Spend Analysis. Upload `DEMO_DATA/procurement_test_upload.csv` and run analysis.

Notes:
- PDF sample generation scripts can be added to produce sample supplier quote PDFs and contract PDFs if needed.
- The backend includes a `/api/spend/map` endpoint to preview and validate column mappings for arbitrary CSV files.

Expected outputs:
- A spend analysis report with total spend, savings opportunities, and recommendations.
- Dashboard entries showing the saved report.
