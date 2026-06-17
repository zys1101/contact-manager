import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Modal, message, Tag, Card,
  Popconfirm, Spin, Empty, DatePicker, Form,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined,
  CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined,
  CalendarOutlined, UserOutlined, ArrowLeftOutlined,
  CloudOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useSearchParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { reminderService } from '../../services/reminderService';
import { weatherService, WeatherDay, getWeatherLabel, getWeatherEmoji } from '../../services/weatherService';
import { Reminder, ReminderQueryParams, ReminderFormData, MatterStatus } from '../../types';
import styles from './Reminders.module.css';

const { Search } = Input;
const { Option } = Select;

const Reminders: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ctIdFromUrl = searchParams.get('ctId');

  // ---- reminders state ----
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchContent, setSearchContent] = useState('');
  const [statusFilter, setStatusFilter] = useState<MatterStatus | ''>('');
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc');

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  // ---- weather state ----
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const params: ReminderQueryParams = {
        page: currentPage,
        pageSize,
        matter: searchContent || undefined,
        matterDelete: statusFilter || undefined,
        ctId: ctIdFromUrl || undefined,
        sortBy: 'matterTime',
        sortOrder: sortBy,
      };
      const response = await reminderService.getReminders(params);
      setReminders(response.list);
      setTotal(response.total);
    } catch {
      message.error('加载事项列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, sortBy, searchContent, ctIdFromUrl]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // ---- weather fetch ----
  useEffect(() => {
    let cancelled = false;
    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const data = await weatherService.getThreeDayForecast();
        if (!cancelled) setWeatherData(data);
      } catch {
        if (!cancelled) setWeatherError('天气数据获取失败');
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    };
    fetchWeather();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    loadReminders();
  };

  const handleReset = () => {
    setSearchContent('');
    setStatusFilter('');
    setSortBy('asc');
    setCurrentPage(1);
  };

  const handleComplete = async (id: string) => {
    try {
      await reminderService.completeReminder(id);
      message.success('事项已完成');
      loadReminders();
    } catch {
      message.error('操作失败');
    }
  };

  const handleCancelActivity = async (id: string) => {
    try {
      await reminderService.cancelReminder(id);
      message.success('事项已取消');
      loadReminders();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reminderService.deleteReminder(id);
      message.success('删除成功');
      loadReminders();
    } catch {
      message.error('删除失败');
    }
  };

  const handleAddReminder = () => {
    form.resetFields();
    if (ctIdFromUrl) {
      form.setFieldsValue({ ctId: ctIdFromUrl });
    }
    setAddModalVisible(true);
  };

  const handleSubmitReminder = async (values: Record<string, unknown>) => {
    try {
      const data: ReminderFormData = {
        ctId: values.ctId as string,
        matterTime: (values.matterTime as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss'),
        matter: values.matter as string,
      };
      await reminderService.createReminder(data);
      message.success('事项添加成功');
      setAddModalVisible(false);
      loadReminders();
    } catch {
      message.error('添加失败');
    }
  };

  const getStatusTag = (status: MatterStatus) => {
    const statusConfig: Record<MatterStatus, { color: string; text: string }> = {
      [MatterStatus.PENDING]: { color: 'orange', text: '待完成' },
      [MatterStatus.CANCELLED]: { color: 'default', text: '已取消' },
      [MatterStatus.COMPLETED]: { color: 'green', text: '已完成' },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleBack = () => {
    if (ctIdFromUrl) {
      navigate(`/contacts/detail/${ctIdFromUrl}`);
    } else {
      navigate('/contacts');
    }
  };

  const columns: ColumnsType<Reminder> = [
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 120,
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: '事项时间',
      dataIndex: 'matterTime',
      key: 'matterTime',
      width: 180,
      sorter: true,
      render: (time: string) => (
        <Space>
          <CalendarOutlined />
          {dayjs(time).format('YYYY-MM-DD HH:mm')}
        </Space>
      ),
    },
    {
      title: '事项内容',
      dataIndex: 'matter',
      key: 'matter',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'matterDelete',
      key: 'matterDelete',
      width: 100,
      render: (status: MatterStatus) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => {
        const isPending = record.matterDelete === MatterStatus.PENDING;
        return (
          <Space size="small">
            {isPending && (
              <>
                <Button
                  type="link" size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleComplete(record.matterId)}
                  style={{ color: '#52c41a' }}
                >
                  完成
                </Button>
                <Button
                  type="link" size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleCancelActivity(record.matterId)}
                  style={{ color: '#faad14' }}
                >
                  取消
                </Button>
              </>
            )}
            <Popconfirm
              title="确定要删除此事项吗？"
              onConfirm={() => handleDelete(record.matterId)}
              okText="确定" cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const paginationConfig = {
    current: currentPage,
    pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (t: number) => `共 ${t} 条记录`,
    onChange: (page: number, size: number) => {
      setCurrentPage(page);
      setPageSize(size);
    },
  };

  return (
    <div className={styles.container}>
      <div className={styles.bg}>
        <div className={styles.grain} />
        <div className={styles.orb} />
      </div>

      <div className={styles.wrapper}>
        <button className={styles.backBtn} onClick={handleBack}>
          <ArrowLeftOutlined />
          {ctIdFromUrl ? '返回联系人详情' : '返回联系人列表'}
        </button>

        {/* ====== HEADER ====== */}
        <div className={styles.header}>
          <h1 className={styles.title}>事项提醒</h1>
          <p className={styles.subtitle}>REMINDERS MANAGEMENT</p>
        </div>

        {/* ====== WEATHER CARD ====== */}
        <div className={styles.weatherCard}>
          <div className={styles.weatherHead}>
            <span className={styles.weatherTitle}>
              <EnvironmentOutlined /> 北京 · 未来三天
            </span>
          </div>
          <div className={styles.weatherGrid}>
            {weatherLoading && (
              <div className={styles.weatherPlaceholder}>
                <Spin indicator={<CloudOutlined spin style={{ fontSize: 28 }} />} />
                <span>加载天气...</span>
              </div>
            )}
            {weatherError && (
              <div className={styles.weatherPlaceholder}>
                <CloudOutlined style={{ fontSize: 28, color: '#6b6e75' }} />
                <span>{weatherError}</span>
              </div>
            )}
            {!weatherLoading && !weatherError && weatherData.length === 0 && (
              <div className={styles.weatherPlaceholder}>
                <CloudOutlined style={{ fontSize: 28, color: '#6b6e75' }} />
                <span>暂无天气数据</span>
              </div>
            )}
            {weatherData.map((day, idx) => (
              <div key={day.date} className={styles.weatherDay} style={{ animationDelay: `${idx * 0.12}s` }}>
                <div className={styles.weatherDate}>
                  {idx === 0 ? '今天' : idx === 1 ? '明天' : '后天'}
                </div>
                <span className={styles.weatherEmoji}>{getWeatherEmoji(day.weatherCode)}</span>
                <div className={styles.weatherLabel}>{getWeatherLabel(day.weatherCode)}</div>
                <div className={styles.weatherTemp}>
                  <span className={styles.tempHigh}>{day.tempMax}°</span>
                  <span className={styles.tempSep}>/</span>
                  <span className={styles.tempLow}>{day.tempMin}°</span>
                </div>
                <div className={styles.weatherMeta}>
                  <span>💨 {day.windSpeed}km/h</span>
                  <span>💧 {day.rainProb}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ====== SEARCH CARD ====== */}
        <Card className={styles.searchCard}>
          <div className={styles.searchBar}>
            <Space size="middle" wrap>
              <Search
                placeholder="搜索事项内容"
                allowClear
                value={searchContent}
                onChange={(e) => setSearchContent(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Select
                placeholder="状态筛选"
                allowClear
                value={statusFilter || undefined}
                onChange={(value) => setStatusFilter(value ?? '')}
                style={{ width: 120 }}
              >
                <Option value={MatterStatus.PENDING}>待完成</Option>
                <Option value={MatterStatus.COMPLETED}>已完成</Option>
                <Option value={MatterStatus.CANCELLED}>已取消</Option>
              </Select>
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                style={{ width: 120 }}
              >
                <Option value="asc">时间升序</Option>
                <Option value="desc">时间降序</Option>
              </Select>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddReminder}>
              新增事项
            </Button>
          </div>
        </Card>

        {/* ====== TABLE CARD ====== */}
        <Card className={styles.tableCard}>
          <Spin spinning={loading}>
            {reminders.length === 0 && !loading ? (
              <Empty
                description="暂无事项"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className={styles.empty}
              />
            ) : (
              <Table
                columns={columns}
                dataSource={reminders}
                rowKey="matterId"
                pagination={paginationConfig}
                scroll={{ x: 1000 }}
                loading={loading}
                className={styles.table}
              />
            )}
          </Spin>
        </Card>

        {/* ====== ADD MODAL ====== */}
        <Modal
          title="新增事项"
          open={addModalVisible}
          onCancel={() => setAddModalVisible(false)}
          onOk={() => form.submit()}
          okText="确定"
          cancelText="取消"
          width={500}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmitReminder}>
            <Form.Item
              name="ctId"
              label="联系人ID"
              rules={[{ required: true, message: '请输入联系人ID' }]}
            >
              <Input placeholder="请输入联系人ID" disabled={!!ctIdFromUrl} />
            </Form.Item>
            <Form.Item
              name="matterTime"
              label="事项时间"
              rules={[{ required: true, message: '请选择事项时间' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择事项时间" />
            </Form.Item>
            <Form.Item
              name="matter"
              label="事项内容"
              rules={[
                { required: true, message: '请输入事项内容' },
                { max: 100, message: '事项内容不能超过100字' },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="请输入事项内容（最多100字）"
                maxLength={100}
                showCount
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Reminders;
