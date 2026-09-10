import { useNavigate } from "react-router-dom";
import CurrentTime from "./CurrentTime";

function Header() {
  const navigate = useNavigate();

  return (
    <header className="top-header">
      <div>
        <h1>🌱 AquaCrop</h1>
        <p>Smart Irrigation & Water Intelligence</p>
      </div>
      <div className="header-actions">
        <CurrentTime />
        <button className="notification-btn" onClick={() => navigate("/alerts")}>🔔</button>
        <div className="farmer-profile">
          <span className="farmer-avatar">👨‍🌾</span>
          <div><strong>Farmer</strong><small>My Farm</small></div>
        </div>
      </div>
    </header>
  );
}
export default Header;