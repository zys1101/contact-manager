import { useState, useEffect } from 'react';
import { Spin } from 'antd';
import { CloudOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { weatherService, WeatherDay, getWeatherLabel, getWeatherEmoji } from '../../services/weatherService';
import styles from './WeatherWidget.module.css';

const WeatherWidget: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await weatherService.getThreeDayForecast();
        if (!cancelled) setWeatherData(data);
      } catch {
        if (!cancelled) setError('天气数据获取失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.title}>
          <EnvironmentOutlined /> 北京 · 未来三天
        </span>
      </div>

      <div className={styles.grid}>
        {loading && (
          <div className={styles.placeholder}>
            <Spin indicator={<CloudOutlined spin style={{ fontSize: 28 }} />} />
            <span>加载天气...</span>
          </div>
        )}
        {error && (
          <div className={styles.placeholder}>
            <CloudOutlined style={{ fontSize: 28, color: '#6b6e75' }} />
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && weatherData.length === 0 && (
          <div className={styles.placeholder}>
            <CloudOutlined style={{ fontSize: 28, color: '#6b6e75' }} />
            <span>暂无天气数据</span>
          </div>
        )}
        {weatherData.map((day, idx) => (
          <div key={day.date} className={styles.day} style={{ animationDelay: `${idx * 0.12}s` }}>
            <span className={styles.date}>
              {idx === 0 ? '今天' : idx === 1 ? '明天' : '后天'}
            </span>
            <span className={styles.emoji}>{getWeatherEmoji(day.weatherCode)}</span>
            <span className={styles.label}>{getWeatherLabel(day.weatherCode)}</span>
            <div className={styles.temp}>
              <span className={styles.tempHigh}>{day.tempMax}°</span>
              <span className={styles.tempSep}>/</span>
              <span className={styles.tempLow}>{day.tempMin}°</span>
            </div>
            <div className={styles.meta}>
              <span>风速 {day.windSpeed}km/h</span>
              <span>降雨 {day.rainProb}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherWidget;
