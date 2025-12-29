import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";       // 🔹 Nueva portada
import TimeLoad from "./pages/TimeLoad";       
import ClickRelation from "./pages/ClickRelation";
import GeniaHome from "./pages/GeniaHome";
import ClickTrackingDashboard from "./pages/ClickTrackingDashboard";
import User_click_render from "./pages/User_click_metrics";

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
        <Route path="/click_tracking" element={<ClickTrackingDashboard />} />
        {/*<Route path="/user_click_analysis" element={<User_click_render />} />*/}
        
      </Routes>
    </Router>
  );
}

export default App;
