import { useMemo, useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function SesionesVsComprasComparacion() {
  /* =========================
     Fechas por defecto
  ========================= */
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const pad = (n) => String(n).padStart(2, "0");

  const currentYear = yesterday.getFullYear();
  const currentMonth = yesterday.getMonth() + 1;
  const currentDay = yesterday.getDate();

  const defaultP2Start = `${currentYear}-${pad(currentMonth)}-01`;
  const defaultP2End = `${currentYear}-${pad(currentMonth)}-${pad(currentDay)}`;

  const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
  const defaultP1Month = `${prevMonthDate.getFullYear()}-${pad(prevMonthDate.getMonth() + 1)}`;

  /* =========================
     Estados
  ========================= */
  const [p1Month, setP1Month] = useState(defaultP1Month);
  const [p2Start, setP2Start] = useState(defaultP2Start);
  const [p2End, setP2End] = useState(defaultP2End);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =========================
     Helpers fechas
  ========================= */
  const daysInMonth = (y, m) => new Date(y, m, 0).getDate();

  const lastDayOfMonth = (dateStr) => {
    const [y, m] = dateStr.split("-").map(Number);
    const last = new Date(y, m, 0);
    return `${y}-${pad(m)}-${pad(last.getDate())}`;
  };

  const getSameDayPrevMonth = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);

  let year = y;
  let month = m - 1;

  if (month === 0) {
    month = 12;
    year -= 1;
  }

  const lastDayPrevMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(d, lastDayPrevMonth);

  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
};


  /* =========================
     Fetch automático inicial
  ========================= */
  useEffect(() => {
    fetchComparison();
    // eslint-disable-next-line
  }, []);

  /* =========================
     Fetch de datos
  ========================= */
  const fetchComparison = async () => {
  setLoading(true);
  setData(null);
  setError(null);

  try {
    const p1Start = `${p1Month}-01`;
    const p1End = getSameDayPrevMonth(p2End);

    const url =
      `/api/dashboard/sesiones-vs-compras-comparacion/` +
      `?p1_start=${p1Start}&p1_end=${p1End}` +
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



const descargarExcel = () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);

  /* =========================
     Helpers
  ========================= */
  const buildPeriodoTable = (keyName) => {
    const header = [
      "Fecha",
      "Sesiones",
      "% Part. Sesiones",
      "Ventas",
      "% Part. Ventas",
      "Conversión %"
    ];

    const body = rowsWithMetrics.map((r) => {
      const d = r[keyName];
      const p = r.participation[keyName];

      return [
        keyName === "p1" ? r.p1Date : r.p2Date,
        d ? d.sessions : "",
        p.sessions !== null ? p.sessions.toFixed(1) : "",
        d ? d.purchases : "",
        p.purchases !== null ? p.purchases.toFixed(1) : "",
        p.conversion !== null ? p.conversion.toFixed(1) : ""
      ];
    });

    return [header, ...body];
  };

  const buildVariacionTable = () => {
    const header = ["Δ Sesiones %", "Δ Ventas %"];

    const body = rowsWithMetrics.map((r) => [
      r.variation.sessions !== null ? r.variation.sessions.toFixed(1) : "",
      r.variation.purchases !== null ? r.variation.purchases.toFixed(1) : ""
    ]);

    return [header, ...body];
  };




  /* =========================
     Construcción layout Excel
  ========================= */
  const p1Table = buildPeriodoTable("p1");
  const varTable = buildVariacionTable();
  const p2Table = buildPeriodoTable("p2");

  const startRow = 0;

  XLSX.utils.sheet_add_aoa(ws, [["Periodo 1"]], { origin: { r: startRow, c: 0 } });
  XLSX.utils.sheet_add_aoa(ws, p1Table, { origin: { r: startRow + 2, c: 0 } });

  XLSX.utils.sheet_add_aoa(ws, [["Variación"]], { origin: { r: startRow, c: 8 } });
  XLSX.utils.sheet_add_aoa(ws, varTable, { origin: { r: startRow + 2, c: 8 } });

  XLSX.utils.sheet_add_aoa(ws, [["Periodo 2"]], { origin: { r: startRow, c: 12 } });
  XLSX.utils.sheet_add_aoa(ws, p2Table, { origin: { r: startRow + 2, c: 12 } });

  XLSX.utils.book_append_sheet(wb, ws, "Comparación");
  XLSX.writeFile(wb, "sesiones_vs_compras.xlsx");
};


  /* =========================
     Procesamiento de filas y métricas
  ========================= */
  const rowsWithMetrics = useMemo(() => {
    if (!data) return [];

    const startDay = Number(p2Start.split("-")[2]);
    const endDay = Number(p2End.split("-")[2]);
    const [y, m] = p1Month.split("-").map(Number);
    const lastDayP1 = daysInMonth(y, m);

    const rows = Array.from({ length: endDay - startDay + 1 }, (_, i) => {
      const day = startDay + i;
      const p1Date = day <= lastDayP1 ? `${p1Month}-${pad(day)}` : null;
      const p2Date = `${p2Start.slice(0, 7)}-${pad(day)}`;

      const p1 = data.periodo_1.find((r) => r.date === p1Date) || null;
      const p2 = data.periodo_2.find((r) => r.date === p2Date) || null;

      let variation = null;
      if (p1 && p2 && p1.purchases > 0) {
        variation = ((p2.purchases - p1.purchases) / p1.purchases) * 100;
      }

      return { day, p1Date, p2Date, p1, p2, variation };
    });

    // Totales y promedios
    const totals = { p1: { sessions: 0, purchases: 0, conversion: 0 }, p2: { sessions: 0, purchases: 0, conversion: 0 } };
    rows.forEach((r) => {
      if (r.p1) {
        totals.p1.sessions += r.p1.sessions;
        totals.p1.purchases += r.p1.purchases;
      }
      if (r.p2) {
        totals.p2.sessions += r.p2.sessions;
        totals.p2.purchases += r.p2.purchases;
      }
    });

    totals.p1.conversion = totals.p1.sessions ? (totals.p1.purchases / totals.p1.sessions) * 100 : 0;
    totals.p2.conversion = totals.p2.sessions ? (totals.p2.purchases / totals.p2.sessions) * 100 : 0;

    // Métricas de participación, conversión y variación
    return rows.map((r) => {
      const participation = {
        p1: {
          sessions: r.p1 && totals.p1.sessions ? (r.p1.sessions / totals.p1.sessions) * 100 : null,
          purchases: r.p1 && totals.p1.purchases ? (r.p1.purchases / totals.p1.purchases) * 100 : null,
          conversion: r.p1 && r.p1.sessions ? (r.p1.purchases / r.p1.sessions) * 100 : null
        },
        p2: {
          sessions: r.p2 && totals.p2.sessions ? (r.p2.sessions / totals.p2.sessions) * 100 : null,
          purchases: r.p2 && totals.p2.purchases ? (r.p2.purchases / totals.p2.purchases) * 100 : null,
          conversion: r.p2 && r.p2.sessions ? (r.p2.purchases / r.p2.sessions) * 100 : null
        }
      };

      const variationMetrics = {
        sessions: r.p1 && r.p2 && r.p1.sessions > 0 ? ((r.p2.sessions - r.p1.sessions) / r.p1.sessions) * 100 : null,
        purchases: r.p1 && r.p2 && r.p1.purchases > 0 ? ((r.p2.purchases - r.p1.purchases) / r.p1.purchases) * 100 : null,
        conversion: r.p1 && r.p2 && r.p1.sessions > 0 ? (((r.p2.purchases/r.p2.sessions)-(r.p1.purchases/r.p1.sessions))/(r.p1.purchases/r.p1.sessions))*100 : null
      };

      return { ...r, participation, variation: variationMetrics, totals };
    });
  }, [data, p1Month, p2Start, p2End]);

  /* =========================
     Render
  ========================= */
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Comparación Sesiones vs Compras</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Periodo 1 (mes)</h4>
            <input
              type="month"
              min="2025-01"
              value={p1Month}
              onChange={(e) => {
                setP1Month(e.target.value);
                setData(null);
              }}
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
                  const start = e.target.value;
                  setP2Start(start);
                  setP2End(lastDayOfMonth(start));
                  setData(null);
                }}
                className="border rounded-lg px-3 py-2 w-full"
              />
              <input
                type="date"
                value={p2End}
                min={p2Start}
                max={lastDayOfMonth(p2Start)}
                onChange={(e) => {
                  setP2End(e.target.value);
                  setData(null);
                }}
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>
          </div>
        </div>

        <button
          onClick={fetchComparison}
          className="mt-6 px-6 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
          disabled={loading}
        >
          {loading ? "Cargando…" : "Comparar"}
        </button>
      </div>

      {error && <div className="text-center py-12 text-red-500">{error}</div>}

      {rowsWithMetrics.length > 0 && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-2 items-start mt-4">
          <PeriodTable title="Periodo 1" keyName="p1" rows={rowsWithMetrics} />
          <VariationTable rows={rowsWithMetrics} />
          <PeriodTable title="Periodo 2" keyName="p2" rows={rowsWithMetrics} />
        </div>
        <button
      onClick={descargarExcel}
      className="mt-6 px-4 py-2 bg-green-600 text-white rounded"
    >
      Descargar Excel
    </button>
  </>
      )}
    </div>
  );
}

