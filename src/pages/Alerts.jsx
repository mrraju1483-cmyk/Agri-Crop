import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { api } from "../services/api";
import CurrentTime from "../components/CurrentTime";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api.alerts().then(setAlerts).catch((requestError) => setError(`Backend unavailable: ${requestError.message}`));
  }, []);
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header"><div><h1>🔔 Alerts</h1><p>Important updates about your fields</p></div><div className="header-actions"><CurrentTime /><div className="farmer-profile">👨‍🌾 Farmer</div></div></header>
        <section className="alerts-page">
          {alerts.map((alert, index) => (
            <div className={`alert-card ${alert.type}`} key={index}>
              <div className="alert-icon">{alert.icon}</div>
              <div className="alert-content"><h3>{alert.title}</h3><p>{alert.text}</p><small>{alert.time}</small></div>
            </div>
          ))}
          {error && <p className="demo-note">{error}</p>}
        </section>
      </main>
    </div>
  );
}
export default Alerts;