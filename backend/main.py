from datetime import datetime, timezone
from pathlib import Path
import sqlite3
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


DATABASE_PATH = Path(__file__).resolve().parent / "aquacrop.db"

DEFAULT_FIELD = {
    "name": "Field A",
    "acres": 2,
    "crop": "Tomato",
    "stage": "Flowering",
    "soil": 25,
    "temperature": 34,
    "rainfall": 0,
    "water": "Good",
}

CROP_FACTORS = {
    "Tomato": 1.00,
    "Rice": 1.20,
    "Chilli": 0.95,
    "Cotton": 1.05,
    "Groundnut": 0.90,
    "Maize": 1.00,
    "Vegetables": 0.95,
}

STAGE_FACTORS = {
    "Seedling": 0.70,
    "Vegetative": 0.90,
    "Flowering": 1.10,
    "Fruiting": 1.15,
    "Harvesting": 0.80,
}


class FieldInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    acres: float = Field(gt=0)
    crop: str = Field(min_length=1, max_length=50)
    stage: str = Field(min_length=1, max_length=50)
    soil: float = Field(ge=0, le=100)
    temperature: float
    rainfall: float = Field(ge=0)
    water: str = Field(min_length=1, max_length=30)


class IrrigationEventInput(BaseModel):
    field_id: int
    water_liters: int = Field(ge=0)
    duration_minutes: int = Field(ge=0)
    priority: str
    status: str = "Completed"


def connection() -> sqlite3.Connection:
    db = sqlite3.connect(DATABASE_PATH)
    db.row_factory = sqlite3.Row
    return db


def init_database() -> None:
    with connection() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS fields (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                acres REAL NOT NULL,
                crop TEXT NOT NULL,
                stage TEXT NOT NULL,
                soil REAL NOT NULL,
                temperature REAL NOT NULL,
                rainfall REAL NOT NULL,
                water TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS irrigation_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                field_id INTEGER NOT NULL,
                water_liters INTEGER NOT NULL,
                duration_minutes INTEGER NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(field_id) REFERENCES fields(id)
            );
            """
        )
        if db.execute("SELECT COUNT(*) FROM fields").fetchone()[0] == 0:
            now = datetime.now(timezone.utc).isoformat()
            db.execute(
                """
                INSERT INTO fields
                (name, acres, crop, stage, soil, temperature, rainfall, water, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (*DEFAULT_FIELD.values(), now),
            )


def calculate_irrigation(field: dict[str, Any]) -> dict[str, Any]:
    acres = max(0.1, float(field["acres"]))
    soil = min(100, max(0, float(field["soil"])))
    temperature = float(field["temperature"])
    rainfall = max(0, float(field["rainfall"]))
    water = field["water"]
    crop_factor = CROP_FACTORS.get(field["crop"], 1)
    stage_factor = STAGE_FACTORS.get(field["stage"], 1)

    if rainfall >= 10:
        return {
            "required": False, "priority": "LOW", "priorityClass": "low",
            "waterLiters": 0, "durationMinutes": 0, "bestTime": "Monitor",
            "title": "Irrigation Can Be Delayed",
            "summary": f"Recent rainfall of {rainfall:g} mm is enough to postpone irrigation for now.",
            "reasons": [f"Rainfall is {rainfall:g} mm", "Avoiding unnecessary irrigation saves water",
                        f"Soil moisture is currently {soil:g}%"],
        }

    if soil >= 45:
        return {
            "required": False, "priority": "LOW", "priorityClass": "low",
            "waterLiters": 0, "durationMinutes": 0, "bestTime": "Monitor",
            "title": "No Irrigation Required",
            "summary": f"Soil moisture is {soil:g}%, which is currently adequate for the demo decision.",
            "reasons": [f"Soil moisture is {soil:g}%",
                        f"Rainfall recorded: {rainfall:g} mm" if rainfall > 0 else "No significant rainfall",
                        "Wait and monitor before adding more water"],
        }

    liters = acres * 225 * (max(0, 40 - soil) / 10) * crop_factor * stage_factor
    if temperature >= 35:
        liters *= 1.12
    elif temperature >= 32:
        liters *= 1.06
    if 0 < rainfall < 10:
        liters *= 0.85
    if water == "Limited":
        liters *= 0.80
    elif water == "Very Limited":
        liters *= 0.65

    liters = round(max(80, liters) / 10) * 10
    duration = max(5, round(liters / (25 * acres)))
    priority = "HIGH" if soil <= 30 or temperature >= 34 else "MEDIUM"
    priority_class = priority.lower()
    best_time = "6:00 AM" if temperature >= 32 else "6:00–8:00 AM"
    reasons = [
        f"Soil moisture is {soil:g}%",
        f"Temperature is {temperature:g}°C",
        f"Rainfall is {rainfall:g} mm" if rainfall > 0 else "No significant rainfall detected",
        f"{field['crop']} is in {field['stage']} stage",
    ]
    return {
        "required": True, "priority": priority, "priorityClass": priority_class,
        "waterLiters": liters, "durationMinutes": duration, "bestTime": best_time,
        "title": "Irrigation Required",
        "summary": f"The field needs approximately {liters:g} L of water for about {duration} minutes.",
        "reasons": reasons,
    }


