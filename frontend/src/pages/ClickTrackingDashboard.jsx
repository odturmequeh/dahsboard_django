import EmbudoMigra from "../components/EmbudoMigra.jsx";
import SesionesVsComprasComparacion from "../components/SesionesVsCompra_Comparacion.jsx";
import TrafficChannelSummary from "../components/traffic-chanel-summary.jsx";
import TrafficDetailSummary from "../components/traffic_detail.jsx";
import DateComponentsMigra from "../components/dateComponentsMigra.jsx";
import Ga4SubcanalOwnedTable from "../components/subcanal_report.jsx";
import { useNavigate } from "react-router-dom";

export default function EmbudoMigracion() {

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

      {/* 🔹 Embudo + gráficas */}
      <EmbudoMigra />

      {/* 🔹 Comparación sesiones vs compras */}
      <DateComponentsMigra />
      <Ga4SubcanalOwnedTable />
    </div>
  );
}
