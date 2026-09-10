# AquaCrop Phase 1 Frontend — Automatic Irrigation Calculation

React + Vite frontend for the AquaCrop Smart Irrigation & Water Intelligence Platform.

## Run
1. Install Node.js LTS.
2. Open this folder in VS Code.
3. Start the FastAPI backend in a second terminal:
   ```
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```
4. Start the frontend:
   npm install
   npm run dev
5. Open the Vite URL, usually http://localhost:5173/

The backend creates `backend/aquacrop.db` automatically, seeds one default field, and exposes:
- `GET /api/fields` and `PUT /api/fields/{id}` for field data
- `GET /api/fields/{id}/irrigation` for the irrigation recommendation
- `GET /api/alerts` for current alerts
- `GET/POST /api/history` for irrigation events

## Automatic calculation
Go to **My Fields / Add / Update Field**. As the farmer changes:
- Area
- Crop
- Growth stage
- Soil moisture
- Temperature
- Rainfall
- Water availability

the app immediately recalculates:
- Recommended water quantity (L)
- Irrigation duration (minutes)
- Priority (HIGH / MEDIUM / LOW)
- Recommended time
- Explanation/reasons

The same decision is shown on Dashboard and Irrigation Plan.

## Important
The calculation is a transparent demo rule engine for the hackathon MVP. It is not a calibrated agronomic model and should not be connected to real pump control without field validation and safety checks.