def row_to_field(row: sqlite3.Row) -> dict[str, Any]:
    return dict(row)


app = FastAPI(title="AquaCrop API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_database()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/fields")
def list_fields() -> list[dict[str, Any]]:
    with connection() as db:
        return [row_to_field(row) for row in db.execute("SELECT * FROM fields ORDER BY id")]


@app.get("/api/fields/{field_id}")
def get_field(field_id: int) -> dict[str, Any]:
    with connection() as db:
        row = db.execute("SELECT * FROM fields WHERE id = ?", (field_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Field not found")
    return row_to_field(row)


@app.post("/api/fields")
def create_field(field: FieldInput) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    with connection() as db:
        cursor = db.execute(
            """
            INSERT INTO fields
            (name, acres, crop, stage, soil, temperature, rainfall, water, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (*field.model_dump().values(), now),
        )
        row = db.execute("SELECT * FROM fields WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return row_to_field(row)


@app.put("/api/fields/{field_id}")
def update_field(field_id: int, field: FieldInput) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    with connection() as db:
        cursor = db.execute(
            """
            UPDATE fields SET name=?, acres=?, crop=?, stage=?, soil=?,
            temperature=?, rainfall=?, water=?, updated_at=? WHERE id=?
            """,
            (*field.model_dump().values(), now, field_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Field not found")
        row = db.execute("SELECT * FROM fields WHERE id = ?", (field_id,)).fetchone()
    return row_to_field(row)


@app.get("/api/fields/{field_id}/irrigation")
def field_irrigation(field_id: int) -> dict[str, Any]:
    field = get_field(field_id)
    return calculate_irrigation(field)


@app.get("/api/history")
def history() -> list[dict[str, Any]]:
    with connection() as db:
        return [dict(row) for row in db.execute(
            """
            SELECT irrigation_events.*, fields.name AS field, fields.crop
            FROM irrigation_events JOIN fields ON fields.id = irrigation_events.field_id
            ORDER BY irrigation_events.created_at DESC
            """
        )]


@app.post("/api/history")
def create_history_event(event: IrrigationEventInput) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    with connection() as db:
        if db.execute("SELECT 1 FROM fields WHERE id = ?", (event.field_id,)).fetchone() is None:
            raise HTTPException(status_code=404, detail="Field not found")
        cursor = db.execute(
            """
            INSERT INTO irrigation_events
            (field_id, water_liters, duration_minutes, priority, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (*event.model_dump().values(), now),
        )
        row = db.execute(
            """
            SELECT irrigation_events.*, fields.name AS field, fields.crop
            FROM irrigation_events JOIN fields ON fields.id = irrigation_events.field_id
            WHERE irrigation_events.id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
    return dict(row)


@app.get("/api/alerts")
def alerts() -> list[dict[str, Any]]:
    fields = list_fields()
    if not fields:
        return []
    field = fields[0]
    decision = calculate_irrigation(field)
    result = []
    if decision["required"]:
        result.append({"icon": "💧", "title": "Irrigation Required",
                       "text": f"{field['name']} soil moisture is below the recommended level.",
                       "time": "Now", "type": "warning"})
    if field["temperature"] >= 32:
        result.append({"icon": "🌡️", "title": "High Temperature",
                       "text": f"Temperature reached {field['temperature']:g}°C. Monitor crop water stress.",
                       "time": "Now", "type": "danger"})
    if field["rainfall"] < 10:
        result.append({"icon": "🌧️", "title": "No Rainfall",
                       "text": "No significant rainfall detected for today.", "time": "Now", "type": "info"})
    if field["water"] == "Good":
        result.append({"icon": "✅", "title": "Water Availability Good",
                       "text": "Sufficient water is available for the recommended irrigation.",
                       "time": "Now", "type": "success"})
    return result
