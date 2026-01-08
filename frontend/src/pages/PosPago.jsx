// pages/PosPago.jsx - VERSIÓN CORREGIDA COMPLETA
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MetasObjetivos from "../components/MetasObjetivos";
import CierreDiaAnterior from "../components/CierreDiaAnterior";
import CorteDiario from "../components/CorteDiario";
import EvolucionVentas from "../components/EvolucionVentas";
import MapaCalor from "../components/MapaCalor";
import DesgloseSemanal from "../components/DesgloseSemanal";

const API_BASE = 'http://localhost:8000/api/pospago';

// ============================================
// COMPONENTES DE UI
// ============================================

function SkeletonLoader({ height = "200px" }) {
  const styles = {
    skeleton: {
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'loading 1.5s infinite',
      borderRadius: '12px',
      padding: '20px',
      minHeight: height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#9CA3AF',
      fontSize: '14px',
      fontWeight: '500'
    }
  };

  return <div style={styles.skeleton}>⏳ Cargando...</div>;
}

function ComponentError({ message, onRetry }) {
  const styles = {
    error: {
      backgroundColor: '#FEE2E2',
      border: '2px solid #DC2626',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      minHeight: '150px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px'
    },
    errorText: {
      color: '#DC2626',
      fontSize: '14px',
      margin: 0
    },
    retryButton: {
      padding: '8px 16px',
      backgroundColor: '#DC2626',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    }
  };

  return (
    <div style={styles.error}>
      <span style={{ fontSize: '24px' }}>⚠️</span>
      <p style={styles.errorText}>{message}</p>
      {onRetry && (
        <button 
          style={styles.retryButton}
          onClick={onRetry}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE DE FILTROS
// ============================================

function FiltrosPospago({ filters, onChange }) {
  const styles = {
    filtros: {
      backgroundColor: '#fff',
      border: "1px solid #d9caca",
      borderTop: "4px solid #DA291C",
      borderRadius: '12px',
      padding: '10px',
      marginBottom: '20px',
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      height: "7rem"
    },
    title: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#333',
      marginBottom: '4px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
    },
    field: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#666',
    },
    input: {
      padding: '10px 12px',
      border: '2px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
      height:"2rem"
    },
    select: {
      // padding: '10px 12px',
      border: '2px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      cursor: 'pointer',
      backgroundColor: '#fff',
      transition: 'border-color 0.2s',
      height:"2rem"
    }
  };

  const handleDateChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const handleFlujoChange = (e) => {
    onChange({ ...filters, flujoVenta: e.target.value });
  };

  return (
    <div style={styles.filtros}>
      <h3 style={styles.title}>Filtros</h3>
      <div style={styles.grid}>
        <div style={styles.field}>
          <label style={styles.label}>Fecha Inicio</label>
          <input
            type="date"
            style={styles.input}
            value={filters.fecha_inicio || ''}
            onChange={(e) => handleDateChange('fecha_inicio', e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Fecha Fin</label>
          <input
            type="date"
            style={styles.input}
            value={filters.fecha_fin || ''}
            onChange={(e) => handleDateChange('fecha_fin', e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Flujo de Venta</label>
          <select 
            style={styles.select}
            value={filters.flujoVenta || 'TODOS'}
            onChange={handleFlujoChange}
          >
            <option value="TODOS">Todos los Flujos</option>
            <option value="MIGRACION">Migración</option>
            <option value="PORTABILIDAD">Portabilidad</option>
            <option value="PORTA_ECOMMERCE">Porta Ecommerce</option>
            <option value="CTW">Click To WhatsApp</option>
            <option value="LINEA_NUEVA">Línea Nueva</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function PosPago() {
  // Estados independientes para cada sección
  const [metas, setMetas] = useState({ loading: true, data: null, error: null });
  const [cierre, setCierre] = useState({ loading: true, data: null, error: null });
  const [cortes, setCortes] = useState({ loading: true, data: null, error: null });
  const [evolucion, setEvolucion] = useState({ loading: true, data: null, error: null });
  const [desglose, setDesglose] = useState({ loading: true, data: null, error: null });
  const [mapa, setMapa] = useState({ loading: true, data: null, error: null });

  // Estado de filtros (fechas iniciales: este mes)
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  
  const [filters, setFilters] = useState({
    fecha_inicio: formatDateForInput(primerDiaMes),
    fecha_fin: formatDateForInput(hoy),
    flujoVenta: 'TODOS'
  });

  const [lastUpdate, setLastUpdate] = useState('Cargando...');

  // ============================================
  // EFECTO PARA CARGAR DATOS
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      console.log('🚀 Cargando datos con filtros:', filters);
      const startTime = Date.now();
      
      // Calcular parámetros para las APIs
      const fechaInicio = filters.fecha_inicio || formatDateForInput(primerDiaMes);
      const fechaFin = filters.fecha_fin || formatDateForInput(hoy);
      const fecha = new Date(fechaFin);
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;
      
      // Helper para fetch individual
      const fetchEndpoint = async (url, setState, label) => {
        const fetchStart = Date.now();
        try {
          console.log(`📡 [${label}] ${url}`);
          const response = await axios.get(url);
          const duration = Date.now() - fetchStart;
          console.log(`✅ [${label}] ${duration}ms`, response.data);
          
          if (isMounted) {
            setState({ 
              loading: false, 
              data: response.data.data || response.data, 
              error: null 
            });
          }
        } catch (error) {
          const duration = Date.now() - fetchStart;
          console.error(`❌ [${label}] Error (${duration}ms):`, error.message);
          
          if (isMounted) {
            setState({ 
              loading: false, 
              data: null, 
              error: error.response?.data?.error || error.message || 'Error desconocido'
            });
          }
        }
      };

      // Ejecutar todas las llamadas en paralelo
      await Promise.allSettled([
        fetchEndpoint(
          `${API_BASE}/metas-objetivos/?anio=${anio}&mes=${mes}`,
          setMetas,
          'Metas'
        ),
        fetchEndpoint(
          `${API_BASE}/cierre-dia-anterior/?flujo=${filters.flujoVenta}`,
          setCierre,
          'Cierre'
        ),
        fetchEndpoint(
          `${API_BASE}/cortes-dia-hoy/?flujo=${filters.flujoVenta}`,
          setCortes,
          'Cortes'
        ),
        fetchEndpoint(
          `${API_BASE}/evolucion-ventas/?anio=${anio}&mes=${mes}&flujo=${filters.flujoVenta}`,
          setEvolucion,
          'Evolución'
        ),
        fetchEndpoint(
          `${API_BASE}/desglose-semanal/?anio=${anio}&mes=${mes}&flujo=${filters.flujoVenta}`,
          setDesglose,
          'Desglose'
        ),
        fetchEndpoint(
          `${API_BASE}/mapa-calor/?anio=${anio}&mes=${mes}&flujo=${filters.flujoVenta}`,
          setMapa,
          'Mapa'
        )
      ]);

      const totalDuration = Date.now() - startTime;
      console.log(`🎉 Completado en ${totalDuration}ms`);
      
      if (isMounted) {
        setLastUpdate(new Date().toLocaleString('es-CO'));
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filters.fecha_inicio, filters.fecha_fin, filters.flujoVenta]);

  // Agregar animación del skeleton
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={styles.page}>
      <Header data={lastUpdate} />
      
      <div style={styles.container}>
        {/* <h1 style={styles.pageTitle}>Dashboard Pospago</h1>
        <p style={styles.lastUpdate}>Última actualización: {lastUpdate}</p> */}

        {/* FILTROS */}
        <FiltrosPospago filters={filters} onChange={setFilters} />

        {/* METAS Y OBJETIVOS */}
        {metas.loading ? (
          <SkeletonLoader height="300px" />
        ) : metas.error ? (
          <ComponentError 
            message={`Error en Metas: ${metas.error}`}
            onRetry={() => window.location.reload()}
          />
        ) : metas.data && metas.data.tiene_datos ? (
          <MetasObjetivos data={adaptMetasData(metas.data, filters.flujoVenta)} />
        ) : (
          <div style={styles.noData}>No hay datos de metas</div>
        )}

        {/* CIERRE DÍA ANTERIOR Y CORTES DEL DÍA */}
        <div style={styles.grid2}>
          {cierre.loading ? (
            <SkeletonLoader height="350px" />
          ) : cierre.error ? (
            <ComponentError message={`Error en Cierre: ${cierre.error}`} />
          ) : cierre.data && cierre.data.tiene_datos ? (
            <CierreDiaAnterior data={adaptCierreData(cierre.data)} />
          ) : (
            <div style={styles.noData}>No hay datos de cierre</div>
          )}

          {cortes.loading ? (
            <SkeletonLoader height="350px" />
          ) : cortes.error ? (
            <ComponentError message={`Error en Cortes: ${cortes.error}`} />
          ) : cortes.data && cortes.data.tiene_datos ? (
            <CorteDiario data={adaptCortesData(cortes.data)} />
          ) : (
            <div style={styles.noData}>No hay datos de cortes</div>
          )}
        </div>

        {/* EVOLUCIÓN DE VENTAS */}
        {evolucion.loading ? (
          <SkeletonLoader height="400px" />
        ) : evolucion.error ? (
          <ComponentError message={`Error en Evolución: ${evolucion.error}`} />
        ) : evolucion.data && evolucion.data.tiene_datos && evolucion.data.datos_diarios && evolucion.data.datos_diarios.length > 0 ? (
          <EvolucionVentas data={adaptEvolucionData(evolucion.data, filters.flujoVenta)} />
        ) : (
          <div style={styles.noData}>No hay datos de evolución</div>
        )}

        {/* MAPA DE CALOR */}
        {mapa.loading ? (
          <SkeletonLoader height="350px" />
        ) : mapa.error ? (
          <ComponentError message={`Error en Mapa: ${mapa.error}`} />
        ) : mapa.data && mapa.data.tiene_datos && mapa.data.datos && mapa.data.datos.length > 0 ? (
          <MapaCalor data={adaptMapaData(mapa.data)} />
        ) : (
          <div style={styles.noData}>No hay datos de mapa de calor</div>
        )}

        {/* DESGLOSE SEMANAL */}
        {desglose.loading ? (
          <SkeletonLoader height="300px" />
        ) : desglose.error ? (
          <ComponentError message={`Error en Desglose: ${desglose.error}`} />
        ) : desglose.data && desglose.data.tiene_datos ? (
          <DesgloseSemanal data={adaptDesgloseData(desglose.data, filters.flujoVenta)} />
        ) : (
          <div style={styles.noData}>No hay datos de desglose</div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ============================================
// FUNCIONES ADAPTADORAS DE DATOS
// ============================================

function adaptMetasData(backendData, flujo = 'TODOS') {
  console.log('🔄 Adaptando metas:', { backendData, flujo });
  
  // Seleccionar datos según el flujo
  let datosSeleccionados;
  
  switch(flujo) {
    case 'MIGRACION':
      datosSeleccionados = backendData.migracion;
      break;
    case 'PORTABILIDAD':
      datosSeleccionados = backendData.portabilidad;
      break;
    case 'PORTA_ECOMMERCE':
      datosSeleccionados = backendData.porta_ecommerce;
      break;
    case 'CTW':
      datosSeleccionados = backendData.ctw;
      break;
    case 'LINEA_NUEVA':
      datosSeleccionados = backendData.linea_nueva;
      break;
    default:
      datosSeleccionados = backendData.total;
  }

  const diasHabiles = flujo === 'MIGRACION' || flujo === 'TODOS' 
    ? backendData.dias_habiles.migra 
    : backendData.dias_habiles.porta;

  const result = {
    ejecucionTotal: Math.round(datosSeleccionados.ejecucion),
    metaTotal: Math.round(datosSeleccionados.meta),
    cumplimiento: `${Math.round(datosSeleccionados.cumplimiento)}%`,
    proyeccionCierre: Math.round(datosSeleccionados.proyeccion),
    productividadDiaria: datosSeleccionados.productividad_diaria,
    sesionesGA4: 87055, // Placeholder - conectar con GA4 después
    variacionSesiones: '+1.7%', // Placeholder - conectar con GA4 después
    diasHabiles: `${diasHabiles.transcurridos} / ${diasHabiles.totales}`
  };

  console.log('✅ Metas adaptadas:', result);
  return result;
}

function adaptCierreData(backendData) {
  console.log('🔄 Adaptando cierre:', backendData);
  
  const result = {
    fecha: backendData.fecha,
    sesiones: 2839, // Placeholder - conectar con GA4
    cantadas: backendData.cantadas?.total || 0,
    r5Finalizadas: backendData.activadas?.total || 0,
    conversionPorcentaje: `${backendData.tasa_activacion?.toFixed(2) || 0}%`,
    variacionSemanaAnterior: `${backendData.comparativos?.semana_anterior?.variacion_pct > 0 ? '+' : ''}${backendData.comparativos?.semana_anterior?.variacion_pct?.toFixed(1) || 0}%`,
    variacionMesAnterior: `${backendData.comparativos?.mes_anterior?.variacion_pct > 0 ? '+' : ''}${backendData.comparativos?.mes_anterior?.variacion_pct?.toFixed(1) || 0}%`
  };

  console.log('✅ Cierre adaptado:', result);
  return result;
}

function adaptCortesData(backendData) {
  console.log('🔄 Adaptando cortes:', backendData);
  
  const cortes = (backendData.cortes_por_franja || []).map(c => ({
    hora: c.franja,
    sesiones: c.cantadas * 50, // Placeholder - GA4
    cantadas: c.cantadas,
    conversion: c.cantadas > 0 ? `${((c.cantadas / (c.cantadas * 50)) * 100).toFixed(2)}%` : '0%'
  }));

  const result = {
    cortes: cortes
  };

  console.log('✅ Cortes adaptados:', result);
  return result;
}

function adaptEvolucionData(backendData, flujo = 'TODOS') {
  console.log('🔄 Adaptando evolución:', { backendData, flujo });
  console.log('📊 Datos diarios:', backendData.datos_diarios?.length);
  
  const datosDiarios = (backendData.datos_diarios || []).map(dia => {
    let valor;
    switch(flujo) {
      case 'MIGRACION':
        valor = dia.r5.migraciones;
        break;
      case 'PORTABILIDAD':
        valor = dia.r5.portabilidades;
        break;
      case 'CTW':
        valor = dia.r5.ctw;
        break;
      case 'LINEA_NUEVA':
        valor = dia.r5.linea_nueva;
        break;
      default:
        valor = dia.r5.total;
    }

    return {
      date: dia.fecha,  
      metaDiaria: dia.metas_diarias.total,
      r5: valor,
      v9: dia.v9.total
    };
  });

  console.log('✅ Resultado chartData:', datosDiarios.length);

  const result = {
    evolucionVentas: {
      chartData: datosDiarios,  
      promedioV9: Math.round(backendData.promedios?.v9 || 0),
      promedioR5: Math.round(backendData.promedios?.r5 || 0),
      metaPromedio: Math.round(backendData.promedios?.meta || 0)
    }
  };

  console.log('✅ Evolución adaptada:', result);
  return result;
}

function adaptMapaData(backendData) {
  console.log('🔄 Adaptando mapa:', backendData);
  console.log('📊 Datos mapa:', backendData.datos?.length);
  
  // Crear matriz de 5 semanas x 7 días (inicializada en null)
  // Índices: [semana-1][dia-1] donde semana=1-5, dia=1-7 (1=Domingo, 2=Lunes, etc.)
  const heatmapData = Array(5).fill(null).map(() => Array(7).fill(null));
  
  // Llenar matriz con datos del backend
  if (backendData.datos && backendData.datos.length > 0) {
    backendData.datos.forEach(item => {
      // item = {semana_mes: 1, dia_semana_num: 5, dia_semana: "J", cantidad: 91}
      const semanaIndex = item.semana_mes - 1;  // 0-4
      
      const diaIndex = item.dia_semana_num - 1;
      
      if (semanaIndex >= 0 && semanaIndex < 5 && diaIndex >= 0 && diaIndex < 7) {
        heatmapData[semanaIndex][diaIndex] = {
          cantidad: item.cantidad,
          dia_semana: item.dia_semana
        };
      }
    });
  }
  
  const result = {
    mapaCalor: {
      heatmapData: heatmapData,
      mejorSemana: backendData.resumen?.mejor_semana || 'N/A',
      mejorDia: backendData.resumen?.mejor_dia || 'N/A',
      totalVentasR5: backendData.resumen?.total || 0
    }
  };

  console.log('✅ Mapa adaptado:', result);
  console.log('✅ Heatmap data:', heatmapData);
  return result;
}

function adaptDesgloseData(backendData, flujo = 'TODOS') {
  console.log('🔄 Adaptando desglose:', { backendData, flujo });
  
  const semanas = (backendData.semanas || []).map(s => {
    let ejecucion;
    switch(flujo) {
      case 'MIGRACION':
        ejecucion = s.migraciones;
        break;
      case 'PORTABILIDAD':
        ejecucion = s.portabilidades_total;
        break;
      case 'PORTA_ECOMMERCE':
        ejecucion = s.porta_ecommerce;
        break;
      case 'CTW':
        ejecucion = s.ctw;
        break;
      case 'LINEA_NUEVA':
        ejecucion = s.linea_nueva;
        break;
      default:
        ejecucion = s.total;
    }

    return {
      semana: `Semana ${s.numero_semana}`,
      ejecucion: ejecucion,
      meta: ejecucion * 1.8, // Placeholder
      cumplimiento: Math.round(s.cumplimiento),
      productividad: Math.round(ejecucion / 5), // Placeholder
      sesiones: Math.round(ejecucion * 50), // Placeholder - GA4
      variacion: 0 // Placeholder
    };
  });

  const result = {
    desgloseSemanal: {
      semanas,
      totalMes: backendData.total_mes || 0
    }
  };

  console.log('✅ Desglose adaptado:', result);
  return result;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================
// ESTILOS
// ============================================

const styles = {
  page: {
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  container: {
    maxWidth: "100vw",
    margin: "0 auto",
    padding: 20,
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '8px',
  },
  lastUpdate: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '20px',
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20,
  },
  noData: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#9CA3AF',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '2px dashed #E5E7EB'
  }
};