import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function PageResources({ startDate, endDate }) {
  const [searchUrl, setSearchUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [visibleRows, setVisibleRows] = useState(5);
  const [selectedResource, setSelectedResource] = useState(null);
  // Fechas internas del módulo
  const today = new Date().toISOString().split("T")[0];
  const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [localStart, setLocalStart] = useState(past30);
  const [localEnd, setLocalEnd] = useState(today);


  function enforceMaxRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const diff = (endDate - startDate) / (1000 * 60 * 60 * 24);

    if (diff > 15) {
      // Si excede, mover start para que quede EXACTO 15 días
      const newStart = new Date(
        endDate.getTime() - 15 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0];

      return { start: newStart, end };
    }

    return { start, end };
  }

  // 🔥 Nueva: autocorregir fechas cuando cambien
  React.useEffect(() => {
    const corrected = enforceMaxRange(localStart, localEnd);

    if (corrected.start !== localStart) setLocalStart(corrected.start);
    if (corrected.end !== localEnd) setLocalEnd(corrected.end);

    if (selectedResource) setSelectedResource(null);
  }, [localStart, localEnd]);

  const API_BASE_URL = "/api/dashboard/resources";
    // Si cambian las fechas, cerrar modal
  React.useEffect(() => {
    if (selectedResource) setSelectedResource(null);
  }, [localStart, localEnd]);
  /** ===============================
   *  🔍 BUSCAR RECURSOS
   *  GET /resources/general/
   *  =============================== */
  const handleSearch = async () => {
    const trimmedUrl = searchUrl.trim();
    if (!trimmedUrl) {
      setError("Por favor ingresa una URL válida");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setVisibleRows(5);

    try {
      const response = await fetch(
        `${API_BASE_URL}/general/?url=${encodeURIComponent(trimmedUrl)}&start=${localStart}&end=${localEnd}`
      );

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const data = await response.json();

      if (data.error) return setError(data.error);
      if (!data.resources || data.resources.length === 0) {
        return setError(`❌ No se encontraron resultados para ${trimmedUrl}`);
      }

      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  /** ===============================
   *  📌 DETALLE DE RECURSO AL HACER CLICK
   *  Llama:
   *  GET /resources/daily/?resources=nombre
   *  GET /resources/hourly/?resources=nombre
   *  =============================== */
  const openResourceDetail = async (resource) => {
    try {
      setSelectedResource({ ...resource, loading: true });

      // CORRECCIÓN: Usar "resources" (plural) en lugar de "resource"
      const [dailyRes, hourlyRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/daily/?resources=${encodeURIComponent(resource.name)}&url=${encodeURIComponent(
            searchUrl
          )}&start=${localStart}&end=${localEnd}`
        ),
        fetch(
          `${API_BASE_URL}/hourly/?resources=${encodeURIComponent(resource.name)}&url=${encodeURIComponent(
            searchUrl
          )}&start=${localStart}&end=${localEnd}`
        ),
      ]);

      const dailyData = await dailyRes.json();
      const hourlyData = await hourlyRes.json();

      // Extraer datos del recurso específico
      const dailyValues = dailyData.resources?.[resource.name] || {};
      const hourlyValues = hourlyData.resources?.[resource.name] || {};

      setSelectedResource({
        ...resource,
        daily: dailyValues,
        hourly: hourlyValues,
        loading: false,
      });
    } catch (err) {
      console.error("Error obteniendo detalle:", err);
      setSelectedResource({
        ...resource,
        daily: {},
        hourly: {},
        loading: false,
        error: "Error al cargar los datos",
      });
    }
  };

  const handleKeyPress = (e) => e.key === "Enter" && handleSearch();
  const showMoreRows = () => setVisibleRows((prev) => prev + 5);

  // Convertir objeto de fechas a array para Recharts
  const prepareDailyData = (dailyObj) => {
    if (!dailyObj || Object.keys(dailyObj).length === 0) return [];
    
    return Object.entries(dailyObj)
      .map(([date, duration]) => ({
        date: formatDate(date), // Formato más legible
        duration: duration,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Convertir objeto de horas a array para Recharts
  const prepareHourlyData = (hourlyObj) => {
    if (!hourlyObj || Object.keys(hourlyObj).length === 0) return [];
    
    return Object.entries(hourlyObj)
      .map(([hour, duration]) => ({
        hour: `${hour}:00`,
        duration: duration,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  };

  // Formatear fecha de YYYYMMDD a DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}`;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow mt-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        🔍 Recursos por Página
      </h2>

{/* Selectores de fecha internos del módulo */}
<div className="flex flex-col sm:flex-row gap-3 mb-4 justify-center">
  <div className="flex flex-col">
    <label className="text-sm font-semibold text-gray-600">Desde:</label>
    <input
      type="date"
      value={localStart}
      max={localEnd}
      min={new Date(
        new Date(localEnd).getTime() - 15 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0]}
      onChange={(e) => setLocalStart(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg"
    />
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-semibold text-gray-600">Hasta:</label>
    <input
      type="date"
      value={localEnd}
      min={localStart}
      max={new Date(
        new Date(localStart).getTime() + 15 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0]}
      onChange={(e) => setLocalEnd(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg"
    />
  </div>
</div>




      {/* Buscador */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-center">
        <input
          type="text"
          placeholder="Escribe la URL (ej: tienda.claro.com.co)"
          value={searchUrl}
          onChange={(e) => setSearchUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000]"
        />

        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-[#E60000] text-white px-5 py-2 rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-400"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Tabla de resultados */}
      {results && !loading && (
        <div>
          <h3 className="text-lg font-bold mb-2">
            📋 {results.total_resources} recursos analizados
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3 text-left">Recurso</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-center">Duración (s)</th>
                  <th className="p-3 text-center">Repetición</th>
                  {/* <th className="p-3 text-center">Tamaño (KB)</th> */}
                </tr>
              </thead>

              <tbody>
                {results.resources.slice(0, visibleRows).map((resource, i) => (
                  <tr
                    key={i}
                    //onClick desactivado
                    //onClick={() => openResourceDetail(resource)}
                    className="border-b"
                  >
                    <td className="p-3 max-w-xs truncate" title={resource.name}>
                      {resource.name}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {resource.type}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono">
                      {resource.duration_avg.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      {resource.repeat_avg.toFixed(2)}
                    </td>
                    {/*
                    <td className="p-3 text-center">
                      {resource.size_avg.toFixed(2)}
                    </td>
                    */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mostrar más */}
          {visibleRows < results.resources.length && (
            <div className="text-center mt-6">
              <button
                onClick={showMoreRows}
                className="bg-[#E60000] text-white px-5 py-2 rounded-lg hover:bg-red-700 font-semibold"
              >
                Mostrar más ({results.resources.length - visibleRows} restantes)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==========================
           🌟 MODAL DETALLE
      =========================== */}
     {/**/}
      {selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-bold break-all text-gray-800">
                {selectedResource.name}
              </h2>
              <div className="flex gap-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-semibold">Tipo:</span> {selectedResource.type}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold">Duración promedio:</span>{" "}
                  {selectedResource.duration_avg.toFixed(2)} ms
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold">Tamaño:</span>{" "}
                  {selectedResource.size_avg.toFixed(2)} KB
                </span>
              </div>
            </div>

            {selectedResource.loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="text-gray-600 mt-2">Cargando detalle...</p>
              </div>
            )}

            {selectedResource.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {selectedResource.error}
              </div>
            )}

            {!selectedResource.loading && !selectedResource.error && (
              <div className="space-y-8">
                {/* Gráfico por día */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    📆 Duración promedio por día
                    <span className="text-sm font-normal text-gray-500">
                      ({Object.keys(selectedResource.daily || {}).length} días)
                    </span>
                  </h3>
                  {Object.keys(selectedResource.daily || {}).length > 0 ? (
                    <div className="w-full h-80 bg-gray-50 rounded-lg p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareDailyData(selectedResource.daily)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Duración (ms)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #ccc',
                              borderRadius: '8px'
                            }}
                            formatter={(value) => [`${value.toFixed(2)} ms`, 'Duración']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="duration" 
                            stroke="#005BE6" 
                            strokeWidth={2}
                            dot={{ fill: '#005BE6', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Duración"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                      No hay datos disponibles por día
                    </div>
                  )}
                </div>

                {/* Gráfico por hora */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    ⏱ Duración promedio por hora del día
                    <span className="text-sm font-normal text-gray-500">
                      ({Object.keys(selectedResource.hourly || {}).length} horas)
                    </span>
                  </h3>
                  {Object.keys(selectedResource.hourly || {}).length > 0 ? (
                    <div className="w-full h-80 bg-gray-50 rounded-lg p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareHourlyData(selectedResource.hourly)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="hour" 
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Hora', position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Duración (ms)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #ccc',
                              borderRadius: '8px'
                            }}
                            formatter={(value) => [`${value.toFixed(2)} ms`, 'Duración']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="duration" 
                            stroke="#E60000" 
                            strokeWidth={2}
                            dot={{ fill: '#E60000', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Duración"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                      No hay datos disponibles por hora
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botón cerrar */}
            <button
              onClick={() => setSelectedResource(null)}
              className="mt-6 w-full bg-[#E60000] text-white py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}