import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

export default function TrafficChannelSummary({
  startDate,
  endDate,
  setStartDate,
  setEndDate
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [channelType, setChannelType] = useState("all");

  // 🔹 Control de paginación
  const [visibleRows, setVisibleRows] = useState(15);
  const exportToExcel = () => {
  const rows = filteredData.map((r) => ({
    Canal: r.Canal,
    Sesiones: r["Sesiones Mig"],
    Compras: r["Artículos comprados"],
    "Tasa de Conversión (%)": r["Tasa de Conversión"],
    Tipo: r["Tipo de Canal"]
  }));

  // fila de totales
  rows.push({
    Canal: "TOTAL",
    Sesiones: totals.sesiones,
    Compras: totals.compras,
    "Tasa de Conversión (%)": totals.tc.toFixed(2),
    Tipo: "-"
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Canales");

  XLSX.writeFile(
    wb,
    `canales_trafico_${startDate}_a_${endDate}.xlsx`
  );
};

  useEffect(() => {
    setLoading(true);
    fetch(
      `/api/dashboard/traffic-channel-summary/?start_date=${startDate}&end_date=${endDate}`
    )
      .then((res) => res.json())
      .then((json) => {
        setData(json.canales || []);
        setVisibleRows(15); // reset al cambiar fechas
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [startDate, endDate]);

  const filteredData = useMemo(() => {
    if (channelType === "all") return data;
    return data.filter((row) => row["Tipo de Canal"] === channelType);
  }, [data, channelType]);

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



  const visibleData = useMemo(() => {
    return filteredData.slice(0, visibleRows);
  }, [filteredData, visibleRows]);

  if (loading) {
    return (
      <div className="p-6 text-gray-500 animate-pulse">
        Cargando canales de tráfico…
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Canales de Tráfico – Migración
          </h2>
          <p className="text-sm text-gray-500">
            Periodo: {startDate} → {endDate}
          </p>
        </div>

      </div>

      {/* Filtros tipo canal */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "Todos" },
          { key: "principal", label: "Canales L1" },
          { key: "secundario", label: "Canales L2" },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setChannelType(btn.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${
                channelType === btn.key
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Canal</th>
              <th className="px-4 py-3 text-right">Sesiones</th>
              <th className="px-4 py-3 text-right">Compras</th>
              <th className="px-4 py-3 text-right">TC (%)</th>
              <th className="px-4 py-3 text-center">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.map((row, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">
                  {row.Canal}
                </td>
                <td className="px-4 py-2 text-right">
                  {row["Sesiones Mig"].toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">
                  {row["Artículos comprados"].toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">
                  {row["Tasa de Conversión"]}%
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium
                      ${
                        row["Tipo de Canal"] === "principal"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                  >
                    {row["Tipo de Canal"]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

{/* Ver más */}
      {visibleRows < filteredData.length && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleRows((prev) => prev + 5)}
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
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
