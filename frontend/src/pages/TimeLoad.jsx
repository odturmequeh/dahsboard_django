import { useEffect, useState, useCallback } from "react";
// Importamos los componentes externos
import DashboardCards from "../components/DashboardCards.jsx";
import LineChartMetrics from "../components/LineChartMetrics.jsx";
import DeviceLoadTimeChart from "../components/DeviceLoadTimeChart.jsx"; // Componente para la latencia horaria
import FunnelTable from "../components/FunnelTable.jsx";
import PageResources from "../components/PageResources.jsx";
import AIInsight from "../components/AIInsight.jsx";
import { useNavigate } from "react-router-dom";

export default function TimeLoad() {
  const navigate = useNavigate();
  const [data, setData] = useState(null); // Para métricas de las tarjetas (KPIs)
  const [dailyChartData, setDailyChartData] = useState([]); // Para LineChartMetrics
  const [loadTimeHourlyData, setLoadTimeHourlyData] = useState([]); // Nuevo estado para latencia horaria por hora/dispositivo
  const [funnelData, setFunnelData] = useState([]); // Nuevo estado para el embudo

  // Fechas por defecto (últimos 28 días)
  const today = new Date();
  const past28 = new Date();
  past28.setDate(today.getDate() - 28);

  const formatDate = (d) => d.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(formatDate(past28));
  const [endDate, setEndDate] = useState(formatDate(today));
  
  const API_BASE_URL = "/api/dashboard"; // URL Base del backend

  // --- Funciones de Fetch (usando useCallback para optimización) ---

  const fetchMetrics = useCallback(() => {
    fetch(
      `${API_BASE_URL}/metrics/?start=${startDate}&end=${endDate}`
    )
      .then((res) => res.json())
      .then((backendData) => {
        console.log("📌 Respuesta del backend (Metrics):", backendData);

        if (backendData.error) {
          console.error("❌ Error desde el backend (Metrics):", backendData.error);
          return;
        }
        setData(backendData); 
      })
      .catch((err) => {
        console.error("❌ Error llamando al backend (Metrics):", err);
      });
  }, [startDate, endDate]);

  const fetchDailyChartData = useCallback(() => {
    fetch(
      `${API_BASE_URL}/daily-metrics/?start=${startDate}&end=${endDate}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("❌ daily-metrics no es un array:", data);
          setDailyChartData([]);
          return;
        }

        const sortedData = data
          .map(item => {
            // Conversión de formato "YYYYMMDD" a objeto Date para ordenar
            const dateStr = item.date;
            const year = parseInt(dateStr.slice(0, 4));
            const month = parseInt(dateStr.slice(4, 6)) - 1; 
            const day = parseInt(dateStr.slice(6, 8));
            return { ...item, dateObj: new Date(year, month, day) };
          })
          .sort((a, b) => a.dateObj - b.dateObj) // Orden ascendente por fecha
          .map(({ dateObj, ...rest }) => rest); // Eliminamos la propiedad temporal

        setDailyChartData(sortedData);
      })
      .catch((err) => console.error("❌ Error cargando daily chart data:", err));
  }, [startDate, endDate]);


  // NUEVA FUNCIÓN DE FETCH para el gráfico horario
  const fetchLoadTimeHourlyData = useCallback(() => {
    fetch(
      `${API_BASE_URL}/load-time-hourly/?start=${startDate}&end=${endDate}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("❌ load-time-hourly no es un array:", data);
          setLoadTimeHourlyData([]);
          return;
        }
        setLoadTimeHourlyData(data);
      })
      .catch((err) => console.error("❌ Error cargando load time hourly data:", err));
  }, [startDate, endDate]);

const fetchFunnelData = useCallback(() => {
    fetch(
      `${API_BASE_URL}/funnel-data/?start=${startDate}&end=${endDate}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("❌ funnel-data no es un array:", data);
          setFunnelData([]);
          return;
        }
        console.log("📌 Datos del embudo:", data);
        setFunnelData(data);
      })
      .catch((err) => console.error("❌ Error cargando funnel data:", err));
  }, [startDate, endDate]);

  // Función maestra para obtener todos los datos
  const fetchAllData = useCallback(() => {
    fetchMetrics();
    fetchDailyChartData();
    fetchLoadTimeHourlyData(); // Llamada crucial al nuevo endpoint
    fetchFunnelData();
  }, [fetchMetrics, fetchDailyChartData, fetchLoadTimeHourlyData, fetchFunnelData]);



  // Cargar datos al iniciar y cuando cambian las dependencias
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]); 
  
  if (!data) return <p className="p-6 text-xl text-gray-700">Cargando métricas...</p>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-inter">
      {/* Botón Home */}
      <button
        onClick={() => navigate("/")}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
      >
        ← Home
      </button>
      <script src="https://cdn.tailwindcss.com"></script>
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800 border-b-2 pb-2 border-blue-200">
        Dashboard Load Time
      </h1>

      {/* Selector de rango de fechas */}
      <div className="flex flex-col sm:flex-row items-end gap-4 mb-8 bg-white p-6 rounded-xl shadow-lg">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Fecha Inicio</label>
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Fecha Fin</label>
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button
          onClick={fetchAllData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-colors duration-200"
        >
          Consultar
        </button>
      </div>

      {/* KPIs */}
      <DashboardCards
        sessions={data.sessions}
        items={data.items}
        revenue={data.revenue}
      />
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Gráfico Diario */}
        <div className="col-span-1">
          <LineChartMetrics data={dailyChartData} />
        </div>
        
        {/* Gráfico Horario */}
        <div className="col-span-1">
          <DeviceLoadTimeChart rawData={loadTimeHourlyData} />
        </div>
      </div>

      {/* Embudo de Marketing */}
      <div className="mt-6">
        <FunnelTable data={funnelData} />
      </div>
      {/* Recursos por Página */}
      <div className="mt-6">
        <PageResources startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}