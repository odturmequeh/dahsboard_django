import UserClickAnalysis from "../components/User_click.jsx";

import { useNavigate } from "react-router-dom";

export default function User_click_render() {

  const navigate = useNavigate();
  return (
  
    <div className="space-y-10">

      <button
        onClick={() => navigate("/")}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
      >
        ← Home
      </button>

      <h2 className="text-xl font-semibold mb-4">📊 Métricas Migración Dashboard</h2>

      {/* 🔹 User click */}
      <UserClickAnalysis />
    </div>
  );
}
