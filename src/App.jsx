import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddField from "./pages/AddField";
import Irrigation from "./pages/Irrigation";
import Alerts from "./pages/Alerts";
import History from "./pages/History";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-field" element={<AddField />} />
        <Route path="/irrigation" element={<Irrigation />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;