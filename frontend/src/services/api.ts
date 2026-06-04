// Empty string → relative URL → proxied by the Vite dev server to the backend.
// The proxy target is configured via VITE_API_URL in vite.config.ts (Node.js context),
// so the browser never needs to resolve the backend hostname directly.
const BASE_URL = '';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export interface ForecastDay {
  date: string;
  day_offset: number;
  tmax: number;
  tmin: number;
  precip: number;
  tmax_anomaly: string | null;
  tmin_anomaly: string | null;
}

export interface Normal {
  day_of_year: number;
  tmax_mean: number;
  tmin_mean: number;
  precip_mean: number;
}

export interface WeatherResponse {
  location: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country: string | null;
    region: string | null;
  };
  forecast: ForecastDay[];
  precip_anomaly: { value_pct: number | null; category: string };
  normals: Normal[];
}

export async function fetchWeather(cityName: string): Promise<WeatherResponse> {
  // Step 1: geocode city name → coordinates
  let geoRes: Response;
  try {
    geoRes = await fetch(
      `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=es&format=json`
    );
  } catch {
    throw new Error('No se pudo conectar al servicio de geocodificación. Verifica tu conexión a internet.');
  }
  if (!geoRes.ok) {
    throw new Error('El servicio de geocodificación devolvió un error. Inténtalo de nuevo.');
  }

  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`No se encontró ninguna localización para "${cityName}". Prueba con otro nombre.`);
  }

  const geo = geoData.results[0];

  // Step 2: call our backend
  const params = new URLSearchParams({
    lat: String(geo.latitude),
    lon: String(geo.longitude),
    name: geo.name,
  });
  if (geo.country) params.append('country', geo.country);
  if (geo.admin1) params.append('region', geo.admin1);

  let weatherRes: Response;
  try {
    weatherRes = await fetch(`${BASE_URL}/api/v1/weather?${params}`);
  } catch {
    throw new Error('No se puede conectar con el servidor. ¿Está el backend en ejecución?');
  }

  if (!weatherRes.ok) {
    throw new Error(`Error del servidor (${weatherRes.status}). Inténtalo de nuevo.`);
  }

  return weatherRes.json();
}