/* =========================
   Componentes de tabla con columna de conversión
========================= */
const PeriodTable = ({ title, keyName, rows }) => {
  if (!rows.length) return null;
  
  const totals = rows[0].totals[keyName];

  // Calcular promedios de % Sesiones y % Ventas
  const avgPctSessions = rows.reduce((sum, r) => {
    const p = r.participation[keyName].sessions;
    return sum + (p !== null ? p : 0);
  }, 0) / rows.length;

  const avgPctPurchases = rows.reduce((sum, r) => {
    const p = r.participation[keyName].purchases;
    return sum + (p !== null ? p : 0);
  }, 0) / rows.length;
const WEEKDAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const getWeekdayES = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return WEEKDAYS_ES[d.getDay()];
};

const getColombiaHolidays = (year) => {
  const fixed = [
    `${year}-01-01`,
    `${year}-05-01`,
    `${year}-07-20`,
    `${year}-08-07`,
    `${year}-12-08`,
    `${year}-12-25`,
  ];

  const emiliani = [
    `${year}-01-06`,
    `${year}-03-19`,
    `${year}-06-29`,
    `${year}-08-15`,
    `${year}-10-12`,
    `${year}-11-01`,
    `${year}-11-11`,
  ];

  const moveToMonday = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    if (day === 1) return dateStr;
    const diff = (8 - day) % 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  };

  return new Set([
    ...fixed,
    ...emiliani.map(moveToMonday),
  ]);
};

