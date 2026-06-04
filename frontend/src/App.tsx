// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  CloudSun, 
  CloudRain, 
  Sun, 
  Search, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Droplets, 
  CheckCircle,
  Thermometer,
  MapPin,
  X,
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from 'recharts';

// Objecto de Datos de Prueba (Mock Data) según lo requerido por el prompt
const MOCK_DATA = {
  "Sevilla": {
    name: "Sevilla",
    region: "Andalucía",
    today: {
      date: "26 de Mayo, 2026",
      weather: "clear",
      tempMax: 41,
      tempMaxHistory: 34, // +7°C Anomalía (Exceso)
      tempMin: 24,
      tempMinHistory: 18, // +6°C Anomalía (Exceso)
    },
    weeklyPluviometria: 5,
    weeklyPluviometriaHistory: 10, // Diferencia de -5% (Normal)
    forecast: [
      { day: "Mié", date: "27 May", weather: "clear", tempMax: 42, tempMaxHistory: 34, tempMin: 25, tempMinHistory: 18 },
      { day: "Jue", date: "28 May", weather: "clear", tempMax: 40, tempMaxHistory: 34, tempMin: 23, tempMinHistory: 18 },
      { day: "Vie", date: "29 May", weather: "clear", tempMax: 39, tempMaxHistory: 35, tempMin: 22, tempMinHistory: 18 },
      { day: "Sáb", date: "30 May", weather: "cloudy", tempMax: 38, tempMaxHistory: 35, tempMin: 21, tempMinHistory: 19 },
      { day: "Dom", date: "31 May", weather: "clear", tempMax: 36, tempMaxHistory: 35, tempMin: 20, tempMinHistory: 19 },
      { day: "Lun", date: "01 Jun", weather: "clear", tempMax: 35, tempMaxHistory: 36, tempMin: 19, tempMinHistory: 19 }
    ]
  },
  "Madrid": {
    name: "Madrid",
    region: "Comunidad de Madrid",
    today: {
      date: "26 de Mayo, 2026",
      weather: "rainy",
      tempMax: 24,
      tempMaxHistory: 23, // +1°C (Normal)
      tempMin: 12,
      tempMinHistory: 11, // +1°C (Normal)
    },
    weeklyPluviometria: 52,
    weeklyPluviometriaHistory: 18, // +34% Diferencia (Anomalía por Exceso de precipitación)
    forecast: [
      { day: "Mié", date: "27 May", weather: "rainy", tempMax: 22, tempMaxHistory: 23, tempMin: 11, tempMinHistory: 11 },
      { day: "Jue", date: "28 May", weather: "rainy", tempMax: 19, tempMaxHistory: 23, tempMin: 9, tempMinHistory: 10 },
      { day: "Vie", date: "29 May", weather: "cloudy", tempMax: 20, tempMaxHistory: 22, tempMin: 10, tempMinHistory: 11 },
      { day: "Sáb", date: "30 May", weather: "clear", tempMax: 21, tempMaxHistory: 22, tempMin: 11, tempMinHistory: 11 },
      { day: "Dom", date: "31 May", weather: "clear", tempMax: 23, tempMaxHistory: 22, tempMin: 12, tempMinHistory: 12 },
      { day: "Lun", date: "01 Jun", weather: "clear", tempMax: 24, tempMaxHistory: 23, tempMin: 13, tempMinHistory: 12 }
    ]
  },
  "Logroño": {
    name: "Logroño",
    region: "La Rioja",
    today: {
      date: "26 de Mayo, 2026",
      weather: "cloudy",
      tempMax: 13,
      tempMaxHistory: 21, // -8°C Anomalía (Defecto/Ola de frío)
      tempMin: 4,
      tempMinHistory: 9,  // -5°C Anomalía (Defecto/Ola de frío)
    },
    weeklyPluviometria: 65,
    weeklyPluviometriaHistory: 60, // Diferencia de +5% (Normal)
    forecast: [
      { day: "Mié", date: "27 May", weather: "cloudy", tempMax: 12, tempMaxHistory: 21, tempMin: 3, tempMinHistory: 9 },
      { day: "Jue", date: "28 May", weather: "rainy", tempMax: 11, tempMaxHistory: 21, tempMin: 2, tempMinHistory: 9 },
      { day: "Vie", date: "29 May", weather: "rainy", tempMax: 13, tempMaxHistory: 20, tempMin: 3, tempMinHistory: 8 },
      { day: "Sáb", date: "30 May", weather: "cloudy", tempMax: 15, tempMaxHistory: 20, tempMin: 4, tempMinHistory: 8 },
      { day: "Dom", date: "31 May", weather: "clear", tempMax: 18, tempMaxHistory: 20, tempMin: 6, tempMinHistory: 8 },
      { day: "Lun", date: "01 Jun", weather: "clear", tempMax: 20, tempMaxHistory: 20, tempMin: 8, tempMinHistory: 9 }
    ]
  }
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Ciudades fijas para selección rápida
  const featuredCities = ['Sevilla', 'Madrid', 'Logroño'];

  const cityData = useMemo(() => {
    if (!selectedCityName) return null;
    return MOCK_DATA[selectedCityName as keyof typeof MOCK_DATA] || null;
  }, [selectedCityName]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryClean = searchQuery.trim().toLowerCase();
    
    // Buscar coincidencia en mock_data
    const matchedCityKey = Object.keys(MOCK_DATA).find(
      key => key.toLowerCase() === queryClean
    );

    if (matchedCityKey) {
      setSelectedCityName(matchedCityKey);
      setSearchQuery('');
      setSearchError('');
    } else {
      setSearchError('Localización no encontrada. Intenta con Sevilla, Madrid o Logroño.');
    }
  };

  const handleSelectFeatured = (city: string) => {
    setSelectedCityName(city);
    setSearchQuery('');
    setSearchError('');
  };

  // Helper de iconos climáticos
  const getWeatherIcon = (type: string, className = "w-6 h-6") => {
    switch (type) {
      case 'clear':
        return <Sun className={`${className} text-amber-400`} id={`icon-sun-${type}`} />;
      case 'rainy':
        return <CloudRain className={`${className} text-blue-400`} id={`icon-rain-${type}`} />;
      case 'cloudy':
      default:
        return <CloudSun className={`${className} text-slate-400`} id={`icon-cloud-${type}`} />;
    }
  };

  // Lógica de Anomalías Térmicas (Máxima o Mínima: diferencia de +-5 o superior)
  const getTempAnomalyInfo = (current: number, history: number) => {
    const diff = current - history;
    const isAnomalous = Math.abs(diff) >= 5;
    return {
      isAnomalous,
      diff,
      type: diff >= 5 ? 'exceso' : diff <= -5 ? 'defecto' : 'normal',
    };
  };

  // Lógica de Anomalías Pluviométricas según especificación de escala de porcentajes
  const getPluvioAnomalyInfo = (current: number, history: number) => {
    if (history === 0) {
      return {
        categoria: "Normal",
        mensaje_front: "Precipitación dentro de los rangos históricos normales para esta fecha (100.0%).",
        alerta: false,
        color_hex: "#388E3C"
      };
    }
    const percent = (current / history) * 100;
    const roundedPercent = parseFloat(percent.toFixed(1));
    const roundedStr = roundedPercent.toFixed(1);

    if (roundedPercent >= 0 && roundedPercent <= 40) {
      return {
        categoria: "Extremadamente seco",
        mensaje_front: `Anomalía severa por sequía. Apenas va a llover un ${roundedStr}% de lo habitual para esta época.`,
        alerta: true,
        color_hex: "#D32F2F"
      };
    } else if (roundedPercent > 40 && roundedPercent <= 60) {
      return {
        categoria: "Seco",
        mensaje_front: `Anomalía por escasez de lluvia. Se espera solo el ${roundedStr}% de la precipitación normal.`,
        alerta: true,
        color_hex: "#F57C00"
      };
    } else if (roundedPercent > 60 && roundedPercent <= 139) {
      return {
        categoria: "Normal",
        mensaje_front: `Precipitación dentro de los rangos históricos normales para esta fecha (${roundedStr}%).`,
        alerta: false,
        color_hex: "#388E3C"
      };
    } else if (roundedPercent >= 140 && roundedPercent <= 200) {
      return {
        categoria: "Muy húmedo",
        mensaje_front: `Anomalía por exceso de lluvia. Va a llover un ${roundedStr}% más de la media histórica.`,
        alerta: true,
        color_hex: "#1976D2"
      };
    } else {
      return {
        categoria: "Extremadamente húmedo",
        mensaje_front: `¡Alerta de lluvias históricas! Se prevé más del doble de lo normal (${roundedStr}%).`,
        alerta: true,
        color_hex: "#0D47A1"
      };
    }
  };

  // Mapeo auxiliar de categorías a estilos Tailwind
  const getPluvioTailwindClasses = (categoria: string) => {
    switch (categoria) {
      case "Extremadamente seco":
        return {
          bg: "bg-gradient-to-br from-red-950/65 via-slate-900/50 to-red-950/30 border-red-500/50 shadow-lg shadow-red-500/5 text-red-200",
          iconContainer: "bg-red-500/20 border-red-500/30 text-red-400",
          trendBadge: "bg-red-500 text-slate-100",
          messageText: "text-red-400 font-extrabold uppercase"
        };
      case "Seco":
        return {
          bg: "bg-gradient-to-br from-orange-950/65 via-slate-900/50 to-orange-950/30 border-orange-500/50 shadow-lg shadow-orange-500/5 text-orange-200",
          iconContainer: "bg-orange-500/20 border-orange-500/30 text-orange-400",
          trendBadge: "bg-orange-500 text-slate-950",
          messageText: "text-orange-400 font-extrabold uppercase"
        };
      case "Normal":
        return {
          bg: "bg-gradient-to-br from-emerald-950/40 via-slate-900/50 to-emerald-950/20 border-emerald-500/35 text-emerald-100",
          iconContainer: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
          trendBadge: "",
          messageText: "text-emerald-400 font-bold uppercase"
        };
      case "Muy húmedo":
        return {
          bg: "bg-gradient-to-br from-blue-950/65 via-slate-900/50 to-blue-950/30 border-blue-500/50 shadow-lg shadow-blue-500/5 text-blue-200",
          iconContainer: "bg-blue-500/20 border-blue-500/30 text-blue-400",
          trendBadge: "bg-blue-500 text-slate-100",
          messageText: "text-blue-400 font-extrabold uppercase"
        };
      case "Extremadamente húmedo":
      default:
        return {
          bg: "bg-gradient-to-br from-indigo-950/70 via-slate-900/50 to-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10 text-indigo-200",
          iconContainer: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",
          trendBadge: "bg-indigo-600 text-slate-100",
          messageText: "text-indigo-400 font-extrabold uppercase"
        };
    }
  };

  // Calcular anomalías para la ciudad seleccionada
  const anomalies = useMemo(() => {
    if (!cityData) return null;
    const tMax = getTempAnomalyInfo(cityData.today.tempMax, cityData.today.tempMaxHistory);
    const tMin = getTempAnomalyInfo(cityData.today.tempMin, cityData.today.tempMinHistory);
    const pluv = getPluvioAnomalyInfo(cityData.weeklyPluviometria, cityData.weeklyPluviometriaHistory);

    const hasAnyAnomaly = tMax.isAnomalous || tMin.isAnomalous || pluv.alerta;

    return {
      max: tMax,
      min: tMin,
      pluviometria: pluv,
      hasAnyAnomaly,
    };
  }, [cityData]);

  // Construcción del Aviso General (Dinámico y reactivo a los valores históicos de la ciudad)
  const generalNotice = useMemo(() => {
    if (!cityData || !anomalies) return null;

    const messages: string[] = [];

    if (anomalies.max.isAnomalous) {
      const dir = anomalies.max.diff > 0 ? 'exceso de calor' : 'defecto por frío';
      const dVal = Math.abs(anomalies.max.diff);
      messages.push(`Temperatura Máxima extrema (${dir} de +${dVal}°C vs media histórica de ${cityData.today.tempMaxHistory}°C)`);
    }

    if (anomalies.min.isAnomalous) {
      const dir = anomalies.min.diff > 0 ? 'exceso térmico nocturno' : 'defecto de frío extremo (heladas)';
      const dVal = Math.abs(anomalies.min.diff);
      messages.push(`Temperatura Mínima extrema (${dir} de +${dVal}°C de desviación vs histórica de ${cityData.today.tempMinHistory}°C)`);
    }

    if (anomalies.pluviometria.alerta) {
      messages.push(`${anomalies.pluviometria.categoria} (${anomalies.pluviometria.mensaje_front})`);
    }

    return {
      isAnomalous: anomalies.hasAnyAnomaly,
      title: anomalies.hasAnyAnomaly ? "AVISO DE ANOMALÍA CLIMÁTICA" : "ESTADO CLIMÁTICO ESTABLE",
      description: anomalies.hasAnyAnomaly 
        ? `Se han detectado desviaciones climáticas significativas respecto a la histórica local: ${messages.join('. ')}.`
        : "Todas las mediciones se encuentran dentro de las distribuciones históricas habituales para esta fecha (desviación < 5°C en temperatura y < 30% en pluviometría semanal)."
    };
  }, [cityData, anomalies]);

  // Datos adaptados para Gráfico de Líneas/Área de Recharts
  const chartData = useMemo(() => {
    if (!cityData) return [];
    return [
      {
        name: "Hoy",
        "Máx Prevista": cityData.today.tempMax,
        "Máx Histórica": cityData.today.tempMaxHistory,
        "Mín Prevista": cityData.today.tempMin,
        "Mín Histórica": cityData.today.tempMinHistory,
      },
      ...cityData.forecast.map(item => ({
        name: item.day,
        "Máx Prevista": item.tempMax,
        "Máx Histórica": item.tempMaxHistory,
        "Mín Prevista": item.tempMin,
        "Mín Histórica": item.tempMinHistory,
      }))
    ];
  }, [cityData]);

  return (
    <div 
      id="app-container" 
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center relative overflow-hidden font-sans select-none antialiased p-4 md:p-8"
    >
      {/* Fondo Ambient Decorativo Minimalista */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 z-0 opacity-100 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-radial from-blue-500/10 via-amber-500/5 to-transparent blur-3xl rounded-full z-0 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl mx-auto z-10 flex-grow flex flex-col justify-center">
        
        {/* PANTALLA INICIAL: Mientras no se ha elegido localización */}
        {!cityData ? (
          <div 
            id="welcome-screen" 
            className="w-full max-w-lg mx-auto bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl text-center flex flex-col items-center gap-8 transition-all duration-500"
          >
            {/* Cabecera / Icono */}
            <div className="flex flex-col items-center gap-3">
              <div 
                id="brand-logo" 
                className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20"
              >
                <CloudSun className="w-10 h-10 text-slate-950 stroke-[2]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mt-4">
                Monitoreo Climático
              </h1>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                Visualización de previsión diaria y semanal con detección en tiempo real de anomalías históricas.
              </p>
            </div>

            {/* Buscador de Localizaciones */}
            <form onSubmit={handleSearch} className="w-full space-y-3 relative" id="search-form">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Introduce una ciudad (Sevilla, Madrid, Logroño...)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchError) setSearchError('');
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all text-sm"
                  id="search-input"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {searchError && (
                <p className="text-xs text-red-400 text-left pl-2 flex items-center gap-1.5" id="error-message">
                  <AlertTriangle className="w-3.5 h-3.5" /> {searchError}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-white hover:bg-slate-100 text-slate-950 font-semibold py-3.5 px-6 rounded-2xl shadow-md cursor-pointer transition-all duration-200 active:scale-[0.98]"
                id="search-submit-btn"
              >
                Analizar Clima
              </button>
            </form>

            <div className="text-[10px] text-slate-600 font-mono mt-2">
              Detección Climática v2.5 • España
            </div>
          </div>
        ) : (
          
          /* VIEW 2: DASHBOARD CLIMÁTICO ACTIVO */
          <div className="space-y-6 transition-all duration-500" id="dashboard-view">
            
            {/* HEADER DEL DASHBOARD */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/35 backdrop-blur-xl border border-slate-900 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedCityName(null)}
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-400 hover:text-white cursor-pointer transition-all active:scale-95"
                  title="Volver a la búsqueda"
                  id="back-search-btn"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold uppercase tracking-widest mb-0.5">
                    <MapPin className="w-3.5 h-3.5" /> {cityData.region}
                  </div>
                  <h1 className="text-3xl font-black text-white leading-none">
                    {cityData.name}
                  </h1>
                </div>
              </div>

              {/* Fecha en Cabecera */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{cityData.today.date}</span>
                </div>
              </div>
            </div>

            {/* AVISO GENERAL DE ANOMALÍA O NORMALIDAD (Requisito) */}
            <div 
              id="general-notice-banner"
              className={`rounded-3xl p-6 border backdrop-blur-xl transition-all duration-300 ${
                generalNotice.isAnomalous 
                  ? "bg-gradient-to-r from-red-950/70 via-orange-950/60 to-red-950/40 border-orange-500/40 shadow-lg shadow-orange-900/10"
                  : "bg-gradient-to-r from-slate-900/60 to-blue-950/40 border-slate-800"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 md:mt-0 ${
                    generalNotice.isAnomalous 
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}>
                    {generalNotice.isAnomalous ? (
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    ) : (
                      <CheckCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold tracking-wider uppercase ${
                      generalNotice.isAnomalous ? "text-orange-400" : "text-blue-400"
                    }`}>
                      {generalNotice.title}
                    </h3>
                    <p className="text-slate-300 text-xs md:text-sm leading-relaxed mt-1">
                      {generalNotice.description}
                    </p>
                  </div>
                </div>

                {generalNotice.isAnomalous && (
                  <span className="shrink-0 text-[10px] font-black tracking-widest uppercase bg-orange-500 text-slate-950 px-2.5 py-1 rounded-full shadow-sm max-md:hidden">
                    Alerta Activa
                  </span>
                )}
              </div>
            </div>

            {/* TARJETAS PRINCIPALES DE DATOS CON LÓGICA DE ANOMALÍA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="metric-cards">
              
              {/* TARJETA 1: TEMPERATURA MÁXIMA PREVISTA HOY */}
              <div 
                id="card-max-temp"
                className={`rounded-3xl p-6 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between min-h-[170px] ${
                  (cityData.today.tempMax - cityData.today.tempMaxHistory) >= 5 
                    ? "bg-gradient-to-br from-red-950/80 via-orange-950/70 to-red-950/40 border-orange-500/60 shadow-lg shadow-orange-500/5 text-orange-200"
                    : (cityData.today.tempMax - cityData.today.tempMaxHistory) <= -5
                    ? "bg-gradient-to-br from-blue-950/80 via-slate-900/70 to-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10 text-blue-200"
                    : "bg-gradient-to-br from-emerald-950/40 via-slate-900/50 to-emerald-950/20 border-emerald-500/30 text-emerald-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Temp. Máxima prevista
                  </span>
                  <div className={`p-2 rounded-xl border ${
                    (cityData.today.tempMax - cityData.today.tempMaxHistory) >= 5
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400" 
                      : (cityData.today.tempMax - cityData.today.tempMaxHistory) <= -5
                      ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                      : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  }`}>
                    <Thermometer className="w-4 h-4" />
                  </div>
                </div>

                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tight shrink-0">
                      {cityData.today.tempMax} <span className="text-4xl font-light">ºC</span>
                    </span>
                    {(cityData.today.tempMax - cityData.today.tempMaxHistory) >= 5 ? (
                      <span className="text-xs font-black bg-orange-500 text-slate-950 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> +{Math.abs(cityData.today.tempMax - cityData.today.tempMaxHistory)}ºC
                      </span>
                    ) : (cityData.today.tempMax - cityData.today.tempMaxHistory) <= -5 ? (
                      <span className="text-xs font-black bg-blue-500 text-slate-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" /> {cityData.today.tempMax - cityData.today.tempMaxHistory}ºC
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-3 mt-1 text-xs flex justify-between items-center">
                  <span className="text-slate-400">Media Histórica:</span>
                  <span className="font-semibold text-white">{cityData.today.tempMaxHistory} ºC</span>
                </div>

                {(cityData.today.tempMax - cityData.today.tempMaxHistory) >= 5 ? (
                  <div className="text-[10px] uppercase font-bold text-orange-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Anomalía por Calor (+5ºC)
                  </div>
                ) : (cityData.today.tempMax - cityData.today.tempMaxHistory) <= -5 ? (
                  <div className="text-[10px] uppercase font-bold text-blue-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Anomalía por Frío (-5ºC)
                  </div>
                ) : (
                  <div className="text-[10px] uppercase font-bold text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> SIN ANOMALÍAS
                  </div>
                )}
              </div>

              {/* TARJETA 2: TEMPERATURA MÍNIMA PREVISTA HOY */}
              <div 
                id="card-min-temp"
                className={`rounded-3xl p-6 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between min-h-[170px] ${
                  (cityData.today.tempMin - cityData.today.tempMinHistory) >= 5 
                    ? "bg-gradient-to-br from-red-950/80 via-orange-950/70 to-red-950/40 border-orange-500/60 shadow-lg shadow-orange-500/5 text-orange-200"
                    : (cityData.today.tempMin - cityData.today.tempMinHistory) <= -5
                    ? "bg-gradient-to-br from-blue-950/80 via-slate-900/70 to-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10 text-blue-200"
                    : "bg-gradient-to-br from-emerald-950/40 via-slate-900/50 to-emerald-950/20 border-emerald-500/30 text-emerald-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Temp. Mínima prevista
                  </span>
                  <div className={`p-2 rounded-xl border ${
                    (cityData.today.tempMin - cityData.today.tempMinHistory) >= 5
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400" 
                      : (cityData.today.tempMin - cityData.today.tempMinHistory) <= -5
                      ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                      : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  }`}>
                    <Thermometer className="w-4 h-4 shrink-0" />
                  </div>
                </div>

                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tight shrink-0">
                      {cityData.today.tempMin} <span className="text-4xl font-light">ºC</span>
                    </span>
                    {(cityData.today.tempMin - cityData.today.tempMinHistory) >= 5 ? (
                      <span className="text-xs font-black bg-orange-500 text-slate-950 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> +{Math.abs(cityData.today.tempMin - cityData.today.tempMinHistory)}ºC
                      </span>
                    ) : (cityData.today.tempMin - cityData.today.tempMinHistory) <= -5 ? (
                      <span className="text-xs font-black bg-blue-500 text-slate-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" /> {cityData.today.tempMin - cityData.today.tempMinHistory}ºC
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-3 mt-1 text-xs flex justify-between items-center">
                  <span className="text-slate-400">Media Histórica:</span>
                  <span className="font-semibold text-white">{cityData.today.tempMinHistory} ºC</span>
                </div>

                {(cityData.today.tempMin - cityData.today.tempMinHistory) >= 5 ? (
                  <div className="text-[10px] uppercase font-bold text-orange-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Anomalía por Calor (+5ºC)
                  </div>
                ) : (cityData.today.tempMin - cityData.today.tempMinHistory) <= -5 ? (
                  <div className="text-[10px] uppercase font-bold text-blue-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Anomalía por Frío (-5ºC)
                  </div>
                ) : (
                  <div className="text-[10px] uppercase font-bold text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> SIN ANOMALÍAS
                  </div>
                )}
              </div>

              {/* TARJETA 3: PLUVIOMETRÍA SEMANAL DE LA ZONA */}
              {(() => {
                const pluvPercent = cityData.weeklyPluviometriaHistory > 0
                  ? (cityData.weeklyPluviometria / cityData.weeklyPluviometriaHistory) * 100
                  : 100;
                const pluvClasses = getPluvioTailwindClasses(anomalies.pluviometria.categoria);
                return (
                  <div 
                    id="card-weekly-pluvio"
                    className={`rounded-3xl p-6 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between min-h-[170px] ${pluvClasses.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Pluviometría Semanal Media
                      </span>
                      <div className={`p-2 rounded-xl border ${pluvClasses.iconContainer}`}>
                        <Droplets className="w-4 h-4 shrink-0" />
                      </div>
                    </div>

                    <div className="my-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tight shrink-0">
                          {cityData.weeklyPluviometria} <span className="text-4xl font-light text-slate-400">mm</span>
                        </span>
                        {anomalies.pluviometria.categoria !== "Normal" && (
                          <span className={`text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-0.5 ${pluvClasses.trendBadge}`}>
                            {pluvPercent >= 100 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {pluvPercent.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-800/60 pt-3 mt-1 text-xs flex justify-between items-center">
                      <span className="text-slate-400">Media Histórica:</span>
                      <span className="font-semibold text-white">{cityData.weeklyPluviometriaHistory} mm</span>
                    </div>

                    {anomalies.pluviometria.alerta ? (
                      <div className={`text-[10px] mt-2 flex items-center gap-1 ${pluvClasses.messageText}`}>
                        <AlertTriangle className="w-3.5 h-3.5" /> {anomalies.pluviometria.categoria}
                      </div>
                    ) : (
                      <div className={`text-[10px] mt-2 flex items-center gap-1 ${pluvClasses.messageText}`}>
                        <CheckCircle className="w-3.5 h-3.5" /> SIN ANOMALÍAS
                      </div>
                    )}
                    
                    <div className="text-[10px] text-slate-400 mt-1 leading-normal italic">
                      {anomalies.pluviometria.mensaje_front}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* GRÁFICA DE PREDICCIÓN CON RECHARTS */}
            <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-900 rounded-3xl p-6 shadow-xl" id="recharts-section">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase text-slate-300">
                    Gráfica de Tendencia Térmica
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Comparativa de previsión ({cityData.name}) versus promedios de estabilidad histórica regional.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="flex items-center gap-1.5 text-orange-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Máx Prevista
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-500/60">
                    <span className="w-2.5 h-1 border-b border-dashed border-amber-500" /> Histórica Máx
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Mín Prevista
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-400/50">
                    <span className="w-2.5 h-1 border-b border-dashed border-indigo-400" /> Histórica Mín
                  </span>
                </div>
              </div>

              {/* Contenedor del Gráfico */}
              <div className="h-64 md:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradientMax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradientMin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#334155', 
                        borderRadius: '1rem',
                        color: '#f8fafc',
                        fontSize: '11px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                      }}
                      itemStyle={{ padding: '2px 0' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Máx Prevista" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#gradientMax)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Máx Histórica" 
                      stroke="#d97706" 
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      fill="none" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Mín Prevista" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#gradientMin)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Mín Histórica" 
                      stroke="#6366f1" 
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      fill="none" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PREDICCIÓN HORIZONTAL: Próximos 6 días (Requisito) */}
            <div className="space-y-3" id="forecast-section">
              <div className="flex items-center justify-between pl-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" /> Previsión Próximos 6 Días
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Lógica de Anomalía Aplicada (Tarjeta destaca en Naranja/Rojo si +-5°C)
                </span>
              </div>

              {/* Lista horizontal */}
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4"
                id="forecast-list"
              >
                {cityData.forecast.map((item, index) => {
                  const maxDiff = item.tempMax - item.tempMaxHistory;
                  const minDiff = item.tempMin - item.tempMinHistory;
                  const maxAnom = Math.abs(maxDiff) >= 5;
                  const minAnom = Math.abs(minDiff) >= 5;
                  const hasDayAnomaly = maxAnom || minAnom;

                  let cardBgClass = "bg-gradient-to-br from-emerald-950/20 via-slate-900/40 to-slate-950/60 border-emerald-500/25 text-emerald-100";
                  let badgeText = "SIN ANOMALÍAS";
                  let badgeColor = "text-emerald-400";

                  if (maxDiff >= 5 || minDiff >= 5) {
                    cardBgClass = "bg-gradient-to-br from-red-950/50 via-orange-950/40 to-slate-950/60 border-orange-500/40 text-orange-200 shadow-md";
                    badgeText = "ANOMALÍA CALOR";
                    badgeColor = "text-orange-400 font-black";
                  } else if (maxDiff <= -5 || minDiff <= -5) {
                    cardBgClass = "bg-gradient-to-br from-blue-950/50 via-slate-900/40 to-slate-950/60 border-blue-500/40 text-blue-200";
                    badgeText = "ANOMALÍA FRÍO";
                    badgeColor = "text-blue-400 font-extrabold";
                  }

                  return (
                    <div
                      key={index}
                      className={`rounded-3xl p-5 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between items-center text-center ${cardBgClass}`}
                      id={`forecast-day-card-${index}`}
                    >
                      {/* Cabecera Tarjeta Forecast */}
                      <div className="space-y-1">
                        <span className="text-xs font-black uppercase text-slate-400 block tracking-wider">
                          {item.day}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {item.date}
                        </span>
                      </div>

                      {/* Icono Clima */}
                      <div className="my-3.5 relative">
                        {getWeatherIcon(item.weather, "w-10 h-10")}
                        {hasDayAnomaly && (
                          <span 
                            className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center border border-slate-950 ${
                              maxDiff >= 5 || minDiff >= 5 ? "bg-orange-500 text-slate-950" : "bg-blue-500 text-slate-100"
                            }`}
                            title="Desviación anómala"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      {/* Temperaturas: Max & Min */}
                      <div className="space-y-2 w-full">
                        {/* Temp Max */}
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-slate-400">Máx:</span>
                          <span className={`font-extrabold ${maxDiff >= 5 ? "text-orange-400" : maxDiff <= -5 ? "text-blue-400" : "text-slate-200"}`}>
                            {item.tempMax}º
                          </span>
                        </div>

                        {/* Temp Min */}
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-slate-400">Mín:</span>
                          <span className={`font-bold ${minDiff >= 5 ? "text-orange-300" : minDiff <= -5 ? "text-blue-300" : "text-slate-300"}`}>
                            {item.tempMin}º
                          </span>
                        </div>
                      </div>

                      {/* Indicador Detallado de Anomalía por día */}
                      <div className={`mt-3.5 pt-2 border-t border-slate-850 w-full text-[9px] uppercase tracking-wider ${badgeColor}`}>
                        {badgeText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>



          </div>
        )}

      </div>


    </div>
  );
}
