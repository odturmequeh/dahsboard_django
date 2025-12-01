import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function PageResources({ startDate, endDate }) {
  const [searchUrl, setSearchUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [visibleRows, setVisibleRows] = useState(5);

  const [selectedResource, setSelectedResource] = useState(null); // 🌟 Modal
  

  const API_BASE_URL = "https://dahsboard-django.onrender.com/api/dashboard";

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

    await new Promise(resolve => setTimeout(resolve, 30));

    try {
      const response = await fetch(
        `${API_BASE_URL}/page-resources/?url=${encodeURIComponent(trimmedUrl)}&start=${startDate}&end=${endDate}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.total_resources === 0) {
        setError(`❌ No se encontraron resultados para: ${trimmedUrl}`);
        return;
      }

      setResults(data);

    } catch (err) {
      console.error("❌ Error al buscar recursos:", err);
      setError("Error al conectar con el servidor. Verifica que Django esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const showMoreRows = () => {
    setVisibleRows((prev) => prev + 5);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow mt-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        🔍 Recursos por Página
      </h2>

      {/* Buscador */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-center">
        <input
          type="text"
          placeholder="Escribe la URL (ej: tienda.claro.com.co)"
          value={searchUrl}
          onChange={(e) => setSearchUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent outline-none text-sm"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-[#E60000] text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-[#E60000] font-medium text-lg">⏳ Cargando información...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Resultados */}
      {results && !loading && (
        <div className="text-left">
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-1">
              📋 Recursos cargados en: <span className="text-[#E60000]">{results.url}</span>
            </h3>
            <p className="text-sm text-gray-600">
              Total de recursos únicos: <span className="font-semibold">{results.total_resources}</span>
              {" "} | Filas analizadas: <span className="font-semibold">{results.filtered_rows}</span>
            </p>
          </div>

          {/* Tabla */}
<div className="overflow-x-auto relative">
  <table className="w-full border-collapse">
    <thead>
      <tr className="bg-gray-100">
        <th className="p-3 text-left text-sm font-bold text-gray-700 border-b-2">
          Resource Name / Dominio
        </th>
        <th className="p-3 text-left text-sm font-bold text-gray-700 border-b-2">
          Type
        </th>
        <th className="p-3 text-center text-sm font-bold text-gray-700 border-b-2">
          Duration Avg
        </th>
        <th className="p-3 text-center text-sm font-bold text-gray-700 border-b-2">
          Repeat
        </th>
      </tr>
    </thead>
    <tbody>
      {results.resources.slice(0, visibleRows).map((resource, idx) => (
        <tr
          key={idx}
          onClick={() => setSelectedResource(resource)} // 🌟 Abrir modal
          className="border-b cursor-pointer relative
                     hover:bg-red-50 hover:shadow-md transition-all duration-200"
        >
          <td className="p-3 text-sm text-gray-700 break-all relative group">
            {resource.name}
            {/* Tooltip */}
            <span className="absolute left-1/2 -top-6 transform -translate-x-1/2
                             bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0
                             group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Da click para ver detalle
            </span>
          </td>
          <td className="p-3 text-sm text-gray-600">{resource.type}</td>
          <td className="p-3 text-center text-sm font-medium text-gray-700">
            {resource.duration_avg.toFixed(2)}
          </td>
          <td className="p-3 text-center text-sm text-gray-600">
            {resource.repeat_avg.toFixed(2)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


          {/* Botón Mostrar más */}
          {visibleRows < results.resources.length && (
            <div className="text-center mt-6">
              <button
                onClick={showMoreRows}
                className="bg-[#E60000] text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Mostrar más
              </button>
            </div>
          )}
        </div>
      )}

{/* ==========================
   🌟 MODAL DE DETALLE
=========================== */}
{selectedResource && (
  <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 overflow-auto">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-5xl max-h-[90vh] animate-fadeIn overflow-y-auto">

      <h2 className="text-xl font-bold mb-4 break-all">
        {selectedResource.name}
      </h2>

      <p className="text-gray-700 text-sm">
        <strong>Tipo:</strong> {selectedResource.type}
      </p>

      <p className="text-gray-700 text-sm mt-2">
        <strong>Duración promedio:</strong>{" "}
        {selectedResource.duration_avg.toFixed(2)} ms
      </p>

      <p className="text-gray-700 text-sm mt-2">
        <strong>Repetición promedio:</strong>{" "}
        {selectedResource.repeat_avg.toFixed(2)}
      </p>

      {/* ==========================
            📊 GRÁFICAS LADO A LADO
      =========================== */}
      <div className="mt-6 flex gap-6 w-full flex-wrap">
        {/* Gráfico por día */}
        {selectedResource.daily && (
          <div className="flex-1 min-w-[300px]">
            <h3 className="text-md font-semibold mb-2">📆 Promedio por día</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={Object.keys(selectedResource.daily).map((day) => ({
                    day,
                    duration: selectedResource.daily[day],
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v} ms`} />
                  <Line type="monotone" dataKey="duration" stroke="#005BE6" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Gráfico por hora */}
        {selectedResource.hourly && (
          <div className="flex-1 min-w-[300px]">
            <h3 className="text-md font-semibold mb-2">⏱ Promedio por hora</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={Object.keys(selectedResource.hourly).map((hour) => ({
                    hour,
                    duration: selectedResource.hourly[hour],
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11 }}
                    label={{ value: "Hora", position: "insideBottomRight", offset: -5 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    label={{ value: "ms", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip />
                  <Line type="monotone" dataKey="duration" stroke="#E60000" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={() => setSelectedResource(null)}
        className="mt-6 w-full bg-[#E60000] text-white py-2 rounded-lg hover:bg-red-700 transition"
      >
        Cerrar
      </button>

    </div>
  </div>
)}


    </div>
  );
}
