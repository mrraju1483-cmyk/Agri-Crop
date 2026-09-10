import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        🌱
        <div><strong>AquaCrop</strong><small>Smart Farming</small></div>
      </div>
      <nav>
        <NavLink to="/" end>🏠 <span>Dashboard</span></NavLink>
        <NavLink to="/add-field">🌾 <span>My Fields</span></NavLink>
        <NavLink to="/irrigation">💧 <span>Irrigation</span></NavLink>
        <NavLink to="/alerts">🔔 <span>Alerts</span></NavLink>
        <NavLink to="/history">📊 <span>History</span></NavLink>
      </nav>
      <div className="sidebar-bottom">
        <div>🌤️ Weather</div>
        <div>🎙️ Telugu Voice</div>
        <div>❓ Help & Support</div>
      </div>
    </aside>
  );
}
export default Sidebar;