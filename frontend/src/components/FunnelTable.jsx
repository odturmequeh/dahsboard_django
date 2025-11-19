import React, { useState } from "react";

export default function FunnelTable({ data }) {
  const [selectedStage, setSelectedStage] = useState(null);
  const [visibleUrls, setVisibleUrls] = useState(5);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow mt-6">
        <p className="text-gray-500 text-center">No hay datos del embudo para mostrar.</p>
      </div>
    );
  }

  // Colores del embudo
  const funnelColors = {
    "Atracción": "#E60000",
    "Interés": "#FF4D4D",
    "Consideración": "#FF7B7B",
    "Conversión": "#FFC1C1",
  };

  // Función para formatear números grandes
  const formatShortNumber = (num) => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toFixed(1);
  };

  // Calcular el ancho máximo para las barras
  const maxVistas = Math.max(...data.map(d => d.vistas));

  // Abrir modal con URLs
  const openModal = (stage) => {
    setSelectedStage(stage);
    setVisibleUrls(5); // Resetear a 5 URLs visibles
  };

  // Cerrar modal
  const closeModal = () => {
    setSelectedStage(null);
  };

  // Mostrar más URLs
  const showMoreUrls = () => {
    setVisibleUrls(prev => prev + 5);
  };

  const selectedData = data.find(d => d.stage === selectedStage);

  return (
    <div className="bg-white p-6 rounded-2xl shadow mt-6">
      <h2 className="text-2xl font-bold mb-6 text-[#E60000] text-center border-b-2 pb-2">
        Embudo de Marketing Claro
      </h2>

      {/* Tabla del Embudo */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#E60000] text-white">
              <th className="p-3 text-left text-xs uppercase tracking-wider">Embudo</th>
              <th className="p-3 text-center text-xs uppercase tracking-wider">Tiempo Promedio</th>
              <th className="p-3 text-center text-xs uppercase tracking-wider">Desktop</th>
              <th className="p-3 text-center text-xs uppercase tracking-wider">Mobile</th>
            </tr>
          </thead>
          <tbody>
            {data.map((stage, index) => {
              const barWidth = (stage.vistas / maxVistas) * 100;
              
              return (
                <tr
                  key={index}
                  onClick={() => openModal(stage.stage)}
                  className="cursor-pointer hover:bg-red-50 transition-colors border-b"
                >
                  <td className="p-4">
                    <div className="font-bold text-[#E60000] text-sm mb-2">
                      {stage.stage}
                    </div>
                    <div
                      className="h-5 rounded-lg"
                      style={{
                        backgroundColor: funnelColors[stage.stage],
                        width: `${barWidth}%`,
                      }}
                    />
                    <div className="text-xs text-gray-600 mt-2">
                      {formatShortNumber(stage.vistas)} vistas
                    </div>
                  </td>
                  <td className="p-4 text-center font-medium text-gray-700">
                    {formatShortNumber(stage.avg_time)}s
                  </td>
                  <td className="p-4 text-center font-medium text-gray-700">
                    {formatShortNumber(stage.desktop_time)}s
                  </td>
                  <td className="p-4 text-center font-medium text-gray-700">
                    {formatShortNumber(stage.mobile_time)}s
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de URLs */}
      {selectedStage && selectedData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#E60000] mb-4 text-center">
              URLs con mayor tiempo de carga – {selectedStage}
            </h3>

            {/* Tabla de URLs */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#E60000] text-white">
                    <th className="p-2 text-left text-xs">URL</th>
                    <th className="p-2 text-center text-xs">%</th>
                    <th className="p-2 text-center text-xs">Promedio</th>
                    <th className="p-2 text-center text-xs">Desktop</th>
                    <th className="p-2 text-center text-xs">Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedData.top_urls.slice(0, visibleUrls).map((url, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm text-gray-700 break-all max-w-md">
                        {url.url}
                      </td>
                      <td className="p-2 text-center text-sm text-gray-700">
                        {url.percentage.toFixed(1)}%
                      </td>
                      <td className="p-2 text-center text-sm text-gray-700">
                        {url.avg_time.toFixed(2)}s
                      </td>
                      <td className="p-2 text-center text-sm text-gray-700">
                        {url.desktop_time.toFixed(2)}s
                      </td>
                      <td className="p-2 text-center text-sm text-gray-700">
                        {url.mobile_time.toFixed(2)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-3">
              {visibleUrls < selectedData.top_urls.length && (
                <button
                  onClick={showMoreUrls}
                  className="bg-[#E60000] text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Ver más
                </button>
              )}
              <button
                onClick={closeModal}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}