const isHolidayCO = (dateStr) => {
  if (!dateStr) return false;
  const year = Number(dateStr.slice(0, 4));
  return getColombiaHolidays(year).has(dateStr);
};

  return (
    <div className="bg-white rounded-xl shadow p-4 w-full">
      <div className="h-auto flex flex-col items-center justify-center mb-3 leading-tight">
  <h3 className="text-sm font-semibold text-center">{title}</h3>
  <p className="text-[11px] text-gray-500 text-center">
    {keyName === "p1"
      ? `${rows[0].p1Date} → ${rows[rows.length - 1].p1Date}`
      : `${rows[0].p2Date} → ${rows[rows.length - 1].p2Date}`}
  </p>
</div>

      <table className="w-full text-xs border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Fecha</th>
            <th className="p-2 text-right">Sesiones</th>
            <th className="p-2 text-right">
              <span className="block">% Particip.</span>
              <span className="block text-xs">Sesiones</span>
            </th>
            <th className="p-2 text-right">Ventas</th>
            <th className="p-2 text-right">
              <span className="block">% Particip.</span>
              <span className="block text-xs">Ventas</span>
            </th>
            <th className="p-2 text-right">Conversión %</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => {
            const d = r[keyName];
            const p = r.participation[keyName];
            const date =
  keyName === "p1"
    ? r.p1Date
    : r.p2Date;

            return (
              <tr key={i} className={`border-t h-9 ${
                  isHolidayCO(date) ? "bg-red-50" : ""
                }`}>
                <td className="px-2 text-xs">
                  {date
                    ? `${date} / ${getWeekdayES(date)}`
                    : "—"}
                </td>
                <td className="px-2 text-right">{d ? d.sessions : "—"}</td>
                <td className="px-2 text-right text-gray-500">{p.sessions !== null ? `${p.sessions.toFixed(1)}%` : "—"}</td>
                <td className="px-2 text-right">{d ? d.purchases : "—"}</td>
                <td className="px-2 text-right text-gray-500">{p.purchases !== null ? `${p.purchases.toFixed(1)}%` : "—"}</td>
                <td className="px-2 text-right text-gray-700">{p.conversion !== null ? `${p.conversion.toFixed(1)}%` : "—"}</td>
              </tr>
            );
          })}

          {/* Totales / Promedios */}
          <tr className="font-semibold border-t bg-gray-50">
            <td className="px-2">TOTAL / PROMEDIO</td>
            <td className="px-2 text-right">{totals.sessions}</td>
            <td className="px-2 text-right">{avgPctSessions.toFixed(1)}%</td>
            <td className="px-2 text-right">{totals.purchases}</td>
            <td className="px-2 text-right">{avgPctPurchases.toFixed(1)}%</td>
            <td className="px-2 text-right">{totals.conversion.toFixed(1)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};


const VariationTable = ({ rows }) => {
  if (!rows.length) return null;
  return (
    <div className="bg-white rounded-xl shadow p-4 w-full">
      <div className="h-10 flex items-center justify-center mb-3">
        <h3 className="text-sm font-semibold text-center">Variación diaria</h3>
      </div>

      <table className="text-[11px] border border-gray-200 w-auto">
        <thead className="bg-gray-100">
          <tr className="h-12">
            <th className="px-2 h-12 text-right align-middle leading-tight">Δ Sesiones %</th>
            <th className="px-2 h-12 text-right align-middle leading-tight">Δ Ventas %</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t h-9">
              <td className={`px-2 h-9 text-right font-medium ${r.variation.sessions >= 0 ? "text-green-600" : "text-red-600"}`}>
                {r.variation.sessions !== null ? `${r.variation.sessions.toFixed(1)}%` : "—"}
              </td>
              <td className={`px-2 h-9 text-right font-medium ${r.variation.purchases >= 0 ? "text-green-600" : "text-red-600"}`}>
                {r.variation.purchases !== null ? `${r.variation.purchases.toFixed(1)}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
