import React, { useEffect, useMemo, useState } from "react";

import * as XLSX from "xlsx";

/* =========================
   Constantes de layout
========================= */
const ROW_CLASS = "h-10 align-middle";

/* =========================
   Helpers fechas
========================= */
const pad = (n) => String(n).padStart(2, "0");

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

/* =========================
   Periodo 2 (mes actual)
========================= */
const currentYear = yesterday.getFullYear();
const currentMonth = yesterday.getMonth() + 1;
const currentDay = yesterday.getDate();

const defaultP2Start = `${currentYear}-${pad(currentMonth)}-01`;
const defaultP2End = `${currentYear}-${pad(currentMonth)}-${pad(currentDay)}`;

/* =========================
   Periodo 1 (mes anterior)
========================= */
const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
const prevYear = prevMonthDate.getFullYear();
const prevMonth = prevMonthDate.getMonth() + 1;
const defaultP1Month = `${prevYear}-${pad(prevMonth)}`;

const lastDayOfMonth = (dateStr) => {
  const [y, m] = dateStr.split("-").map(Number);
  const last = new Date(y, m, 0);
  return `${y}-${pad(m)}-${pad(last.getDate())}`;
};

const buildAlignedPeriod1Dates = (p1Month, p2Start, p2End) => {
  const [y, m] = p1Month.split("-").map(Number);

  const p2StartDate = new Date(p2Start);
  const p2EndDate = new Date(p2End);

  // días inclusivos del periodo 2
  const diffDays =
    Math.floor(
      (p2EndDate - p2StartDate) / (1000 * 60 * 60 * 24)
    ) + 1;

  const lastDayPrevMonth = new Date(y, m, 0).getDate();
  const safeEndDay = Math.min(diffDays, lastDayPrevMonth);

  return {
    start: `${y}-${pad(m)}-01`,
    end: `${y}-${pad(m)}-${pad(safeEndDay)}`,
  };
};








