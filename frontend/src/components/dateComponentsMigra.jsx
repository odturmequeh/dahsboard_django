import { useMemo, useState } from "react";
import SesionesVsComprasComparacion from "../components/SesionesVsCompra_Comparacion.jsx";
import TrafficChannelSummary from "../components/traffic-chanel-summary.jsx";
import TrafficDetailSummary from "../components/traffic_detail.jsx";

export default function DateComponentsMigra() {
  const today = new Date();

  const pad = (n) => String(n).padStart(2, "0");

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const defaultStart = `${currentYear}-${pad(currentMonth)}-01`;
  const defaultEnd = `${currentYear}-${pad(currentMonth)}-${pad(currentDay)}`;

  const [p2Start, setP2Start] = useState(defaultStart);
  const [p2End, setP2End] = useState(defaultEnd);

  return (
    <div className="space-y-8">
      <SesionesVsComprasComparacion
        p2Start={p2Start}
        p2End={p2End}
        setP2Start={setP2Start}
        setP2End={setP2End}
      />
      {/*
      <TrafficChannelSummary
        startDate={p2Start}
        endDate={p2End}
        setStartDate={setP2Start}
        setEndDate={setP2End}
      />
      <TrafficDetailSummary
        startDate={p2Start}
        endDate={p2End}
        setStartDate={setP2Start}
        setEndDate={setP2End}
      />
      */}
    </div>
  );
}
