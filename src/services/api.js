const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed (${response.status})`);
  }
  return response.json();
}

export const api = {
  fields: () => request("/fields"),
  updateField: (id, field) => request(`/fields/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...field,
      acres: Number(field.acres),
      soil: Number(field.soil),
      temperature: Number(field.temperature),
      rainfall: Number(field.rainfall),
    }),
  }),
  irrigation: (id) => request(`/fields/${id}/irrigation`),
  history: () => request("/history"),
  recordIrrigation: (fieldId, decision) => request("/history", {
    method: "POST",
    body: JSON.stringify({
      field_id: fieldId,
      water_liters: decision.waterLiters,
      duration_minutes: decision.durationMinutes,
      priority: decision.priority,
      status: "Completed",
    }),
  }),
  alerts: () => request("/alerts"),
};
