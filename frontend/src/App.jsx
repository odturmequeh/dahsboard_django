import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";       // 🔹 Nueva portada
import TimeLoad from "./pages/TimeLoad";       
import ClickRelation from "./pages/ClickRelation";
import GeniaHome from "./pages/GeniaHome";

function App() {
  return (
    <Router>
      <Routes>
        {/* Página principal / portada */}
        <Route path="/" element={<HomePage />} />

        {/* Dashboards */}
        <Route path="/timeLoad" element={<TimeLoad />} />
        <Route path="/click_relation" element={<ClickRelation />} />
        <Route path="/genia" element={<GeniaHome />} />
      </Routes>
    </Router>
  );
}

export default App;
