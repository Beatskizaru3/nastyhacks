// src/admin/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2'; // Будет использоваться для графика
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'; // Для Chart.js
import styles from './Dashboard.module.scss'; // Создайте этот SCSS модуль

// Зарегистрируйте компоненты Chart.js, если будете использовать
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

function Dashboard() {
  // Состояние для хранения данных статистики
  const [downloadStats, setDownloadStats] = useState([]);
  const [topFiles24h, setTopFiles24h] = useState([]);
  const [topFilesWeek, setTopFilesWeek] = useState([]);
  const [topFilesMonth, setTopFilesMonth] = useState([]);
  const [timeframe, setTimeframe] = useState('day'); // 'day', 'week', 'month', 'custom'
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });

  // Эффект для загрузки данных при изменении timeframe или customDateRange
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Здесь будет логика запросов к вашему GoLang бэкенду
      // Пример:
      // const statsResponse = await fetch(`/api/admin/stats/downloads?timeframe=${timeframe}&start=${customDateRange.start || ''}&end=${customDateRange.end || ''}`);
      // const statsData = await statsResponse.json();
      // setDownloadStats(statsData);

      // const top24hResponse = await fetch('/api/admin/stats/top-files?period=24h');
      // const top24hData = await top24hResponse.json();
      // setTopFiles24h(top24hData);

      // ... и так далее для недели и месяца

      // ЗАГЛУШКИ ДЛЯ ТЕСТИРОВАНИЯ UI
      setDownloadStats(generateDummyChartData(timeframe));
      setTopFiles24h([
        { id: 'file1', title: 'Script A', downloads: 150 },
        { id: 'file2', title: 'Script B', downloads: 120 },
      ]);
      setTopFilesWeek([
        { id: 'file3', title: 'Script C', downloads: 800 },
        { id: 'file4', title: 'Script D', downloads: 750 },
      ]);
      setTopFilesMonth([
        { id: 'file5', title: 'Script E', downloads: 3500 },
        { id: 'file6', title: 'Script F', downloads: 3200 },
      ]);
    };

    fetchDashboardData();
  }, [timeframe, customDateRange]);

  // Вспомогательная функция для генерации фейковых данных графика
  const generateDummyChartData = (period) => {
    let labels = [];
    let data = [];
    if (period === 'day') {
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 50));
    } else if (period === 'week') {
      labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      data = Array.from({ length: 7 }, () => Math.floor(Math.random() * 500));
    } else if (period === 'month') {
      labels = Array.from({ length: 30 }, (_, i) => `День ${i + 1}`);
      data = Array.from({ length: 30 }, () => Math.floor(Math.random() * 2000));
    }
    // Для customDateRange нужно будет более сложная логика
    return {
      labels: labels,
      datasets: [
        {
          label: 'Количество скачиваний',
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };
  };

  // Опции для графика (пример)
//   const chartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: 'top',
//       },
//       title: {
//         display: true,
//         text: 'Статистика скачиваний',
//       },
//     },
//   };

  return (
    <div className={styles.dashboard}>
      <h1>Статистика и аналитика</h1>

      <section className={styles.statsSection}>
        <h2>Статистика скачиваний</h2>
        <div className={styles.timeframeControls}>
          <button 
            className={timeframe === 'day' ? styles.active : ''}
            onClick={() => setTimeframe('day')}>За день</button>
          <button 
            className={timeframe === 'week' ? styles.active : ''}
            onClick={() => setTimeframe('week')}>За неделю</button>
          <button 
            className={timeframe === 'month' ? styles.active : ''}
            onClick={() => setTimeframe('month')}>За месяц</button>
          {/* Добавить выбор даты для "Самому указать дату" */}
          {/* <input type="date" value={customDateRange.start} onChange={e => setCustomDateRange({...customDateRange, start: e.target.value})} /> */}
          {/* <input type="date" value={customDateRange.end} onChange={e => setCustomDateRange({...customDateRange, end: e.target.value})} /> */}
          {/* <button onClick={() => setTimeframe('custom')}>Применить</button> */}
        </div>
        <div className={styles.chartContainer}>
          {downloadStats.labels && downloadStats.labels.length > 0 ? (
            // <Line data={downloadStats} options={chartOptions} />
            <p>Место для графика скачиваний</p> // Замените на компонент <Line />
          ) : (
            <p>Нет данных для отображения статистики.</p>
          )}
        </div>
      </section>

      <section className={styles.topFilesSection}>
        <h2>Топовые файлы по скачиваниям</h2>

        <div className={styles.topFilesGrid}>
          <div className={styles.topFilesCard}>
            <h3>За 24 часа</h3>
            <ul>
              {topFiles24h.map(file => (
                <li key={file.id}>{file.title} ({file.downloads} скачиваний)</li>
              ))}
            </ul>
          </div>

          <div className={styles.topFilesCard}>
            <h3>За неделю</h3>
            <ul>
              {topFilesWeek.map(file => (
                <li key={file.id}>{file.title} ({file.downloads} скачиваний)</li>
              ))}
            </ul>
          </div>

          <div className={styles.topFilesCard}>
            <h3>За месяц</h3>
            <ul>
              {topFilesMonth.map(file => (
                <li key={file.id}>{file.title} ({file.downloads} скачиваний)</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;