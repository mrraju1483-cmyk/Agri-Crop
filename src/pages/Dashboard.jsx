import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { calculateIrrigation } from "../services/irrigationEngine";
import { api } from "../services/api";

const DEFAULT_FIELD = {
  name: "Field A",
  acres: "2",
  crop: "Tomato",
  stage: "Flowering",
  soil: "25",
  temperature: "34",
  rainfall: "0",
  water: "Good",
};

function Dashboard() {
  const navigate = useNavigate();
  const [field, setField] = useState(DEFAULT_FIELD);
  const [decision, setDecision] = useState(calculateIrrigation(DEFAULT_FIELD));
  const [error, setError] = useState("");

  useEffect(() => {
    loadField();
  }, []);

  const loadField = async () => {
    try {
      const fields = await api.fields();
      if (fields[0]) {
        setField(fields[0]);
        setDecision(await api.irrigation(fields[0].id));
      }
      setError("");
    } catch (requestError) {
      setError(`Backend unavailable: ${requestError.message}`);
    }
  };

  const priorityBadge = decision.priority === "HIGH"
    ? "HIGH PRIORITY"
    : decision.priority === "MEDIUM"
      ? "MEDIUM PRIORITY"
      : "LOW PRIORITY";

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />

        <section className="welcome-section">
          <div>
            <h2>Good Morning, Farmer 👋</h2>
            <p>Change field values and AquaCrop automatically recalculates the irrigation decision.</p>
          </div>
          <button className="primary-btn" onClick={() => navigate("/add-field")}>+ Add / Update Field</button>
        </section>

        <section className="field-main-card">
          <div className="field-info">
            <div className="field-icon">🌾</div>
            <div>
              <span className="small-label">CURRENT FIELD</span>
              <h2>{field.name || "Field A"}</h2>
              <p>📍 {field.acres || 0} Acres &nbsp; • &nbsp; 🌱 {field.crop || "Crop not set"}</p>
              <span className="monitoring">● Automatic calculation ON</span>
            </div>
          </div>
          <div className="crop-stage"><span>Growth Stage</span><strong>🌱 {field.stage || "Not set"}</strong></div>
        </section>

        <section>
          <div className="section-heading">
            <div><h2>Today's Field Conditions</h2><p>These values drive the irrigation calculation.</p></div>
          </div>
          <div className="stats-grid">
            <StatCard icon="💧" value={`${field.soil}%`} label="Soil Moisture" status={Number(field.soil) <= 30 ? "Low" : "Adequate"} />
            <StatCard icon="🌡️" value={`${field.temperature}°C`} label="Temperature" status={Number(field.temperature) >= 32 ? "High" : "Normal"} />
            <StatCard icon="🌧️" value={`${field.rainfall} mm`} label="Rainfall" status={Number(field.rainfall) >= 10 ? "Rain detected" : "Low / No Rain"} />
            <StatCard icon="🚰" value={field.water || "Unknown"} label="Water Availability" status="Current input" />
          </div>
        </section>

        <section className="recommendation-card">
          <div className="recommendation-header">
            <div className="recommendation-icon">💧</div>
            <div>
              <span className="small-label">AUTOMATIC RECOMMENDATION</span>
              <h2>{decision.title}</h2>
              <p>{decision.summary}</p>
            </div>
            <span className={`recommendation-badge ${decision.priorityClass}`}>{priorityBadge}</span>
          </div>

          <div className="recommendation-grid">
            <div><strong>{decision.waterLiters ? `${decision.waterLiters} L` : "0 L"}</strong><span>Recommended Water</span></div>
            <div><strong>{decision.durationMinutes ? `${decision.durationMinutes} min` : "0 min"}</strong><span>Irrigation Duration</span></div>
            <div><strong>{decision.bestTime}</strong><span>Best Time</span></div>
          </div>

          <div className="why-box">
            <h3>🤖 Why this recommendation?</h3>
            <div className="reason-list">
              {decision.reasons.map((reason, index) => <p key={index}>✓ {reason}</p>)}
            </div>
          </div>

          {decision.required && (
            <button className="irrigation-btn" onClick={() => navigate("/irrigation")}>💧 View Irrigation Plan</button>
          )}
          {!decision.required && <button className="secondary-btn" onClick={loadField}>🔄 Refresh Field Data</button>}
        </section>
        {error && <p className="demo-note">{error}</p>}

        <section className="calculation-note">
          <strong>🧮 Demo calculation:</strong> water quantity uses acreage, soil-moisture deficit, crop stage, crop factor, temperature, rainfall and water availability. Duration uses a demo pump-flow assumption. This is for the hackathon MVP and should be calibrated with agronomic/field data before real pump control.
        </section>

        <section className="quick-section">
          <h2>Quick Actions</h2>
          <div className="quick-grid">
            <button onClick={() => navigate("/add-field")}><span>🌾</span><strong>Change Field Values</strong><small>Update inputs and recalculate</small></button>
            <button onClick={() => navigate("/irrigation")}><span>💧</span><strong>Irrigation Plan</strong><small>View today's plan</small></button>
            <button onClick={() => navigate("/alerts")}><span>🔔</span><strong>Alerts</strong><small>Check notifications</small></button>
            <button onClick={() => navigate("/history")}><span>📊</span><strong>Water History</strong><small>View usage history</small></button>
          </div>
        </section>
      </main>
    </div>
  );
}
export default Dashboard;