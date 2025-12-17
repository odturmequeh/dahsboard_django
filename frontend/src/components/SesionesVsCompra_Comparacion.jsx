import { useMemo, useState } from "react";

export default function SesionesVsComprasComparacion() {
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
const [p2Start, setP2Start] = useState(defaultP2Start);
const [p2End, setP2End] = useState(defaultP2End);
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

  /* =========================
     Tabla
  ========================= */
  const Table = ({ title, keyName, showVariation }) => (
    <div className="bg-white rounded-xl shadow p-6 w-full">
      <h3 className="text-lg font-semibold mb-4 text-center">
        {title}
      </h3>

      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Fecha</th>
            <th className="p-2 text-right">Sesiones</th>
            <th className="p-2 text-right">Compras</th>
            {showVariation && (
              <th className="p-2 text-right">Δ Compras</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const d = r[keyName];
            return (
              <tr
                key={i}
                className={`border-t ${
                  !d ? "bg-gray-50 text-gray-400" : ""
                }`}
              >
                <td className="p-2">
                  {keyName === "p1"
                    ? r.p1Date || "—"
                    : r.p2Date}
                </td>
                <td className="p-2 text-right">
                  {d ? d.sessions.toLocaleString() : "—"}
                </td>
                <td className="p-2 text-right">
                  {d ? d.purchases.toLocaleString() : "—"}
                </td>

                {showVariation && (
                  <td
                    className={`p-2 text-right font-medium ${
                      r.variation === null
                        ? "text-gray-400"
                        : r.variation >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {r.variation === null
                      ? "—"
                      : `${r.variation.toFixed(1)}%`}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

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

      {rows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Table title="Periodo 1" keyName="p1" />
          <Table
            title="Periodo 2"
            keyName="p2"
            showVariation
          />
        </div>
      )}
    </div>
  );
}
