import { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, Spin, Empty, Button, Tag } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { reminderService } from '../../services/reminderService';
import { Reminder, MatterStatus } from '../../types/reminder';
import styles from './Timeline.module.css';

const { Option } = Select;

interface GroupedMatter {
  date: string;
  items: Reminder[];
}

const Timeline: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [matters, setMatters] = useState<Reminder[]>([]);
  const [statusFilter, setStatusFilter] = useState<MatterStatus | ''>('');
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('desc');

  const loadMatters = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all matters (large page size)
      const response = await reminderService.getReminders({
        page: 1,
        pageSize: 100,
        matterDelete: statusFilter || undefined,
        sortBy: 'matterTime',
        sortOrder: sortBy,
      });
      setMatters(response.list || []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy]);

  useEffect(() => { loadMatters(); }, [loadMatters]);

  // Group by date
  const groupedMatters: GroupedMatter[] = useMemo(() => {
    const groups: Record<string, Reminder[]> = {};
    matters.forEach((m) => {
      const date = dayjs(m.matterTime).format('YYYY-MM-DD');
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });

    return Object.entries(groups)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => sortBy === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  }, [matters, sortBy]);

  const getStatusTag = (status: MatterStatus) => {
    const cfg: Record<MatterStatus, { color: string; text: string }> = {
      [MatterStatus.PENDING]: { color: 'orange', text: '待完成' },
      [MatterStatus.CANCELLED]: { color: 'default', text: '已取消' },
      [MatterStatus.COMPLETED]: { color: 'green', text: '已完成' },
    };
    const c = cfg[status];
    return <Tag color={c.color}>{c.text}</Tag>;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
          <ArrowLeftOutlined /> 返回
        </button>

        <div className={styles.header}>
          <h1 className={styles.title}>事项时间轴</h1>
          <p className={styles.subtitle}>TIMELINE VIEW</p>
        </div>

        <div className={styles.filterBar}>
          <Select
            placeholder="状态筛选"
            allowClear
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v ?? '')}
            style={{ width: 130 }}
          >
            <Option value={MatterStatus.PENDING}>待完成</Option>
            <Option value={MatterStatus.COMPLETED}>已完成</Option>
            <Option value={MatterStatus.CANCELLED}>已取消</Option>
          </Select>
          <Select value={sortBy} onChange={setSortBy} style={{ width: 120 }}>
            <Option value="desc">时间降序</Option>
            <Option value="asc">时间升序</Option>
          </Select>
          <Button onClick={loadMatters}>刷新</Button>
        </div>

        {groupedMatters.length === 0 ? (
          <Empty description="暂无事项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className={styles.timeline}>
            {groupedMatters.map((group) => (
              <div key={group.date} className={styles.dateGroup}>
                <div className={styles.dateLabel} />
                <div className={styles.dateText}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  {group.date}
                </div>
                {group.items.map((item) => (
                  <div key={item.matterId} className={styles.matterCard}>
                    <div className={styles.matterTime}>
                      {dayjs(item.matterTime).format('HH:mm')}
                    </div>
                    <div className={styles.matterContent}>
                      <div className={styles.matterName}>{item.matter}</div>
                      {item.contactName && (
                        <div className={styles.matterDesc}>联系人: {item.contactName}</div>
                      )}
                    </div>
                    {getStatusTag(item.matterDelete)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
