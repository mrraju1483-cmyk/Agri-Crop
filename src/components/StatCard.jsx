function StatCard({ icon, value, label, status }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <h3>{value}</h3>
        <p>{label}</p>
        {status && <span className="stat-status">{status}</span>}
      </div>
    </div>
  );
}
export default StatCard;