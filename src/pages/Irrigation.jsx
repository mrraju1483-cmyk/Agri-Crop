import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { calculateIrrigation } from "../services/irrigationEngine";
import { api } from "../services/api";
import CurrentTime from "../components/CurrentTime";

const DEFAULT_FIELD = { name: "Field A", acres: "2", crop: "Tomato", stage: "Flowering", soil: "25", temperature: "34", rainfall: "0", water: "Good" };

function Irrigation() {
  const navigate = useNavigate();
  const [field, setField] = useState(DEFAULT_FIELD);
  const [decision, setDecision] = useState(calculateIrrigation(DEFAULT_FIELD));
  const [error, setError] = useState("");
  const [fieldId, setFieldId] = useState(null);

  useEffect(() => {
    api.fields().then(async (fields) => {
      if (fields[0]) {
        const next = { ...DEFAULT_FIELD, ...fields[0] };
        setFieldId(fields[0].id);
        setField(next);
        setDecision(await api.irrigation(fields[0].id));
      }
    }).catch((requestError) => setError(`Backend unavailable: ${requestError.message}`));
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div><button className="back-btn" onClick={() => navigate("/")}>← Dashboard</button><h1>Irrigation Plan</h1></div>
          <div className="header-actions"><CurrentTime /><div className="farmer-profile">👨‍🌾 Farmer</div></div>
        </header>

        <section className="irrigation-page">
          <div className="irrigation-status">
            <div className="big-water-icon">💧</div>
            <div><span className="small-label">AUTOMATIC PLAN FOR {field.name.toUpperCase()}</span><h2>{decision.title}</h2><p>{decision.summary}</p></div>
          </div>

          <div className="plan-cards">
            <div><span>💧</span><strong>{decision.waterLiters} L</strong><small>Water Required</small></div>
            <div><span>⏱️</span><strong>{decision.durationMinutes} min</strong><small>Duration</small></div>
            <div><span>🕕</span><strong>{decision.bestTime}</strong><small>Recommended Time</small></div>
          </div>

          <div className="schedule-card">
            <h2>📅 Today's Schedule</h2>
            <div className="schedule-row"><span>{decision.bestTime}</span><div><strong>{field.name} — {field.crop}</strong><p>{decision.waterLiters} L • {decision.durationMinutes} minutes • {decision.priority} priority</p></div><span className={`scheduled ${decision.priorityClass}`}>{decision.priority}</span></div>
          </div>

          <div className="ai-box">
            <h2>🤖 Smart Decision Explanation</h2>
            <p>{decision.summary}</p>
            <ul>{decision.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>
          </div>

          {decision.required ? (
            <>
              <button className="irrigation-btn large" onClick={async () => {
                try {
                  await api.recordIrrigation(fieldId, decision);
                  alert(`${decision.waterLiters} L / ${decision.durationMinutes} min irrigation event recorded.`);
                } catch (requestError) {
                  setError(`Unable to record irrigation: ${requestError.message}`);
                }
              }}>💧 Start Irrigation</button>
              <p className="demo-note">Demo mode: actual pump/device control will be connected in Phase 2/3.</p>
            </>
          ) : (
            <p className="demo-note">No pump action recommended right now. Continue monitoring field conditions.</p>
          )}
        </section>
        {error && <p className="demo-note">{error}</p>}
      </main>
    </div>
  );
}
export default Irrigation;