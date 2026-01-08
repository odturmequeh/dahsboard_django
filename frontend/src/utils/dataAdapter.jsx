// utils/dataAdapter.js
/**
 * Adaptador de datos del backend al formato esperado por los componentes
 * Transforma la respuesta de la API a la estructura que usan los componentes React
 */

/**
 * Formatea una fecha del backend (YYYY-MM-DD) al formato del frontend
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formatea un número a porcentaje con 2 decimales
 */
function formatPercentage(value) {
  if (value === null || value === undefined) return '0%';
  return `${parseFloat(value).toFixed(2)}%`;
}

/**
 * Adapta los datos de metas y objetivos
 */
export function adaptMetasObjetivos(backendData) {
  if (!backendData || !backendData.tiene_datos) {
    return {
      ejecucionTotal: 0,
      metaTotal: 0,
      cumplimiento: '0%',
      proyeccionCierre: 0,
      productividadDiaria: 0,
      sesionesGA4: 0,
      variacionSesiones: '+0%',
      diasHabiles: '0 de 0'
    };
  }

  const { metas, real, cumplimiento, dias_habiles } = backendData;

  return {
    ejecucionTotal: real.total,
    metaTotal: metas.total,
    cumplimiento: formatPercentage(cumplimiento.total),
    proyeccionCierre: 0, // Se calcula con proyección
    productividadDiaria: dias_habiles.totales > 0 
      ? Math.round(real.total / dias_habiles.transcurridos) 
      : 0,
    sesionesGA4: 0, // Se obtiene de otro endpoint
    variacionSesiones: '+0%',
    diasHabiles: `${dias_habiles.transcurridos} de ${dias_habiles.totales}`
  };
}

/**
 * Adapta los datos de cierre del día anterior
 */
export function adaptCierreDiaAnterior(backendData) {
  if (!backendData || !backendData.tiene_datos) {
    return {
      fecha: '-',
      sesiones: 0,
      cantadas: 0,
      r5Finalizadas: 0,
      conversionPorcentaje: '0%',
      variacionSemanaAnterior: '+0%',
      variacionMesAnterior: '+0%'
    };
  }

  const { fecha, ventas, ga4_metrics, tasas } = backendData;

  return {
    fecha: formatDate(fecha),
    sesiones: ga4_metrics?.sesiones || 0,
    cantadas: ventas.cantadas,
    r5Finalizadas: ventas.activadas,
    conversionPorcentaje: formatPercentage(tasas.activacion),
    variacionSemanaAnterior: '+0%', // TODO: Calcular con datos históricos
    variacionMesAnterior: '+0%' // TODO: Calcular con datos históricos
  };
}

/**
 * Adapta los datos de cortes del día
 */
export function adaptCortesDelDia(backendData) {
  if (!backendData || !backendData.tiene_datos) {
    return {
      cortes: []
    };
  }

  const cortes = backendData.cortes_por_hora.map(corte => {
    const conversion = corte.sesiones_hora > 0
      ? ((corte.ventas_hora / corte.sesiones_hora) * 100).toFixed(2)
      : '0.00';

    return {
      hora: `${String(corte.hora).padStart(2, '0')}:00`,
      sesiones: corte.sesiones || 0,
      cantadas: corte.ventas_hora,
      conversion: `${conversion}%`
    };
  });

  return { cortes };
}

/**
 * Adapta los datos de evolución de ventas
 */
export function adaptEvolucionVentas(backendData) {
  if (!backendData || !backendData.tiene_datos) {
    return {
      chartData: [],
      promedioV9: 0,
      promedioR5: 0,
      metaPromedio: 0
    };
  }

  const { datos_diarios, resumen } = backendData;

  // Transformar datos para el chart
  const chartData = datos_diarios.map(dia => ({
    date: formatDate(dia.fecha),
    v9: dia.total_ventas,
    r5: dia.total_activaciones,
    metaDiaria: 0 // TODO: Obtener de metas dividido por días
  }));

  return {
    chartData,
    promedioV9: resumen.promedio_diario.toFixed(1),
    promedioR5: (resumen.total_activaciones / datos_diarios.length).toFixed(1),
    metaPromedio: 0 // TODO: Calcular desde metas
  };
}

/**
 * Adapta los datos del mapa de calor
 */
