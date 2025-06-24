// src/admin/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import styles from './Dashboard.module.scss';

// Зарегистрируйте компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [downloadStats, setDownloadStats] = useState({ labels: [], datasets: [] });
  // Инициализируем как пустые массивы, чтобы избежать 'null'
  const [topFiles24h, setTopFiles24h] = useState([]);
  const [topFilesWeek, setTopFilesWeek] = useState([]);
  const [topFilesMonth, setTopFilesMonth] = useState([]);
  
  const [timeframe, setTimeframe] = useState('day'); // 'day', 'week', 'month'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log(`[Dashboard DEBUG] fetchDashboardData: Запущен для timeframe: ${timeframe}`);
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('[Dashboard ERROR] Токен аутентификации не найден в localStorage.');
          setError('Вы не авторизованы. Пожалуйста, войдите в систему.');
          setLoading(false);
          return;
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        // --- Загрузка статистики скачиваний для графика ---
        const statsUrl = `${API_BASE_URL}/api/admin/stats/downloads?timeframe=${timeframe}`;
        console.log(`[Dashboard DEBUG] Запрос статистики: ${statsUrl}`);
        const statsResponse = await fetch(statsUrl, { headers });
        
        console.log(`[Dashboard DEBUG] Ответ на запрос статистики: статус ${statsResponse.status}`);
        if (!statsResponse.ok) {
          const errorText = await statsResponse.text();
          console.error(`[Dashboard ERROR] Ошибка HTTP для статистики, статус ${statsResponse.status}: ${errorText.substring(0, 100)}...`);
          throw new Error(`HTTP error! status: ${statsResponse.status}. Message: ${errorText.substring(0, 100)}...`);
        }
        const statsData = await statsResponse.json();
        setDownloadStats({
          labels: statsData.labels,
          datasets: [
            {
              label: 'Количество скачиваний',
              data: statsData.data,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.1,
              fill: false
            },
          ],
        });
        console.log('[Dashboard DEBUG] Загружены данные для графика:', statsData);


        // --- Загрузка топовых файлов ---
        const top24hUrl = `${API_BASE_URL}/api/admin/stats/top-files?period=24h&limit=5`;
        const topWeekUrl = `${API_BASE_URL}/api/admin/stats/top-files?period=week&limit=5`;
        const topMonthUrl = `${API_BASE_URL}/api/admin/stats/top-files?period=month&limit=5`;

        console.log(`[Dashboard DEBUG] Запросы топовых файлов: ${top24hUrl}, ${topWeekUrl}, ${topMonthUrl}`);

        const [top24hRes, topWeekRes, topMonthRes] = await Promise.all([
          fetch(top24hUrl, { headers }),
          fetch(topWeekUrl, { headers }),
          fetch(topMonthUrl, { headers })
        ]);

        console.log(`[Dashboard DEBUG] Статусы ответов топовых файлов: 24h=${top24hRes.status}, Week=${topWeekRes.status}, Month=${topMonthRes.status}`);

        if (!top24hRes.ok || !topWeekRes.ok || !topMonthRes.ok) {
          const err24h = !top24hRes.ok ? await top24hRes.text() : '';
          const errWeek = !topWeekRes.ok ? await topWeekRes.text() : '';
          const errMonth = !topMonthRes.ok ? await topMonthRes.text() : '';
          console.error(`[Dashboard ERROR] Ошибка HTTP при загрузке топовых файлов: 24h: ${top24hRes.status} ${err24h.substring(0, 50)}, Week: ${topWeekRes.status} ${errWeek.substring(0, 50)}, Month: ${topMonthRes.status} ${errMonth.substring(0, 50)}`);
          throw new Error('Ошибка при загрузке топовых файлов.');
        }

        const top24hData = await top24hRes.json();
        const topWeekData = await topWeekRes.json();
        const topMonthData = await topMonthRes.json();
        
        // --- Важно: Добавляем проверку, что данные являются массивами. Если нет, устанавливаем пустой массив. ---
        setTopFiles24h(Array.isArray(top24hData) ? top24hData : []);
        setTopFilesWeek(Array.isArray(topWeekData) ? topWeekData : []);
        setTopFilesMonth(Array.isArray(topMonthData) ? topMonthData : []);
        console.log('[Dashboard DEBUG] Загружены топовые файлы:', { top24hData, topWeekData, topMonthData });

      } catch (err) {
        console.error('[Dashboard ERROR] Общая ошибка при загрузке данных дашборда:', err);
        setError('Не удалось загрузить данные дашборда: ' + err.message);
      } finally {
        console.log('[Dashboard DEBUG] fetchDashboardData: Завершено.');
        setLoading(false);
      }
    };

    console.log(`[Dashboard DEBUG] useEffect: timeframe изменился на ${timeframe}. Вызываю fetchDashboardData.`);
    fetchDashboardData();
  }, [timeframe]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Статистика скачиваний',
        color: '#fff',
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#ccc',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#ccc',
          stepSize: 1,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        min: 0
      },
    },
  };

  console.log(`[Dashboard RENDER] Рендер компонента. Loading: ${loading}, Error: ${error}, Timeframe: ${timeframe}`);

  if (loading) {
    return <div className={styles.dashboardLoading}>Загрузка данных дашборда...</div>;
  }

  if (error) {
    return <div className={styles.dashboardError}>Ошибка: {error}</div>;
  }

  return (
    <div className={styles.dashboard}>
      <h1>Статистика и аналитика</h1>

      <section className={styles.statsSection}>
        <h2>Статистика скачиваний</h2>
        <div className={styles.timeframeControls}>
          <button 
            className={timeframe === 'day' ? styles.active : ''}
            onClick={() => {
              console.log('[Dashboard DEBUG] Клик: "За день"');
              setTimeframe('day');
            }}>За день</button>
          <button 
            className={timeframe === 'week' ? styles.active : ''}
            onClick={() => {
              console.log('[Dashboard DEBUG] Клик: "За неделю"');
              setTimeframe('week');
            }}>За неделю</button>
          <button 
            className={timeframe === 'month' ? styles.active : ''}
            onClick={() => {
              console.log('[Dashboard DEBUG] Клик: "За месяц"');
              setTimeframe('month');
            }}>За месяц</button>
        </div>
        <div className={styles.chartContainer}>
          {downloadStats.labels && downloadStats.labels.length > 0 ? (
            <Line data={downloadStats} options={chartOptions} />
          ) : (
            <p>Нет данных для отображения статистики за выбранный период.</p>
          )}
        </div>
      </section>

      <section className={styles.topFilesSection}>
        <h2>Топовые файлы по скачиваниям</h2>

        <div className={styles.topFilesGrid}>
          <div className={styles.topFilesCard}>
            <h3>За 24 часа</h3>
            <ul>
              {/* Проверка на Array.isArray перед map */}
              {Array.isArray(topFiles24h) && topFiles24h.length > 0 ? topFiles24h.map(file => (
                <li key={file.id}>{file.title} ({file.downloads} скачиваний)</li>
              )) : <li>Нет данных.</li>}
            </ul>
          </div>

          <div className={styles.topFilesCard}>
            <h3>За неделю</h3>
            <ul>
              {/* Проверка на Array.isArray перед map */}
              {Array.isArray(topFilesWeek) && topFilesWeek.length > 0 ? topFilesWeek.map(file => (
                <li key={file.id}>{file.title} ({file.downloads} скачиваний)</li>
              )) : <li>Нет данных.</li>}
            </ul>
          </div>

          <div className={styles.topFilesCard}>
            <h3>За месяц</h3>
            <ul>
              {/* Проверка на Array.isArray перед map */}
              {Array.isArray(topFilesMonth) && topFilesMonth.length > 0 ? topFilesMonth.map(file => (
                <li key={file.id}>{file.title} ({file.downloads} скачиваний)</li>
              )) : <li>Нет данных.</li>}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;