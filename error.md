INFO:     127.0.0.1:64239 - "POST /api/spend/map HTTP/1.1" 200 OK
2026-06-21 01:09:42,226 | INFO | app.services.csv_service | Calculated spend metrics for procurement_test_upload.csv: total_spend=85400.00 rows=10
2026-06-21 01:09:42,227 | INFO | app.agents.spend_agent | Sending spend metrics for 'procurement_test_upload.csv' to Gemini for analysis
2026-06-21 01:09:42,262 | INFO | google_genai.models | AFC is enabled with max remote calls: 10.
2026-06-21 01:10:00,211 | INFO | httpx | HTTP Request: POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent "HTTP/1.1 200 OK"
2026-06-21 01:10:00,222 | ERROR | app.api.spend | Unexpected error during spend analysis
Traceback (most recent call last):
  File "C:\Users\allan\OneDrive\Desktop\PROCUREMENT\backend\app\api\spend.py", line 77, in analyze_spend
    return agent.analyze_spend(filename, content, mapping=mapping_obj)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\allan\OneDrive\Desktop\PROCUREMENT\backend\app\agents\spend_agent.py", line 102, in analyze_spend
    savings_estimate=result["savings_estimate"],
                     ~~~~~~^^^^^^^^^^^^^^^^^^^^
KeyError: 'savings_estimate'
INFO:     127.0.0.1:63575 - "POST /api/spend/analyze HTTP/1.1" 500 Internal Server Error
INFO:     Shutting down
INFO:     Waiting for application shutdown.
2026-06-21 01:10:08,947 | INFO | app.main | Procurement Advisor Agent API shutting down
INFO:     Application shutdown complete.
INFO:     Finished server process [8032]
INFO:     Stopping reloader process [16784]
(venv) PS C:\Users\allan\OneDrive\Desktop\PROCUREMENT\backend> 