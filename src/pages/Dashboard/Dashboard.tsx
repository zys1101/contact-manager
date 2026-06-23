// src/pages/Dashboard/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Card, Spin, Empty, message } from 'antd';
import {
  TeamOutlined, StopOutlined, ClockCircleOutlined,
  CheckCircleOutlined, GiftOutlined, UserOutlined,
  ContactsOutlined, FileTextOutlined,
  ImportOutlined, ExportOutlined,
} from '@ant-design/icons';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, PieLabelRenderProps,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { dashboardService, DashboardData } from '../../services/dashboardService';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/api';
import styles from './Dashboard.module.css';

const GENDER_COLORS = ['#1890ff', '#eb2f96'];
const LINE_COLOR = '#d4a853';
const COMPLETED_COLOR = '#52c41a';
const UNCOMPLETED_COLOR = '#d9d9d9';

/** pie label renderer */
const renderPieLabel = ({ name, percent }: PieLabelRenderProps) => {
  const pct = typeof percent === 'number' ? (percent * 100).toFixed(0) : '0';
  return `${name} ${pct}%`;
};

/** line chart custom tooltip */
const LineTooltip = (props: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  const { active, payload, label } = props;
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fff', padding: '8px 12px', borderRadius: 8,
        border: '1px solid #e8eaef', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 12, color: '#8c8e94', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e1f24' }}>
          新增 {payload[0].value} 人
        </div>
      </div>
    );
  }
  return null;
};

/** x-axis tick formatter */
const formatMonth = (val: string) => {
  const parts = val.split('-');
  return `${parts[1]}月`;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  // Sync theme to backend
  const handleToggleTheme = async () => {
    toggleTheme();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    try {
      await apiService.put('/user/theme', { theme: newTheme });
    } catch {
      // ignore - theme will be synced next time
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await dashboardService.getDashboardStats();
        setData(result);
      } catch {
        message.error('获取Dashboard数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.loadingContainer}>
        <Empty description="暂无数据" />
      </div>
    );
  }

  const { statsCard, genderDistribution, matterCompletion, contactGrowth, birthdayReminders } = data;

  const completionPieData = [
    { name: '已完成', value: matterCompletion.completed },
    { name: '未完成', value: matterCompletion.uncompleted },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>DATA CENTER</p>
        </div>

        {/* Navigation */}
        <div className={styles.navBar}>
          <button className={styles.navBtn} onClick={() => navigate('/contacts')}>
            <ContactsOutlined /> 联系人管理
          </button>
          <button className={styles.navBtn} onClick={() => navigate('/reminders')}>
            <FileTextOutlined /> 事项提醒
          </button>
          <button className={styles.navBtn} onClick={() => navigate('/blacklist')}>
            <StopOutlined /> 黑名单
          </button>
          <button className={styles.navBtn} onClick={() => navigate('/tags')}>
            <span style={{ fontSize: 16 }}>🏷️</span> 标签管理
          </button>
          <button className={styles.navBtn} onClick={() => navigate('/logs')}>
            <span style={{ fontSize: 16 }}>📋</span> 操作日志
          </button>
          <button className={styles.navBtn} onClick={() => navigate('/contacts/excel')}>
            <span style={{ fontSize: 16 }}>📊</span> Excel导入导出
          </button>
        </div>

        {/* Theme Toggle */}
        <div className={styles.themeToggle}>
          <button className={styles.themeBtn} onClick={handleToggleTheme} title="切换主题">
            {theme === 'light' ? '🌙 深色模式' : '☀️ 浅色模式'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconContacts}`}>
              <TeamOutlined />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{statsCard.totalContacts}</span>
              <span className={styles.statLabel}>联系人总数</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconBlacklist}`}>
              <StopOutlined />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{statsCard.blacklistCount}</span>
              <span className={styles.statLabel}>黑名单人数</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconPending}`}>
              <ClockCircleOutlined />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{statsCard.pendingMatters}</span>
              <span className={styles.statLabel}>待完成事项</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconCompleted}`}>
              <CheckCircleOutlined />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{statsCard.completedMatters}</span>
              <span className={styles.statLabel}>已完成事项</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconBirthday}`}>
              <GiftOutlined />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{statsCard.birthdayThisMonth}</span>
              <span className={styles.statLabel}>本月生日人数</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className={styles.chartsRow}>
          {/* Gender Distribution Pie */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>联系人性别分布</h3>
            <p className={styles.chartSubtitle}>GENDER DISTRIBUTION</p>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={renderPieLabel}
                  >
                    {genderDistribution.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={GENDER_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion Rate Ring */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>事项完成率</h3>
            <p className={styles.chartSubtitle}>COMPLETION RATE</p>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={renderPieLabel}
                  >
                    <Cell fill={COMPLETED_COLOR} />
                    <Cell fill={UNCOMPLETED_COLOR} />
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Growth Trend Line Chart */}
        <div className={styles.growthCard}>
          <h3 className={styles.chartTitle}>联系人增长趋势</h3>
          <p className={styles.chartSubtitle}>CONTACT GROWTH TREND</p>
          <div className={styles.growthWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contactGrowth} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#8c8e94' }}
                  tickFormatter={formatMonth}
                />
                <YAxis tick={{ fontSize: 12, fill: '#8c8e94' }} allowDecimals={false} />
                <Tooltip content={<LineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={LINE_COLOR}
                  strokeWidth={2}
                  dot={{ r: 4, fill: LINE_COLOR, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: LINE_COLOR, strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Birthday Reminders */}
        <div className={styles.birthdayCard}>
          <div className={styles.birthdayHeader}>
            <h3 className={styles.birthdayTitle}>🎂 最近生日提醒</h3>
            <span className={styles.birthdayCount}>{birthdayReminders.length} 条</span>
          </div>

          {birthdayReminders.length === 0 ? (
            <Empty description="暂无生日提醒" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className={styles.birthdayList}>
              {birthdayReminders.map((item) => (
                <div
                  key={item.ctId}
                  className={styles.birthdayItem}
                  onClick={() => navigate(`/contacts/detail/${item.ctId}`)}
                >
                  <div className={styles.birthdayAvatar}>
                    {item.ctName.charAt(0)}
                  </div>
                  <div className={styles.birthdayInfo}>
                    <span className={styles.birthdayName}>{item.ctName}</span>
                    <span className={styles.birthdayDate}>
                      生日：{item.ctBirth?.replace(/-/g, '/').slice(5)}
                    </span>
                  </div>
                  <span className={`${styles.birthdayBadge} ${
                    item.daysUntilBirthday === 0
                      ? styles.badgeToday
                      : item.daysUntilBirthday <= 7
                        ? styles.badgeSoon
                        : styles.badgeNormal
                  }`}>
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;