import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";

export default function TrafficDetailSummary({
  startDate,
  endDate,
  setStartDate,
  setEndDate
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleRows, setVisibleRows] = useState(15);
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedSourceMedium, setSelectedSourceMedium] = useState("all");

  const exportToExcel = () => {
  const rows = filteredData.map((r) => ({
    "Canal L1": r["Canal L1"],
    "Fuente / Medio": r["Fuente/Medio"],
    Campaña: r["Campaña"],
    Sesiones: r["Sesiones Mig"],
    Compras: r["Artículos comprados"],
    "Tasa de Conversión (%)": r["Tasa de Conversión"]
  }));

  // Fila de totales
  rows.push({
    "Canal L1": "TOTAL",
    "Fuente / Medio": "-",
    Campaña: "-",
    Sesiones: totals.sesiones,
    Compras: totals.compras,
    "Tasa de Conversión (%)": totals.tc.toFixed(2)
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Detalle Tráfico");

  XLSX.writeFile(
    wb,
    `detalle_trafico_${startDate}_a_${endDate}.xlsx`
  );
};

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
  return data.filter((row) => {
    const matchChannel =
      selectedChannel === "all" ||
      row["Canal L1"] === selectedChannel;

    const matchSource =
      selectedSourceMedium === "all" ||
      row["Fuente/Medio"] === selectedSourceMedium;

    return matchChannel && matchSource;
  });
}, [data, selectedChannel, selectedSourceMedium]);



  const totals = useMemo(() => {
  if (!filteredData.length) {
    return {
      sesiones: 0,
      compras: 0,
      tc: 0
    };
  }

  const sesiones = filteredData.reduce(
    (acc, r) => acc + r["Sesiones Mig"],
    0
  );

  const compras = filteredData.reduce(
    (acc, r) => acc + r["Artículos comprados"],
    0
  );

  const tc = sesiones > 0 ? (compras / sesiones) * 100 : 0;

  return { sesiones, compras, tc };
}, [filteredData]);




  // Lista de canales únicos para los botones
  const channelOptions = useMemo(() => {
    const channels = Array.from(new Set(data.map((row) => row["Canal L1"])));
    return ["all", ...channels];
  }, [data]);
const sourceMediumOptions = useMemo(() => {
  let base = data;

  if (selectedChannel !== "all") {
    base = base.filter(
      (row) => row["Canal L1"] === selectedChannel
    );
  }

  const sources = Array.from(
    new Set(base.map((row) => row["Fuente/Medio"]))
  );

  return ["all", ...sources];
}, [data, selectedChannel]);

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
      </div>

      {/* Filtros tipo botones */}
      <div className="flex flex-wrap gap-2">
        {channelOptions.map((ch) => (
          <button
            key={ch}
            onClick={() => {
              setSelectedChannel(ch);
              setSelectedSourceMedium("all");
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

      {/* Filtro Fuente / Medio */}
<div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
  <label className="text-sm font-medium text-gray-600">
    Fuente / Medio
  </label>

  <select
    value={selectedSourceMedium}
    onChange={(e) => {
      setSelectedSourceMedium(e.target.value);
      setVisibleRows(15);
    }}
    className="
      min-w-[240px]
      px-3 py-2
      rounded-lg
      border border-gray-300
      bg-white
      text-sm text-gray-700
      shadow-sm
      focus:outline-none
      focus:ring-2 focus:ring-blue-500
      focus:border-blue-500
      transition
    "
  >
    {sourceMediumOptions.map((src) => (
      <option key={src} value={src}>
        {src === "all" ? "Todas las fuentes / medios" : src}
      </option>
    ))}
  </select>
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

      {/* Totales + Excel */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t">
  <div className="flex gap-8">
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">
        Total Sesiones
      </div>
      <div className="text-2xl font-semibold text-gray-900">
        {totals.sesiones.toLocaleString()}
      </div>
    </div>

    <div>
      <div className="text-xs uppercase tracking-wide text-emerald-600">
        Total Compras
      </div>
      <div className="text-3xl font-bold text-emerald-700">
        {totals.compras.toLocaleString()}
      </div>
    </div>
  </div>

  <button
    onClick={exportToExcel}
    className="
      inline-flex items-center gap-2
      px-5 py-2.5
      rounded-lg
      bg-emerald-600
      text-white text-sm font-medium
      shadow-sm
      hover:bg-emerald-700
      hover:shadow-md
      transition
      focus:outline-none focus:ring-2 focus:ring-emerald-400
    "
  >
    Descargar Excel
  </button>
</div>


    </div>
  );
}