/* =========================
   Componente principal
========================= */
export default function ComparacionSubcanalesGA4() {
  const [p1Month, setP1Month] = useState(defaultP1Month);
  const [p2Start, setP2Start] = useState(defaultP2Start);
  const [p2End, setP2End] = useState(defaultP2End);

  const [periodo1, setPeriodo1] = useState([]);
  const [periodo2, setPeriodo2] = useState([]);

  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  /* =========================
     Fetch automático
  ========================= */
  useEffect(() => {
    fetchComparacion();
    // eslint-disable-next-line
  }, []);

  const fetchComparacion = async () => {
    setLoading(true);
    setDataReady(false);

    const p1 = buildAlignedPeriod1Dates(
        p1Month,
        p2Start,
        p2End
        );

    const res = await fetch(
      `/api/dashboard/ga4_subcanal_owned_view/` +
        `?period_1_start=${p1.start}` +
        `&period_1_end=${p1.end}` +
        `&period_2_start=${p2Start}` +
        `&period_2_end=${p2End}`
    );

    const json = await res.json();

    setPeriodo1(json.periodo_1.datos);
    setPeriodo2(json.periodo_2.datos);

    setLoading(false);
    setDataReady(true);
  };

  /* =========================
     Cálculos tablas
  ========================= */
  const calcularTabla = (data) => {
    const totalSesiones = data.reduce((a, b) => a + b.sesiones, 0);
    const totalVentas = data.reduce((a, b) => a + b.ventas, 0);

    const filas = data.map((r) => {
      const pctSesiones = totalSesiones ? r.sesiones / totalSesiones : 0;
      const pctVentas = totalVentas ? r.ventas / totalVentas : 0;
      const conversionRate = r.sesiones ? r.ventas / r.sesiones : 0;

      return {
        ...r,
        pctSesiones,
        pctVentas,
        conversionRate,
      };
    });

    return {
      filas,
      totalSesiones,
      totalVentas,
      avgPctSesiones:
        filas.reduce((a, b) => a + b.pctSesiones, 0) / filas.length || 0,
      avgPctVentas:
        filas.reduce((a, b) => a + b.pctVentas, 0) / filas.length || 0,
      avgConversion:
        filas.reduce((a, b) => a + b.conversionRate, 0) / filas.length || 0,
    };
  };

  const t1 = useMemo(() => calcularTabla(periodo1), [periodo1]);
  const t2 = useMemo(() => calcularTabla(periodo2), [periodo2]);

  const variacion = useMemo(() => {
    const map2 = Object.fromEntries(
      periodo2.map((r) => [r.subcanal, r])
    );

    return periodo1.map((r1) => {
      const r2 = map2[r1.subcanal] || { sesiones: 0, ventas: 0 };
      return {
        subcanal: r1.subcanal,
        sesionesVar: r2.sesiones - r1.sesiones,
        ventasVar: r2.ventas - r1.ventas,
      };
    });
  }, [periodo1, periodo2]);

  /* =========================
     Excel
  ========================= */
  const descargarExcel = () => {
  const wb = XLSX.utils.book_new();

  // Hoja vacía
  const ws = XLSX.utils.aoa_to_sheet([]);

  /* =========================
     Helpers
  ========================= */
  const buildTableFromFilas = (filas) => {
    if (!filas?.length) return [];

    const headers = Object.keys(filas[0]);
    const body = filas.map((row) =>
      headers.map((h) =>
        typeof row[h] === "number" ? Number(row[h].toFixed?.(4) ?? row[h]) : row[h]
      )
    );

    return [headers, ...body];
  };

  /* =========================
     Construir tablas
  ========================= */
  const tableP1 = buildTableFromFilas(t1.filas);
  const tableVar = buildTableFromFilas(variacion);
  const tableP2 = buildTableFromFilas(t2.filas);

  /* =========================
     Posiciones (column offsets)
  ========================= */
  const startRow = 0;

  const colP1 = 0;     // Periodo 1
  const colVar = 8;    // Variación (ajusta si necesitas)
  const colP2 = 12;    // Periodo 2

  /* =========================
     Insertar en la hoja
  ========================= */
  XLSX.utils.sheet_add_aoa(
    ws,
    [["Periodo 1"]],
    { origin: { r: startRow, c: colP1 } }
  );
  XLSX.utils.sheet_add_aoa(
    ws,
    tableP1,
    { origin: { r: startRow + 2, c: colP1 } }
  );

  XLSX.utils.sheet_add_aoa(
    ws,
    [["Variación"]],
    { origin: { r: startRow, c: colVar } }
  );
  XLSX.utils.sheet_add_aoa(
    ws,
    tableVar,
    { origin: { r: startRow + 2, c: colVar } }
  );

  XLSX.utils.sheet_add_aoa(
    ws,
    [["Periodo 2"]],
    { origin: { r: startRow, c: colP2 } }
  );
  XLSX.utils.sheet_add_aoa(
    ws,
    tableP2,
    { origin: { r: startRow + 2, c: colP2 } }
  );

  /* =========================
     Finalizar
  ========================= */
  XLSX.utils.book_append_sheet(wb, ws, "Comparación");
  XLSX.writeFile(wb, "comparacion_subcanales.xlsx");
};

const p1Dates = buildAlignedPeriod1Dates(
  p1Month,
  p2Start,
  p2End
);

const periodo1Label = `${p1Dates.start} → ${p1Dates.end}`;
const periodo2Label = `${p2Start} → ${p2End}`;
  /* =========================
     Render
  ========================= */
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Comparación GA4 Subcanales</h2>

      {/* Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-2">Periodo 1 (mes)</h4>
          <input
            type="month"
            value={p1Month}
            onChange={(e) => {
              setP1Month(e.target.value);
              setDataReady(false);
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
                    setP2Start(e.target.value);
                    setDataReady(false);
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
                setDataReady(false);
              }}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>
        </div>
      </div>

      <button
  onClick={fetchComparacion}
  disabled={loading}
  className={`mt-6 px-6 py-2 rounded text-white transition
    ${loading
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-black hover:bg-gray-800"
    }`}
>
  {loading ? "Cargando…" : "Comparar"}
</button>


      {loading && <div className="mt-4">Cargando…</div>}

      {dataReady && (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mt-4 items-start">
            <Tabla titulo="Periodo 1" subtitulo={periodo1Label} tabla={t1} />
            <TablaVariacion data={variacion} />
            <Tabla titulo="Periodo 2" subtitulo={periodo2Label} tabla={t2} />
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
   Subcomponentes
========================= */

const CARD = "bg-white rounded-xl shadow p-4 w-full";
const TITLE_WRAP = "h-10 flex items-center justify-center mb-3";
const TITLE = "block text-sm font-semibold";
const TABLE = "w-full text-xs border";
const THEAD = "bg-gray-100";
const ROW = "border-t h-9";

const Tabla = ({ titulo, subtitulo, tabla }) => (
  <div className={CARD}>
    <div className="min-h-[2.5rem] flex flex-col items-center justify-center mb-3">
  <h3 className={TITLE}>{titulo}</h3>

  {subtitulo && (
    <p className="block text-xs text-gray-500 mt-1">
      {subtitulo}
    </p>
  )}
</div>

    <table className={TABLE}>
      <thead className={THEAD}>
        <tr>
          <th className="p-2 text-left">Subcanal</th>
          <th className="p-2 text-right">Sesiones</th>

          <th className="p-2 text-right">
            <span className="block">% Particip.</span>
            <span className="block text-[10px]">Sesiones</span>
          </th>

          <th className="p-2 text-right">Ventas</th>

          <th className="p-2 text-right">
            <span className="block">% Particip.</span>
            <span className="block text-[10px]">Ventas</span>
          </th>

          <th className="p-2 text-right">Efectividad %</th>
        </tr>
      </thead>

      <tbody>
        {tabla.filas.map((r) => (
          <tr key={r.subcanal} className={ROW}>
            <td className="px-2">{r.subcanal}</td>
            <td className="px-2 text-right">{r.sesiones}</td>
            <td className="px-2 text-right text-gray-500">
              {(r.pctSesiones * 100).toFixed(1)}%
            </td>
            <td className="px-2 text-right">{r.ventas}</td>
            <td className="px-2 text-right text-gray-500">
              {(r.pctVentas * 100).toFixed(1)}%
            </td>
            <td className="px-2 text-right text-gray-700">
              {(r.conversionRate * 100).toFixed(1)}%
            </td>
          </tr>
        ))}
      </tbody>

      <tfoot className="bg-gray-50 font-semibold">
        <tr className={ROW}>
          <td className="px-2">TOTAL / PROMEDIO</td>
          <td className="px-2 text-right">{tabla.totalSesiones}</td>
          <td className="px-2 text-right">
            {(tabla.avgPctSesiones * 100).toFixed(1)}%
          </td>
          <td className="px-2 text-right">{tabla.totalVentas}</td>
          <td className="px-2 text-right">
            {(tabla.avgPctVentas * 100).toFixed(1)}%
          </td>
          <td className="px-2 text-right">
            {(tabla.avgConversion * 100).toFixed(1)}%
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
);



const TablaVariacion = ({ data }) => {
  if (!data?.length) return null;

  return (
    <div className={CARD}>
      <div className={TITLE_WRAP}>
        <h3 className={TITLE}>Variación</h3>
      </div>

      <table className="text-[11px] border border-gray-200 w-auto mx-auto">
        <thead className={THEAD}>
          <tr className="h-12">
            <th className="px-2 h-12 text-right align-middle leading-tight">
              <span className="block text-xs">Δ</span>
              <span className="block text-[10px] text-gray-500">
                Sesiones %
              </span>
            </th>

            <th className="px-2 h-12 text-right align-middle leading-tight">
              <span className="block text-xs">Δ</span>
              <span className="block text-[10px] text-gray-500">
                Ventas %
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          {data.map((r) => (
            <tr key={r.subcanal} className={ROW}>
              <td
                className={`px-2 text-right font-medium ${
                  r.sesionesVar >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {r.sesionesVar}%
              </td>

              <td
                className={`px-2 text-right font-medium ${
                  r.ventasVar >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {r.ventasVar}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


