import { useState, useMemo, useEffect } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* =========================
   Config embudo + colores
========================= */
const FUNNEL_CONFIG = [
  { key: "Visualización de planes", label: "Visualización de planes", color: "#2563EB" },
  { key: "Clic en comprar", label: "Clic en comprar", color: "#16A34A" },
  { key: "Datos personales", label: "Datos personales", color: "#EA580C" },
  { key: "Aceptación T&C", label: "Aceptación T&C", color: "#7C3AED" },
  { key: "Botón continuar", label: "Botón continuar", color: "#DC2626" },
  { key: "Resumen de compra", label: "Resumen de compra", color: "#374151" },
];

const ALERT_COLORS = [
  "#2563EB",
  "#16A34A",
  "#EA580C",
  "#7C3AED",
  "#DC2626",
  "#0891B2",
  "#6B7280",
];

export default function EmbudoMigra() {
  /* =========================
     Estados
  ========================= */

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const pad = (n) => String(n).padStart(2, "0");

  const defaultStartDate = `${today.getFullYear()}-${pad(
    today.getMonth() + 1
  )}-01`; // primer día del mes
  const defaultEndDate = `${yesterday.getFullYear()}-${pad(
    yesterday.getMonth() + 1
  )}-${pad(yesterday.getDate())}`; // ayer

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const [activeSteps, setActiveSteps] = useState(["ALL"]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [alertsData, setAlertsData] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  /* =========================
     Fetch embudo
  ========================= */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard/embudo_migra/?start_date=${startDate}&end_date=${endDate}`
        );
        const data = await res.json();
        setChartData(data.series || []);
      } catch (err) {
        console.error("Error GA4 embudo:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  /* =========================
     Fetch alertas (2° piso)
  ========================= */

const getPreviousMonthSameRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const prevStart = new Date(startDate);
  prevStart.setMonth(prevStart.getMonth() - 1);

  const prevEnd = new Date(endDate);
  prevEnd.setMonth(prevEnd.getMonth() - 1);

  return {
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10),
    month: prevStart.toISOString().slice(0, 7), // YYYY-MM
  };
};


  const defaultCompare = getPreviousMonthSameRange(
  defaultStartDate,
  defaultEndDate
);


  const [alertsCompareData, setAlertsCompareData] = useState([]);
  const [alertsCompareLoading, setAlertsCompareLoading] = useState(false);

const subtractOneMonthSafe = (date) => {
  const d = new Date(date);

  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  // último día real del mes anterior
  const lastDayPrevMonth = new Date(year, month, 0).getDate();

  const safeDay = Math.min(day, lastDayPrevMonth);

  return new Date(year, month - 1, safeDay);
};
const subtractOneMonthString = (dateStr) => {
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
const getPreviousMonthString = (dateStr) => {
  const [y, m] = dateStr.split("-").map(Number);

  let year = y;
  let month = m - 1;

  if (month === 0) {
    month = 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
};

const [compareMonth, setCompareMonth] = useState(
  getPreviousMonthString(startDate)
);
  useEffect(() => {
    const fetchAlerts = async () => {
      setAlertsLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard/ga4_migracion_view_alert/?start_date=${startDate}&end_date=${endDate}`
        );
        const data = await res.json();
        setAlertsData(data.alerts || []);
      } catch (err) {
        console.error("Error GA4 alertas:", err);
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchAlerts();
  }, [startDate, endDate]);

useEffect(() => {
  if (!compareMonth) return;

  const fetchCompareAlerts = async () => {
    setAlertsCompareLoading(true);

    const start = subtractOneMonthString(startDate);
    const end = subtractOneMonthString(endDate);

    try {
      const res = await fetch(
        `/api/dashboard/ga4_migracion_view_alert/?start_date=${start}&end_date=${end}`
      );
      const data = await res.json();
      setAlertsCompareData(data.alerts || []);
    } catch (err) {
      console.error("Error comparación alertas:", err);
    } finally {
      setAlertsCompareLoading(false);
    }
  };

  fetchCompareAlerts();
}, [startDate, endDate, compareMonth]);


const alertsCompareMap = useMemo(() => {
  const map = {};
  alertsCompareData.forEach((a) => {
    map[a.alert_name] = a;
  });
  return map;
}, [alertsCompareData]);

const totalActual = useMemo(
  () => alertsData.reduce((a, b) => a + b.cantidad, 0),
  [alertsData]
);

