// src/services/weatherService.ts

export interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  windSpeed: number;
  rainProb: number;
}

// Open-Meteo: free, no API key required
const BASE = 'https://api.open-meteo.com/v1/forecast';

const WEATHER_LABELS: Record<number, string> = {
  0: '晴', 1: '晴', 2: '多云', 3: '阴',
  45: '雾', 48: '雾凇',
  51: '小雨', 53: '中雨', 55: '大雨',
  61: '小阵雨', 63: '中阵雨', 65: '大阵雨',
  71: '小雪', 73: '中雪', 75: '大雪',
  80: '阵雨', 81: '中阵雨', 82: '大阵雨',
  95: '雷暴', 96: '雷暴+冰雹', 99: '强雷暴',
};

function getWeatherLabel(code: number): string {
  return WEATHER_LABELS[code] || '未知';
}

function getWeatherEmoji(code: number): string {
  if (code <= 1) return '☀';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫';
  if (code <= 55) return '🌧';
  if (code <= 65) return '🌧';
  if (code <= 75) return '🌨';
  if (code <= 82) return '🌧';
  return '⛈';
}

class WeatherService {
  async getThreeDayForecast(lat = 39.9, lon = 116.4): Promise<WeatherDay[]> {
    const url = `${BASE}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max,precipitation_probability_max&timezone=auto&forecast_days=3`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('天气服务暂时不可用');

    const json = await resp.json();
    const { daily } = json;
    const result: WeatherDay[] = [];

    for (let i = 0; i < daily.time.length; i++) {
      result.push({
        date: daily.time[i],
        weatherCode: daily.weather_code[i],
        tempMax: Math.round(daily.temperature_2m_max[i]),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        windSpeed: Math.round(daily.wind_speed_10m_max[i]),
        rainProb: daily.precipitation_probability_max[i] ?? 0,
      });
    }
    return result;
  }
}

export const weatherService = new WeatherService();
export { getWeatherLabel, getWeatherEmoji };
