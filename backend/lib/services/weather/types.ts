export interface GeoLocation {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

export type WeatherQueryType = 'current' | 'forecast' | 'air_pollution';

export interface CurrentWeatherResponse {
  weather: { main: string; description: string }[];
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  wind: { speed: number };
  name: string;
  visibility: number;
}

/** 实时天气精简结果 */
export interface CurrentWeatherResult {
  type: 'current';
  city: string;
  country: string;
  weather: string;
  description: string;
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
}

// ---------------------------------------------------------------------------
// 16 天每日预报
// ---------------------------------------------------------------------------

/** Forecast Daily API 原始响应中的单日数据 */
export interface ForecastDayRaw {
  dt: number;
  temp: { day: number; min: number; max: number; night: number };
  feels_like: { day: number };
  humidity: number;
  weather: { main: string; description: string }[];
  speed: number;
  pop: number;
}

/** Forecast Daily API 原始响应 */
export interface ForecastDailyResponse {
  city: { name: string; country: string };
  list: ForecastDayRaw[];
}

/** 单日预报精简结果 */
export interface ForecastDayResult {
  date: string;
  weather: string;
  description: string;
  tempDay: number;
  tempNight: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
}

/** 预报查询结果 */
export interface ForecastResult {
  type: 'forecast';
  city: string;
  country: string;
  days: ForecastDayResult[];
}

// ---------------------------------------------------------------------------
// 空气质量
// ---------------------------------------------------------------------------

/** Air Pollution API 原始响应 */
export interface AirPollutionResponse {
  list: {
    main: { aqi: number };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
  }[];
}

/** 空气质量精简结果 */
export interface AirPollutionResult {
  type: 'air_pollution';
  city: string;
  country: string;
  aqi: number;
  aqiLabel: string;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
}

// ---------------------------------------------------------------------------
// 联合类型
// ---------------------------------------------------------------------------

/** 天气查询结果（所有类型的联合） */
export type WeatherResult =
  | CurrentWeatherResult
  | ForecastResult
  | AirPollutionResult;