const totalCompare = useMemo(
  () => alertsCompareData.reduce((a, b) => a + b.cantidad, 0),
  [alertsCompareData]
);
  /* =========================
     Tabla embudo
  ========================= */
  const funnelData = useMemo(() => {
    return FUNNEL_CONFIG.map((step) => ({
      step: step.label,
      value: chartData.reduce(
        (acc, row) => acc + (row[step.key] || 0),
        0
      ),
    }));
  }, [chartData]);

  const funnelWithMetrics = useMemo(() => {
    return funnelData.map((item, index) => {
      if (index === 0) return item;

      const prev = funnelData[index - 1].value;
      const retentionPct = prev ? (item.value / prev) * 100 : 0;

      return {
        ...item,
        retentionPct,
        lossPct: 100 - retentionPct,
      };
    });
  }, [funnelData]);

  /* =========================
     Chips logic
  ========================= */
  const toggleStep = (step) => {
    if (step === "ALL") return setActiveSteps(["ALL"]);

    let updated = activeSteps.includes(step)
      ? activeSteps.filter((s) => s !== step)
      : [...activeSteps.filter((s) => s !== "ALL"), step];

    if (updated.length === 0) updated = ["ALL"];
    setActiveSteps(updated);
  };

  const stepsToRender = activeSteps.includes("ALL")
    ? FUNNEL_CONFIG
    : FUNNEL_CONFIG.filter((s) => activeSteps.includes(s.key));

  /* =========================
     Render
  ========================= */
  return (
    <div className="space-y-8">

      {/* 🎛️ Fechas */}
      <div className="flex gap-4">
        <div>
          <label className="text-sm font-medium">Inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* 🧱 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 🧮 Columna izquierda */}
        <div className="space-y-6 lg:col-span-1">

          {/* Tabla embudo */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Embudo de ventas – migración
            </h2>

            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Paso</th>
                  <th className="p-2 text-right">Sesiones</th>
                  <th className="p-2 text-right">Retención %</th>
                </tr>
              </thead>
              <tbody>
                {funnelWithMetrics.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{row.step}</td>
                    <td className="p-2 text-right">
                      {row.value.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      {row.retentionPct
                        ? `${row.retentionPct.toFixed(2)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


<div className="flex flex-col lg:flex-row items-start gap-8">
</div>


        </div>



        {/* 📈 Gráfica líneas */}
        <div className="bg-white rounded-xl shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">
            Sesiones por fecha
          </h2>

          {/* 🎛️ Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => toggleStep("ALL")}
              className={`px-3 py-1.5 rounded-full text-sm border
                ${activeSteps.includes("ALL")
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 border-gray-300"}`}
            >
              Todos
            </button>

            {FUNNEL_CONFIG.map((step) => {
              const active = activeSteps.includes(step.key);
              return (
                <button
                  key={step.key}
                  onClick={() => toggleStep(step.key)}
                  style={{
                    backgroundColor: active ? step.color : "#FFF",
                    borderColor: step.color,
                    color: active ? "#FFF" : step.color,
                  }}
                  className="px-3 py-1.5 rounded-full text-sm border transition"
                >
                  {step.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">
              Cargando datos GA4…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {stepsToRender.map((step) => (
                  <Line
                    key={step.key}
                    type="monotone"
                    dataKey={step.key}
                    stroke={step.color}
                    strokeWidth={2.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      {/* =========================
   🟠 Alertas – sección independiente
========================= */}

<div className="flex justify-center gap-4 mb-6">
  <label className="text-sm font-medium text-gray-600">
    Comparar con:
  </label>

  <input
    type="month"
    min="2025-01"
    value={compareMonth}
    onChange={(e) => setCompareMonth(e.target.value)}
    className="border rounded-lg px-3 py-2 text-sm"
  />
</div>



<div className="w-full flex justify-center mt-12">
  <div className="w-full max-w-6xl">
    <div className="bg-white rounded-2xl shadow p-10">
      <h2 className="text-xl font-semibold mb-8 text-center">
        Alertas vistas (migración)
      </h2>

      {alertsLoading ? (
        <div className="text-center py-24 text-gray-400">
          Cargando alertas…
        </div>
      ) : alertsData.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          No hay datos
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* 🟠 Gráfica */}
          <div className="w-full h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertsData}
                  dataKey="cantidad"
                  nameKey="alert_name"
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={150}
                  paddingAngle={4}
                  labelLine={false}
                  label={({ percent }) =>
                    `${(percent * 100).toFixed(1)}%`
                  }
                >
                  {alertsData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={ALERT_COLORS[index % ALERT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 📋 Leyenda */}
          
<div className="space-y-3 max-h-[420px] overflow-y-auto pr-4">
<div className="flex text-xs font-semibold text-gray-500 border-b pb-3 mb-3">
  <div className="flex-1">Totales</div>

  <div className="w-20 text-right">
    <div>Total Actual</div>
    <div className="text-gray-800 font-bold">
      {totalActual.toLocaleString()}
    </div>
  </div>

  <div className="w-24 text-right">
    <div>Total {compareMonth}</div>
    <div className="text-gray-800 font-bold">
      {alertsCompareLoading
        ? "—"
        : totalCompare.toLocaleString()}
    </div>
  </div>
</div>

  <div className="flex text-xs font-semibold text-gray-500 border-b pb-2">
    <div className="flex-1">Alerta</div>
    <div className="w-20 text-right">Actual</div>
    <div className="w-24 text-right">
      {compareMonth || "Comparación"}
    </div>
  </div>

  {alertsData.map((alert, index) => {
    const compare = alertsCompareMap[alert.alert_name];
    const diff =
      compare ? alert.cantidad - compare.cantidad : null;

    return (
      <div
        key={index}
        className="flex items-center gap-3 text-sm"
      >
        <div
          className="w-3 h-3 rounded-sm"
          style={{
            backgroundColor:
              ALERT_COLORS[index % ALERT_COLORS.length],
          }}
        />

        <div className="flex-1 text-gray-700">
          {alert.alert_name}
        </div>

        <div className="w-20 text-right">
          {alert.cantidad.toLocaleString()}
        </div>

        <div
          className={`w-24 text-right ${
            diff > 0
              ? "text-red-600"
              : diff < 0
              ? "text-green-600"
              : "text-gray-400"
          }`}
        >
          {compare
            ? compare.cantidad.toLocaleString()
            : "—"}
        </div>
      </div>
    );
  })}
</div>


        </div>
      )}
    </div>
  </div>
</div>

    </div>
  );
}
