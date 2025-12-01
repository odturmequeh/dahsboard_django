import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GeniaComponentCards from "../components/GeniaComponentCards";
import GeniaComponentChart from "../components/GeniaComponentChart";

export default function GeniaHome() {
  const navigate = useNavigate();

  // Fecha mínima: 22 de noviembre
  const MIN_DATE = "2025-11-22";
  const today = new Date().toISOString().split("T")[0];

  // Estados para rango de fechas
  const [startDate, setStartDate] = useState(MIN_DATE);
  const [endDate, setEndDate] = useState(today);

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* Botón Home */}
      <button
        onClick={() => navigate("/")}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
      >
        ← Home
      </button>

      <h2 className="text-xl font-semibold mb-4">📊 Genia Dashboard</h2>

      {/* Rango de fechas */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha inicio
          </label>
          <input
            type="date"
            min={MIN_DATE}
            max={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha fin
          </label>
          <input
            type="date"
            min={MIN_DATE}
            max={today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-3 py-1"
          />
        </div>
      </div>

      {/* El hijo ahora recibe el rango de fechas */}
      <GeniaComponentCards startDate={startDate} endDate={endDate} />
      <div className="mt-6">
        <GeniaComponentChart startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}
