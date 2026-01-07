import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import TimeLoad from "./pages/TimeLoad";
import ClickRelation from "./pages/ClickRelation";
import GeniaHome from "./pages/GeniaHome";
import PosPago from "./pages/PosPago";
import ClickTrackingDashboard from "./pages/ClickTrackingDashboard";
import User_click_render from "./pages/User_click_metrics";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/timeLoad" element={<TimeLoad />} />
        <Route path="/click_relation" element={<ClickRelation />} />
        <Route path="/genia" element={<GeniaHome />} />
        <Route path="/PosPago" element={<PosPago />} />
        <Route path="/click_tracking" element={<ClickTrackingDashboard />} />
        {/*<Route path="/user_click_analysis" element={<User_click_render />} />*/}
      </Routes>
    </Router>
  );
}
export default App;
