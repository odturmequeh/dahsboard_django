// data/mockdata.js

export const mockData = {
  lastUpdate: "17/12/2025 16:30:00",
  
  // Filtros iniciales
  filtros: {
    periodo: "Este Mes",
    flujoVenta: "Todos los Flujos",
    canalOutbound: "Todos los Canales"
  },
  
  metas: {
    ejecucionTotal: "1.488",
    metaTotal: 5493,
    cumplimiento: "27%",
    proyeccionCierre: 3343,
    productividadDiaria: "149",
    sesionesGA4: 87055,
    variacionSesiones: "↑ 1.7%",
    diasHabiles: "23 / 36"
  },

  cierreDiaAnterior: {
    fecha: "Martes, 16 de diciembre de 2025",
    sesiones: 2839,
    cantadas: "73",
    r5Finalizadas: "62",
    conversionPorcentaje: "2.57%",
    variacionSemanaAnterior: "+15.0%",
    variacionMesAnterior: "+11.5%"
  },

  cortesDia: {
    cortes: [
      { hora: "10:00", sesiones: 1820, cantadas: "42", conversion: "2.31%" },
      { hora: "12:00", sesiones: 3456, cantadas: "68", conversion: "1.97%" },
      { hora: "14:00", sesiones: 5234, cantadas: "95", conversion: "1.81%" },
      { hora: "16:00", sesiones: 6839, cantadas: "127", conversion: "1.86%" }
    ]
  },

  evolucionVentas: {
    chartData: [
      { date: "02/12", v9: 50, r5: 48, metaDiaria: 120 },
      { date: "03/12", v9: 75, r5: 73, metaDiaria: 100 },
      { date: "04/12", v9: 85, r5: 80, metaDiaria: 130 },
      { date: "05/12", v9: 20, r5: 18, metaDiaria: 110 },
      { date: "06/12", v9: 15, r5: 15, metaDiaria: 90 },
      { date: "09/12", v9: 12, r5: 12, metaDiaria: 80 },
      { date: "10/12", v9: 18, r5: 16, metaDiaria: 130 },
      { date: "11/12", v9: 25, r5: 22, metaDiaria: 110 },
      { date: "12/12", v9: 22, r5: 20, metaDiaria: 100 },
      { date: "13/12", v9: 18, r5: 16, metaDiaria: 130 },
      { date: "16/12", v9: 24, r5: 22, metaDiaria: 125 },
      { date: "17/12", v9: 20, r5: 18, metaDiaria: 105 }
    ],
    promedioV9: "197",
    promedioR5: "175",
    metaPromedio: "106"
  },

  mapaCalor: {
    heatmapData: [
      [0, 0, 0, 1, 0, 0, 1, 5, 7, 5, 1, 4, 7, 0, 4, 0, 0],
      [0, 2, 0, 1, 0, 1, 4, 6, 5, 2, 5, 6, 1, 3, 0, 0, 0],
      [1, 2, 0, 1, 0, 0, 6, 8, 6, 2, 4, 7, 2, 5, 0, 0, 0],
      [0, 1, 2, 0, 0, 0, 5, 7, 6, 0, 5, 6, 0, 4, 0, 0, 0],
      [1, 2, 2, 2, 1, 0, 7, 9, 7, 2, 6, 8, 2, 5, 0, 0, 0],
      [0, 0, 0, 1, 0, 1, 3, 4, 3, 0, 2, 3, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 2, 3, 2, 0, 0, 2, 0, 0, 0, 0, 0]
    ],
    mejorHora: "13:00 - 14:00",
    mejorDia: "Viernes",
    totalVentas: "242"
  },

  efectividadCanal: {
    canales: [
      { canal: "IBM - Migración", efectividad: 0.91 },
      { canal: "IBM - Portabilidad", efectividad: 0.15 },
      { canal: "GROWTH - Migración", efectividad: 3.5 },
      { canal: "GROWTH - Portabilidad", efectividad: 0.19 },
      { canal: "Organics", efectividad: 2.3 },
      { canal: "Papo (SEM)", efectividad: 1.15 }
    ]
  },

  detalleCanales: {
    canales: [
      { nombre: "IBM - Migración", tipo: "IBM", sesiones: 4746, v9: 63, r5: 56, efectividad: "1.32%" },
      { nombre: "IBM - Portabilidad", tipo: "IBM", sesiones: 1258, v9: 4, r5: 3, efectividad: "0.32%" },
      { nombre: "GROWTH - Migración", tipo: "GROWTH", sesiones: 2152, v9: 69, r5: 62, efectividad: "3.21%" },
      { nombre: "GROWTH - Portabilidad", tipo: "GROWTH", sesiones: 687, v9: 4, r5: 4, efectividad: "0.58%" },
      { nombre: "Orgánico", tipo: "GROWTH", sesiones: 3456, v9: 87, r5: 78, efectividad: "2.52%" },
      { nombre: "Pago (SEM)", tipo: "GROWTH", sesiones: 8234, v9: 156, r5: 142, efectividad: "1.89%" }
    ],
    totals: {
      growth: "286",
      ibm: "59"
    }
  },

  ctw: {
    clicsGA4: "1.258",
    chatsIniciados: "892",
    v9Creadas: "8",
    r5Finalizadas: "7",
    aprobadasABD: "6",
    tasaClicChat: "70.91%",
    tasaConversionGeneral: "0.56%",
    tasaAprobacionABD: "85.7%"
  },

  desgloseSemanal: {
    semanas: [
      {
        nombre: "Semana 1",
        ejecucion: "686",
        meta: 1318,
        cumplimiento: "52%",
        productividad: "125",
        sesiones: 48820,
        variacion: "-"
      },
      {
        nombre: "Semana 2",
        ejecucion: "744",
        meta: 1064,
        cumplimiento: "70%",
        productividad: "213",
        sesiones: 38231,
        variacion: "-21.7%"
      },
      {
        nombre: "Semana 3",
        ejecucion: "58",
        meta: 1309,
        cumplimiento: "4%",
        productividad: "11",
        sesiones: 0,
        variacion: "-100.0%"
      },
      {
        nombre: "Semana 4",
        ejecucion: "0",
        meta: 1061,
        cumplimiento: "0%",
        productividad: "0",
        sesiones: 0,
        variacion: "0.0%"
      },
      {
        nombre: "Semana 5",
        ejecucion: "0",
        meta: 695,
        cumplimiento: "0%",
        productividad: "0",
        sesiones: 0,
        variacion: "0.0%"
      }
    ],
    total: {
      ejecucion: "1.488",
      meta: 5447,
      cumplimiento: "27.3%",
      productividad: "149",
      sesiones: 87055,
      variacion: "1.7%"
    }
  }
};