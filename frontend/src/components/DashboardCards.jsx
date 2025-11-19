import React from "react";

export default function Ga4Kpis({ sessions, items, revenue }) {
  const formatNumber = (num) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
    if (num >= 1_000) return num.toLocaleString();
    return num;
  };

  const formatCurrency = (num) =>
    num.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {/* Sessions */}
      <div className="p-6 bg-white rounded-2xl shadow">
        <p className="text-sm text-gray-500">Sesiones</p>
        <h2 className="text-3xl font-bold mt-2">{formatNumber(sessions)}</h2>
      </div>

      {/* Items */}
      <div className="p-6 bg-white rounded-2xl shadow">
        <p className="text-sm text-gray-500">Items Vendidos</p>
        <h2 className="text-3xl font-bold mt-2">{formatNumber(items)}</h2>
      </div>

      {/* Revenue */}
      <div className="p-6 bg-white rounded-2xl shadow">
        <p className="text-sm text-gray-500">Ingresos</p>
        <h2 className="text-3xl font-bold mt-2">
          {formatCurrency(revenue)}
        </h2>
      </div>
    </div>
  );
}

