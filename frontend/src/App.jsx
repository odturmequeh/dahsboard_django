import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";       // 🔹 Nueva portada
import TimeLoad from "./pages/TimeLoad";       
import ClickRelation from "./pages/ClickRelation";

function App() {
  return (
    <Router>
      <Routes>
        {/* Página principal / portada */}
        <Route path="/" element={<HomePage />} />

        {/* Dashboards */}
        <Route path="/timeLoad" element={<TimeLoad />} />
        <Route path="/click_relation" element={<ClickRelation />} />
      </Routes>
    </Router>
  );
}

export default App;
