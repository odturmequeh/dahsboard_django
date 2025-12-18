import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

export default function SesionesVsComprasComparacion({
  p2Start,
  p2End,
  setP2Start,
  setP2End
}) {
  /* =========================
     Estados fechas
  ========================= */
  const today = new Date();

/* =========================
   Periodo 2 (mes actual)
========================= */
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1; // 1–12
const currentDay = today.getDate();

const pad = (n) => String(n).padStart(2, "0");

const defaultP2Start = `${currentYear}-${pad(currentMonth)}-01`;
const defaultP2End = `${currentYear}-${pad(currentMonth)}-${pad(currentDay)}`;

/* =========================
   Periodo 1 (mes anterior)
========================= */
const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
const prevYear = prevMonthDate.getFullYear();
const prevMonth = prevMonthDate.getMonth() + 1;

const defaultP1Month = `${prevYear}-${pad(prevMonth)}`;

/* =========================
   Estados
========================= */
const [p1Month, setP1Month] = useState(defaultP1Month);
  /* =========================
     Estados data
  ========================= */
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =========================
     Helpers fechas
  ========================= */
  const daysInMonth = (y, m) => new Date(y, m, 0).getDate();

  const sameMonth = (a, b) => a.slice(0, 7) === b.slice(0, 7);

const lastDayOfMonth = (dateStr) => {
  const [y, m] = dateStr.split("-").map(Number);
  const last = new Date(y, m, 0);
  return `${y}-${String(m).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
};

  /* =========================
     Fetch
  ========================= */
  const fetchComparison = async () => {
    setLoading(true);
    setError(null);

    const [y, m] = p1Month.split("-");
    const lastDayP1 = daysInMonth(y, m);

    try {
      const url =
        `/api/dashboard/sesiones-vs-compras-comparacion/` +
        `?p1_start=${p1Month}-01&p1_end=${p1Month}-${lastDayP1}` +
        `&p2_start=${p2Start}&p2_end=${p2End}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Error consultando GA4");

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Normalización por días
  ========================= */
  const rows = useMemo(() => {
  if (!data) return [];

  const startDay = Number(p2Start.split("-")[2]);
  const endDay = Number(p2End.split("-")[2]);

  const [y, m] = p1Month.split("-").map(Number);
  const lastDayP1 = daysInMonth(y, m);

  return Array.from(
    { length: endDay - startDay + 1 },
    (_, i) => {
      const day = startDay + i;

      const p1Date =
        day <= lastDayP1
          ? `${p1Month}-${String(day).padStart(2, "0")}`
          : null;

      const p2Date = `${p2Start.slice(0, 7)}-${String(day).padStart(2, "0")}`;

      const p1 = data.periodo_1.find((r) => r.date === p1Date) || null;
      const p2 = data.periodo_2.find((r) => r.date === p2Date) || null;

      let variation = null;
      if (p1 && p2 && p1.purchases > 0) {
        variation =
          ((p2.purchases - p1.purchases) / p1.purchases) * 100;
      }

      return {
        day,
        p1Date,
        p2Date,
        p1,
        p2,
        variation,
      };
    }
  );
}, [data, p1Month, p2Start, p2End]);
  
const totals = useMemo(() => {
  let p1Sessions = 0;
  let p1Purchases = 0;
  let p2Sessions = 0;
  let p2Purchases = 0;

  rows.forEach((r) => {
    if (r.p1) {
      p1Sessions += r.p1.sessions;
      p1Purchases += r.p1.purchases;
    }
    if (r.p2) {
      p2Sessions += r.p2.sessions;
      p2Purchases += r.p2.purchases;
    }
  });

  return {
    p1: { sessions: p1Sessions, purchases: p1Purchases },
    p2: { sessions: p2Sessions, purchases: p2Purchases },
  };
}, [rows]);

const rowsWithMetrics = useMemo(() => {
  if (!rows.length) return [];

  return rows.map((r) => {
    const variationSessions =
      r.p1 && r.p2 && r.p1.sessions > 0
        ? ((r.p2.sessions - r.p1.sessions) / r.p1.sessions) * 100
        : null;

    const variationPurchases =
      r.p1 && r.p2 && r.p1.purchases > 0
        ? ((r.p2.purchases - r.p1.purchases) / r.p1.purchases) * 100
        : null;

    return {
      ...r,
      participation: {
        p1: {
          sessions:
            r.p1 && totals.p1.sessions > 0
              ? (r.p1.sessions / totals.p1.sessions) * 100
              : null,
          purchases:
            r.p1 && totals.p1.purchases > 0
              ? (r.p1.purchases / totals.p1.purchases) * 100
              : null,
        },
        p2: {
          sessions:
            r.p2 && totals.p2.sessions > 0
              ? (r.p2.sessions / totals.p2.sessions) * 100
              : null,
          purchases:
            r.p2 && totals.p2.purchases > 0
              ? (r.p2.purchases / totals.p2.purchases) * 100
              : null,
        },
      },
      variation: {
        sessions: variationSessions,
        purchases: variationPurchases,
      },
    };
  });
}, [rows, totals]);

  /* =========================
     Tabla
  ========================= */
  const exportToExcel = (keyName) => {
  const sheetData = rows.map((r) => {
    const d = r[keyName];
    return {
      Fecha: keyName === "p1" ? r.p1Date : r.p2Date,
      Sesiones: d ? d.sessions : 0,
      Compras: d ? d.purchases : 0,
      ...(keyName === "p2" && {
        "Variación %":
          r.variation !== null ? Number(r.variation.toFixed(1)) : null,
      }),
    };
  });

  // fila TOTAL
  sheetData.push({
    Fecha: "TOTAL",
    Sesiones: totals[keyName].sessions,
    Compras: totals[keyName].purchases,
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    keyName === "p1" ? "Periodo 1" : "Periodo 2"
  );

  XLSX.writeFile(
    workbook,
    `sesiones_vs_compras_${keyName}_${p2Start}_a_${p2End}.xlsx`
  );
};

const SummaryVariationTable = () => {
  const sessionsVariation =
    totals.p1.sessions > 0
      ? ((totals.p2.sessions - totals.p1.sessions) / totals.p1.sessions) * 100
      : null;

  const purchasesVariation =
    totals.p1.purchases > 0
      ? ((totals.p2.purchases - totals.p1.purchases) / totals.p1.purchases) * 100
      : null;

  return (
    <div className="bg-white rounded-xl shadow p-4 w-full max-w-md mx-auto">
      <h4 className="text-sm font-semibold mb-3 text-center">
        Variación Total
      </h4>

      <table className="w-full text-sm border">
        <tbody>
          <tr className="border-t">
            <td className="p-2">Sesiones</td>
            <td
              className={`p-2 text-right font-medium ${
                sessionsVariation >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {sessionsVariation !== null
                ? `${sessionsVariation.toFixed(1)}%`
                : "—"}
            </td>
          </tr>

          <tr className="border-t">
            <td className="p-2">Compras</td>
            <td
              className={`p-2 text-right font-medium ${
                purchasesVariation >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {purchasesVariation !== null
                ? `${purchasesVariation.toFixed(1)}%`
                : "—"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};



const PeriodTable = ({ title, keyName }) => (
  <div className="bg-white rounded-xl shadow p-4 w-full">
    <div className="h-10 flex items-center justify-center mb-3">
      <h3 className="text-sm font-semibold text-center">{title}</h3>
    </div>

    <table className="w-full text-xs border">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Fecha</th>
          <th className="p-2 text-right">Sesiones</th>
          <th className="p-2 text-right leading-tight">
            <span className="block">% Participación Sesiones</span>
            <span className="block text-xs">
              en Periodo Selec.
            </span>
          </th>
          <th className="p-2 text-right">Ventas</th>
          <th className="p-2 text-right leading-tight">
            <span className="block">% Participación Ventas</span>
            <span className="block text-xs">
              en Periodo Selec.
            </span>
          </th>
        </tr>
      </thead>

      <tbody>
        {rowsWithMetrics.map((r, i) => {
          const d = r[keyName];
          const p = r.participation[keyName];

          return (
            <tr key={i} className="border-t h-9">
  <td className="px-2 h-9 align-middle">
    {keyName === "p1" ? r.p1Date || "—" : r.p2Date}
  </td>

  <td className="px-2 h-9 text-right align-middle">
    {d ? d.sessions.toLocaleString() : "—"}
  </td>

  <td className="px-2 h-9 text-right text-gray-500 align-middle">
    {p.sessions !== null ? `${p.sessions.toFixed(1)}%` : "—"}
  </td>

  <td className="px-2 h-9 text-right align-middle">
    {d ? d.purchases.toLocaleString() : "—"}
  </td>

  <td className="px-2 h-9 text-right text-gray-500 align-middle">
    {p.purchases !== null ? `${p.purchases.toFixed(1)}%` : "—"}
  </td>
</tr>

          );
        })}
      </tbody>
    </table>
  </div>
);
const VariationTable = () => (
  <div className="bg-white rounded-xl shadow p-4 w-full">
    <div className="h-10 flex items-center justify-center mb-3">
      <h3 className="text-sm font-semibold text-center">
        Variación diaria
      </h3>
    </div>

    <table className="text-[11px] border border-gray-200 w-auto">
      <thead className="bg-gray-100">
  <tr className="h-12">
    <th className="px-2 h-12 text-right align-middle leading-tight">
      <span className="block text-xs">Δ</span>
      <span className="block text-[10px] text-gray-500">
        Sesiones
      </span>
    </th>

    <th className="px-2 h-12 text-right align-middle leading-tight">
      <span className="block text-xs">Δ</span>
      <span className="block text-[10px] text-gray-500">
        Compras
      </span>
    </th>
  </tr>
</thead>

      <tbody>
        {rowsWithMetrics.map((r, i) => (
          <tr key={i} className="border-t h-9">
  <td
    className={`px-2 h-9 text-right align-middle font-medium ${
      r.variation.sessions >= 0
        ? "text-green-600"
        : "text-red-600"
    }`}
  >
    {r.variation.sessions !== null
      ? `${r.variation.sessions.toFixed(1)}%`
      : "—"}
  </td>

  <td
    className={`px-2 h-9 text-right align-middle font-medium ${
      r.variation.purchases >= 0
        ? "text-green-600"
        : "text-red-600"
    }`}
  >
    {r.variation.purchases !== null
      ? `${r.variation.purchases.toFixed(1)}%`
      : "—"}
  </td>
</tr>

        ))}
      </tbody>
    </table>
  </div>
);

const buildPeriodoTable = (title, rows, totals, participationKey) => {
  const aoa = [];

  aoa.push([title]);
  aoa.push([]);

  aoa.push([
    "Fecha",
    "Sesiones",
    "% Part. Sesiones",
    "Compras",
    "% Part. Compras",
  ]);

  rows.forEach((r) => {
    aoa.push([
      participationKey === "p1" ? r.p1Date : r.p2Date,
      r[participationKey]?.sessions ?? 0,
      r.participation[participationKey].sessions !== null
        ? Number(r.participation[participationKey].sessions.toFixed(2))
        : null,
      r[participationKey]?.purchases ?? 0,
      r.participation[participationKey].purchases !== null
        ? Number(r.participation[participationKey].purchases.toFixed(2))
        : null,
    ]);
  });

  aoa.push([
    "TOTAL",
    totals.sessions,
    100,
    totals.purchases,
    100,
  ]);

  return aoa;
};

const buildVariationTable = (rows) => {
  const aoa = [];

  aoa.push(["VARIACIÓN DIARIA (%)"]);
  aoa.push([]);

  aoa.push(["Fecha", "Δ Sesiones %", "Δ Compras %"]);

  rows.forEach((r) => {
    aoa.push([
      r.p2Date || r.p1Date || "—",
      r.variation.sessions !== null
        ? Number(r.variation.sessions.toFixed(2))
        : null,
      r.variation.purchases !== null
        ? Number(r.variation.purchases.toFixed(2))
        : null,
    ]);
  });

  return aoa;
};


const exportFullReportSingleSheet = () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);

  // PERIODO 1 → A1
  XLSX.utils.sheet_add_aoa(
    ws,
    buildPeriodoTable(
      "PERIODO 1",
      rowsWithMetrics,
      totals.p1,
      "p1"
    ),
    { origin: "A1" }
  );

  // VARIACIÓN → G1
  XLSX.utils.sheet_add_aoa(
    ws,
    buildVariationTable(rowsWithMetrics),
    { origin: "G1" }
  );

  // PERIODO 2 → K1
  XLSX.utils.sheet_add_aoa(
    ws,
    buildPeriodoTable(
      "PERIODO 2",
      rowsWithMetrics,
      totals.p2,
      "p2"
    ),
    { origin: "K1" }
  );

  XLSX.utils.book_append_sheet(wb, ws, "Informe");

  XLSX.writeFile(
    wb,
    `informe_sesiones_vs_compras_${p2Start}_a_${p2End}.xlsx`
  );
};




  /* =========================
     Render
  ========================= */
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Comparación Sesiones vs Compras
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Periodo 1 (mes)</h4>
            <input
              type="month"
              min="2025-01"
              value={p1Month}
              onChange={(e) => setP1Month(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Periodo 2</h4>
            <div className="flex gap-3">
              <input
  type="date"
  value={p2Start}
  onChange={(e) => {
    const newStart = e.target.value;

    // 🔒 fuerza el end al último día del mes seleccionado
    const forcedEnd = lastDayOfMonth(newStart);

    setP2Start(newStart);
    setP2End(forcedEnd);
  }}
  className="border rounded-lg px-3 py-2 w-full"
/>
              <input
  type="date"
  value={p2End}
  min={p2Start}
  max={lastDayOfMonth(p2Start)}
  onChange={(e) => setP2End(e.target.value)}
  className="border rounded-lg px-3 py-2 w-full"
/>
            </div>
          </div>
        </div>

        <button
          onClick={fetchComparison}
          className="mt-6 px-6 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
        >
          Comparar
        </button>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">
          Consultando GA4…
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">
          {error}
        </div>
      )}

      {rowsWithMetrics.length > 0 && (
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-2 items-start">
    <PeriodTable title="Periodo 1" keyName="p1" />
    <VariationTable />
    <PeriodTable title="Periodo 2" keyName="p2" />
    <div className="flex justify-end mt-6">
    <button
      onClick={exportFullReportSingleSheet}
      className="
        px-6 py-2.5
        rounded-lg
        bg-emerald-600
        text-white text-sm font-medium
        hover:bg-emerald-700
        transition
      "
    >
      Descargar Excel
    </button>
  </div>
  </div>
  
  
)}
    </div>
  );
}
