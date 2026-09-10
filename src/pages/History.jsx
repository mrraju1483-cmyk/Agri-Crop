import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { api } from "../services/api";
import CurrentTime from "../components/CurrentTime";

function History() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.history().then(setHistory).catch((requestError) => setError(`Backend unavailable: ${requestError.message}`));
  }, []);

  const totalWater = history.reduce((total, item) => total + item.water_liters, 0);
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header"><div><h1>📊 Irrigation History</h1><p>Track your field water usage</p></div><div className="header-actions"><CurrentTime /><div className="farmer-profile">👨‍🌾 Farmer</div></div></header>

        <section className="history-summary">
          <div><span>💧</span><strong>{totalWater.toLocaleString()} L</strong><small>Total Water</small></div>
          <div><span>🌱</span><strong>{history.length}</strong><small>Irrigation Events</small></div>
          <div><span>💰</span><strong>18%</strong><small>Water Saved*</small></div>
        </section>

        <section className="history-table-card">
          <h2>Recent Irrigation</h2>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Field</th><th>Crop</th><th>Water</th><th>Duration</th><th>Status</th></tr></thead>
              <tbody>{history.map((item) => <tr key={item.id}><td>{new Date(item.created_at).toLocaleDateString()}</td><td>{item.field}</td><td>{item.crop}</td><td>{item.water_liters} L</td><td>{item.duration_minutes} min</td><td><span className="table-success">{item.status}</span></td></tr>)}</tbody>
            </table>
          </div>
          <small className="demo-note">*Demo calculation for Phase 1.</small>
          {error && <p className="demo-note">{error}</p>}
        </section>
      </main>
    </div>
  );
}
export default History;