export function adaptMapaCalor(backendData) {
  if (!backendData || !backendData.tiene_datos) {
    return {
      heatmapData: Array(7).fill(null).map(() => Array(17).fill(0)),
      mejorHora: '-',
      mejorDia: '-',
      totalVentas: 0
    };
  }

  // Crear matriz 7x17 (7 días x 17 horas de 6am a 10pm)
  const heatmapData = Array(7).fill(null).map(() => Array(17).fill(0));
  
  // Mapeo de días de la semana (1=Domingo en SQL, necesitamos 0=Lunes en frontend)
  const dayMap = {
    1: 6, // Domingo → índice 6
    2: 0, // Lunes → índice 0
    3: 1, // Martes → índice 1
    4: 2, // Miércoles → índice 2
    5: 3, // Jueves → índice 3
    6: 4, // Viernes → índice 4
    7: 5  // Sábado → índice 5
  };

  let maxCantidad = 0;
  let mejorHora = '';
  let mejorDia = '';
  let totalVentas = 0;

  // Llenar la matriz con los datos reales
  backendData.datos.forEach(item => {
    const dayIndex = dayMap[item.dia_semana_num];
    const hourIndex = item.hora - 6; // 6am = índice 0

    if (dayIndex !== undefined && hourIndex >= 0 && hourIndex < 17) {
      heatmapData[dayIndex][hourIndex] = item.cantidad;
      totalVentas += item.cantidad;

      if (item.cantidad > maxCantidad) {
        maxCantidad = item.cantidad;
        mejorHora = `${String(item.hora).padStart(2, '0')}:00`;
        mejorDia = item.dia_semana;
      }
    }
  });

  return {
    heatmapData,
    mejorHora,
    mejorDia,
    totalVentas
  };
}

/**
 * Adapta los datos de CTW (Nota: Este endpoint no existe en el backend actual)
 */
// export function adaptCTW(backendData) {
//   // Por ahora, retornar datos mock ya que CTW no está implementado en el backend
//   return {
//     clicsGA4: 0,
//     chatsIniciados: 0,
//     v9Creadas: 0,
//     r5Finalizadas: 0,
//     aprobadasABD: 0,
//     tasaClicChat: '0%',
//     tasaConversionGeneral: '0%',
//     tasaAprobacionABD: '0%'
//   };
// }

/**
 * Adapta los datos de desglose semanal
 */
export function adaptDesgloseSemanal(backendData) {
  if (!backendData || !backendData.tiene_datos) {
    return {
      semanas: [],
      total: {
        ejecucion: 0,
        meta: 0,
        cumplimiento: '0%',
        productividad: 0,
        sesiones: 0,
        variacion: '+0%'
      }
    };
  }

  const semanas = backendData.semanas.map((semana, index) => {
    const cumplimiento = semana.total > 0 && semana.dias_habiles > 0
      ? ((semana.total / (semana.dias_habiles * 10)) * 100).toFixed(0) // Asumiendo meta de 10/día
      : '0';

    return {
      nombre: `Semana ${index + 1}`,
      ejecucion: semana.total,
      meta: Math.round(semana.dias_habiles * 10), // Meta estimada
      cumplimiento: `${cumplimiento}%`,
      productividad: semana.promedio_dia_habil.toFixed(1),
      sesiones: 0, // TODO: Agregar sesiones desde otro endpoint
      variacion: '+0%' // TODO: Calcular variación con semana anterior
    };
  });

  const totalEjecucion = backendData.total_mes;
  const totalMeta = semanas.reduce((sum, s) => sum + s.meta, 0);

  return {
    semanas,
    total: {
      ejecucion: totalEjecucion,
      meta: totalMeta,
      cumplimiento: totalMeta > 0 
        ? `${((totalEjecucion / totalMeta) * 100).toFixed(0)}%`
        : '0%',
      productividad: semanas.length > 0
        ? (totalEjecucion / semanas.length).toFixed(1)
        : '0',
      sesiones: 0,
      variacion: '+0%'
    }
  };
}

/**
 * Adapta todos los datos del dashboard completo
 */
export function adaptDashboardCompleto(backendData) {
  if (!backendData) {
    return null;
  }

  return {
    lastUpdate: new Date().toLocaleString('es-CO'),
    filtros: {
      periodo: 'Este Mes',
      flujoVenta: backendData.filtros_aplicados?.tipo_venta || 'Todos los Flujos',
      canalOutbound: 'Todos los Canales'
    },
    metas: adaptMetasObjetivos(backendData.metas_objetivos),
    cierreDiaAnterior: adaptCierreDiaAnterior(backendData.cierre_dia_anterior),
    cortesDia: adaptCortesDelDia(backendData.cortes_dia_actual),
    evolucionVentas: adaptEvolucionVentas(backendData.evolucion_ventas),
    mapaCalor: adaptMapaCalor(backendData.mapa_calor),
    // ctw: adaptCTW(null), // CTW no implementado en backend
    desgloseSemanal: adaptDesgloseSemanal(backendData.desglose_semanal)
  };
}

/**
 * Combina metas y proyección para el componente MetasObjetivos
 */
export function combinedMetasConProyeccion(metasData, proyeccionData) {
  const metas = adaptMetasObjetivos(metasData);
  
  if (proyeccionData && proyeccionData.tiene_datos) {
    metas.proyeccionCierre = proyeccionData.proyeccion.total;
  }
  
  return metas;
}