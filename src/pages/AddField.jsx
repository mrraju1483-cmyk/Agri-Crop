import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateIrrigation } from "../services/irrigationEngine";
import { api } from "../services/api";
import CurrentTime from "../components/CurrentTime";

const INITIAL = {
  name: "Field A", acres: "2", crop: "Tomato", stage: "Flowering",
  soil: "25", temperature: "34", rainfall: "0", water: "Good"
};

function AddField() {
  const navigate = useNavigate();
  const [field, setField] = useState(INITIAL);
  const [preview, setPreview] = useState(calculateIrrigation(INITIAL));
  const [fieldId, setFieldId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.fields().then((fields) => {
      if (fields[0]) {
        const next = { ...INITIAL, ...fields[0] };
        setFieldId(fields[0].id);
        setField(next);
        setPreview(calculateIrrigation(next));
      }
    }).catch((requestError) => setError(`Backend unavailable: ${requestError.message}`));
  }, []);

  const handleChange = (e) => {
    const next = { ...field, [e.target.name]: e.target.value };
    setField(next);
    setPreview(calculateIrrigation(next));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const saved = await api.updateField(fieldId, field);
      setField({ ...field, ...saved });
      setError("");
    } catch (requestError) {
      setError(`Unable to save field: ${requestError.message}`);
      return;
    }
    alert(`Saved! ${preview.required ? `${preview.waterLiters} L for ${preview.durationMinutes} min — ${preview.priority} priority.` : preview.title}`);
    navigate("/");
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">🌱<div><strong>AquaCrop</strong><small>Smart Farming</small></div></div>
        <nav>
          <button className="mobile-nav-link" onClick={() => navigate("/")}>🏠 <span>Dashboard</span></button>
          <button className="mobile-nav-link active" onClick={() => navigate("/add-field")}>🌾 <span>My Fields</span></button>
          <button className="mobile-nav-link" onClick={() => navigate("/irrigation")}>💧 <span>Irrigation</span></button>
          <button className="mobile-nav-link" onClick={() => navigate("/alerts")}>🔔 <span>Alerts</span></button>
          <button className="mobile-nav-link" onClick={() => navigate("/history")}>📊 <span>History</span></button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div><button className="back-btn" onClick={() => navigate("/")}>← Dashboard</button><h1>Field Data & Calculation</h1></div>
          <div className="header-actions"><CurrentTime /><div className="farmer-profile"><span className="farmer-avatar">👨‍🌾</span><strong>Farmer</strong></div></div>
        </header>

        <section className="form-container">
          <div className="page-title">
            <h2>🌾 Update Field Values</h2>
            <p>As you change values, the water quantity, duration and priority update instantly below.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group"><label>Field Name</label><input name="name" value={field.name} onChange={handleChange} placeholder="Example: Field A" required /></div>
              <div className="input-group"><label>Area (Acres)</label><input name="acres" type="number" min="0.1" step="0.1" value={field.acres} onChange={handleChange} required /></div>
              <div className="input-group">
                <label htmlFor="crop">Crop Type</label>
                <select
                  value={["Tomato", "Rice", "Chilli", "Cotton", "Groundnut", "Maize", "Vegetables"].includes(field.crop) ? field.crop : ""}
                  onChange={(event) => handleChange({ target: { name: "crop", value: event.target.value } })}
                  aria-label="Choose a crop type"
                >
                  <option value="">Choose a crop</option>
                  <option>Tomato</option>
                  <option>Rice</option>
                  <option>Chilli</option>
                  <option>Cotton</option>
                  <option>Groundnut</option>
                  <option>Maize</option>
                  <option>Vegetables</option>
                </select>
                <input
                  id="crop"
                  name="crop"
                  value={field.crop}
                  onChange={handleChange}
                  placeholder="Or type another crop"
                  required
                  style={{ marginTop: "8px" }}
                />
              </div>
              <div className="input-group"><label>Growth Stage</label><select name="stage" value={field.stage} onChange={handleChange} required><option value="">Select Stage</option><option>Seedling</option><option>Vegetative</option><option>Flowering</option><option>Fruiting</option><option>Harvesting</option></select></div>
              <div className="input-group"><label>Soil Moisture (%)</label><input name="soil" type="number" min="0" max="100" value={field.soil} onChange={handleChange} required /></div>
              <div className="input-group"><label>Temperature (°C)</label><input name="temperature" type="number" value={field.temperature} onChange={handleChange} required /></div>
              <div className="input-group"><label>Rainfall (mm)</label><input name="rainfall" type="number" min="0" step="0.1" value={field.rainfall} onChange={handleChange} required /></div>
              <div className="input-group"><label>Water Availability</label><select name="water" value={field.water} onChange={handleChange} required><option>Good</option><option>Limited</option><option>Very Limited</option></select></div>
            </div>

            <div className="live-calculation">
              <div className="live-calculation-title"><span>⚡ LIVE CALCULATION</span><strong>{preview.priority} PRIORITY</strong></div>
              <div className="live-calculation-grid">
                <div><strong>{preview.waterLiters} L</strong><small>Water Quantity</small></div>
                <div><strong>{preview.durationMinutes} min</strong><small>Duration</small></div>
                <div><strong>{preview.bestTime}</strong><small>Best Time</small></div>
              </div>
              <p>{preview.summary}</p>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={() => navigate("/")}>Cancel</button>
              <button type="submit" className="primary-btn">Save Field & Apply →</button>
            </div>
            {error && <p className="demo-note">{error}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}
export default AddField;