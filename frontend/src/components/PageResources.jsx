import React, { useState } from "react";

export default function PageResources({ startDate, endDate }) {
  const [searchUrl, setSearchUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [visibleRows, setVisibleRows] = useState(5);
  const [analysis, setAnalysis] = useState("");

  const API_BASE_URL = "http://127.0.0.1:8000/api/dashboard";

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
    setAnalysis("");

    // Simular pequeño delay para liberar el hilo (como en el código original)
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
      console.log("📊 Agrupaciones calculadas:", data);
       const aiResponse = await fetch(
      `${API_BASE_URL}/ai-resources-analysis/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resources: data.resources,
          url: trimmedUrl
        })
      }
    );

    const aiData = await aiResponse.json();

    if (aiData.error) {
      console.error("❌ Error IA:", aiData.error);
      setAnalysis("❌ Error consultando IA.");
    } else {
      setAnalysis(aiData.analysis);
    }
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
          <div className="overflow-x-auto">
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
                  <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-sm text-gray-700 break-all">
                      {resource.name}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {resource.type}
                    </td>
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

                {analysis && (
        <div className="mt-6 bg-gray-100 border p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2">🤖 Análisis IA</h3>
          <p className="whitespace-pre-line">{analysis}</p>
        </div>
      )}
        </div>
      )}
    </div>
  );
}