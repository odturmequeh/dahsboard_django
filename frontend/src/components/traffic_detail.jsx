import { useEffect, useState, useMemo } from "react";

export default function TrafficDetailSummary() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("2025-11-01");
  const [endDate, setEndDate] = useState("2025-11-30");
  const [visibleRows, setVisibleRows] = useState(15);
  const [selectedChannel, setSelectedChannel] = useState("all");

  // Cambio de fechas
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === "startDate") setStartDate(value);
    if (name === "endDate") setEndDate(value);
    setVisibleRows(15); // Reset filas al cambiar fecha
  };

  // Fetch de datos
  useEffect(() => {
    setLoading(true);
    fetch(
      `/api/dashboard/ga4-traffic-detail-summary/?start_date=${startDate}&end_date=${endDate}`
    )
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [startDate, endDate]);

  // Filtrado por Canal L1
  const filteredData = useMemo(() => {
    if (selectedChannel === "all") return data;
    return data.filter((row) => row["Canal L1"] === selectedChannel);
  }, [data, selectedChannel]);

  // Lista de canales únicos para los botones
  const channelOptions = useMemo(() => {
    const channels = Array.from(new Set(data.map((row) => row["Canal L1"])));
    return ["all", ...channels];
  }, [data]);

  // Ver más filas
  const handleLoadMore = () => {
    setVisibleRows((prev) => prev + 5);
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-500 animate-pulse">
        Cargando detalle de tráfico...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-6">
      {/* Header y fechas */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Detalle de Tráfico GA4
          </h2>
          <p className="text-sm text-gray-500">
            Periodo: {startDate} → {endDate} | Total filas: {filteredData.length}
          </p>
        </div>

        {/* Inputs de fecha */}
        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-600">Fecha inicio</label>
            <input
              type="date"
              name="startDate"
              value={startDate}
              onChange={handleDateChange}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Fecha fin</label>
            <input
              type="date"
              name="endDate"
              value={endDate}
              onChange={handleDateChange}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Filtros tipo botones */}
      <div className="flex flex-wrap gap-2">
        {channelOptions.map((ch) => (
          <button
            key={ch}
            onClick={() => {
              setSelectedChannel(ch);
              setVisibleRows(15); // reset filas al cambiar filtro
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition
              ${
                selectedChannel === ch
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            {ch === "all" ? "Todos" : ch}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Canal L1</th>
              <th className="px-4 py-3 text-left">Fuente/Medio</th>
              <th className="px-4 py-3 text-left">Campaña</th>
              <th className="px-4 py-3 text-right">Sesiones</th>
              <th className="px-4 py-3 text-right">Compras</th>
              <th className="px-4 py-3 text-right">TC (%)</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.slice(0, visibleRows).map((row, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50 transition">
                <td className="px-4 py-2">{row["Canal L1"]}</td>
                <td className="px-4 py-2">{row["Fuente/Medio"]}</td>
                <td className="px-4 py-2">{row["Campaña"]}</td>
                <td className="px-4 py-2 text-right">{row["Sesiones Mig"].toLocaleString()}</td>
                <td className="px-4 py-2 text-right">{row["Artículos comprados"].toLocaleString()}</td>
                <td className="px-4 py-2 text-right">{row["Tasa de Conversión"]}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botón ver más */}
      {visibleRows < filteredData.length && (
        <div className="text-center mt-4">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Ver más
          </button>
        </div>
      )}
    </div>
  );
}
