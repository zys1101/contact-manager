import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Modal, message, Tag, Card,
  Popconfirm, Spin, Empty, DatePicker, Form, Tooltip,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined,
  CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined,
  CalendarOutlined, UserOutlined, ArrowLeftOutlined,
  EditOutlined, UndoOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useSearchParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { reminderService } from '../../services/reminderService';
import WeatherWidget from '../../components/WeatherWidget/WeatherWidget';
import { Reminder, ReminderQueryParams, ReminderFormData, MatterStatus } from '../../types';
import styles from './Reminders.module.css';

const { Search } = Input;
const { Option } = Select;

const Reminders: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ctIdFromUrl = searchParams.get('ctId');

  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchContent, setSearchContent] = useState('');
  const [statusFilter, setStatusFilter] = useState<MatterStatus | ''>('');
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc');

  // Add/Edit modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Reminder | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

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

  const handleSearch = () => { setCurrentPage(1); loadReminders(); };
  const handleReset = () => { setSearchContent(''); setStatusFilter(''); setSortBy('asc'); setCurrentPage(1); };

  const handleComplete = async (id: string) => {
    try { await reminderService.completeReminder(id); message.success('事项已完成'); loadReminders(); }
    catch { message.error('操作失败'); }
  };

  const handleReopen = async (id: string) => {
    try { await reminderService.reopenReminder(id); message.success('事项已重新打开'); loadReminders(); }
    catch { message.error('操作失败'); }
  };

  const handleCancelActivity = async (id: string) => {
    try { await reminderService.cancelReminder(id); message.success('事项已取消'); loadReminders(); }
    catch { message.error('操作失败'); }
  };

  const handleDelete = async (id: string) => {
    try { await reminderService.deleteReminder(id); message.success('删除成功'); loadReminders(); }
    catch { message.error('删除失败'); }
  };

  // ---- Edit ----
  const openEditModal = (record: Reminder) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      matter: record.matter,
      matterTime: dayjs(record.matterTime),
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values: Record<string, unknown>) => {
    if (!editingRecord) return;
    try {
      await reminderService.updateReminder(editingRecord.matterId, {
        matter: values.matter as string,
        matterTime: (values.matterTime as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss'),
      });
      message.success('修改成功');
      setEditModalVisible(false);
      loadReminders();
    } catch {
      message.error('修改失败');
    }
  };

  // ---- Add ----
  const handleAddReminder = () => {
    form.resetFields();
    if (ctIdFromUrl) form.setFieldsValue({ ctId: ctIdFromUrl });
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

  // ---- Status tag ----
  const getStatusTag = (status: MatterStatus) => {
    const cfg: Record<MatterStatus, { color: string; text: string }> = {
      [MatterStatus.PENDING]: { color: 'orange', text: '待完成' },
      [MatterStatus.CANCELLED]: { color: 'default', text: '已取消' },
      [MatterStatus.COMPLETED]: { color: 'green', text: '已完成' },
    };
    const c = cfg[status];
    return <Tag color={c.color}>{c.text}</Tag>;
  };

  const handleBack = () => {
    if (ctIdFromUrl) navigate(`/contacts/detail/${ctIdFromUrl}`);
    else navigate('/contacts');
  };

  // ---- Columns ----
  const columns: ColumnsType<Reminder> = [
    {
      title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 120,
      render: (name: string) => <Space><UserOutlined />{name}</Space>,
    },
    {
      title: '事项时间', dataIndex: 'matterTime', key: 'matterTime', width: 170, sorter: true,
      render: (time: string) => <Space><CalendarOutlined />{dayjs(time).format('YYYY-MM-DD HH:mm')}</Space>,
    },
    { title: '事项内容', dataIndex: 'matter', key: 'matter', ellipsis: true },
    { title: '状态', dataIndex: 'matterDelete', key: 'matterDelete', width: 100, render: (s: MatterStatus) => getStatusTag(s) },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, record) => {
        const isPending = record.matterDelete === MatterStatus.PENDING;
        const isCancelled = record.matterDelete === MatterStatus.CANCELLED;
        const isCompleted = record.matterDelete === MatterStatus.COMPLETED;

        return (
          <div className={styles.actionBar}>
            {isPending && (
              <>
                <Tooltip title="标记完成">
                  <button className={styles.actionBtn} data-type="done" onClick={() => handleComplete(record.matterId)}>
                    <CheckCircleOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="取消事项">
                  <button className={styles.actionBtn} data-type="cancel" onClick={() => handleCancelActivity(record.matterId)}>
                    <CloseCircleOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="编辑内容">
                  <button className={styles.actionBtn} data-type="edit" onClick={() => openEditModal(record)}>
                    <EditOutlined />
                  </button>
                </Tooltip>
              </>
            )}
            {isCompleted && (
              <Tooltip title="重新打开">
                <button className={styles.actionBtn} data-type="reopen" onClick={() => handleReopen(record.matterId)}>
                  <UndoOutlined />
                </button>
              </Tooltip>
            )}
            {isCancelled && (
              <>
                <Tooltip title="重新打开">
                  <button className={styles.actionBtn} data-type="reopen" onClick={() => handleReopen(record.matterId)}>
                    <UndoOutlined />
                  </button>
                </Tooltip>
              </>
            )}
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.matterId)} okText="确定" cancelText="取消">
              <Tooltip title="删除">
                <button className={styles.actionBtn} data-type="delete">
                  <DeleteOutlined />
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  const paginationConfig = {
    current: currentPage, pageSize, total, showSizeChanger: true, showQuickJumper: true,
    showTotal: (t: number) => `共 ${t} 条记录`,
    onChange: (page: number, size: number) => { setCurrentPage(page); setPageSize(size); },
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button className={styles.backBtn} onClick={handleBack}>
          <ArrowLeftOutlined />
          {ctIdFromUrl ? '返回联系人详情' : '返回联系人列表'}
        </button>

        <div style={{ marginBottom: 24 }}>
          <WeatherWidget />
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>事项提醒</h1>
          <p className={styles.subtitle}>REMINDERS MANAGEMENT</p>
        </div>

        <Card className={styles.searchCard}>
          <div className={styles.searchBar}>
            <Space size="middle" wrap>
              <Search placeholder="搜索事项内容" allowClear value={searchContent} onChange={(e) => setSearchContent(e.target.value)} onSearch={handleSearch} style={{ width: 250 }} prefix={<SearchOutlined />} />
              <Select placeholder="状态筛选" allowClear value={statusFilter || undefined} onChange={(value) => setStatusFilter(value ?? '')} style={{ width: 120 }}>
                <Option value={MatterStatus.PENDING}>待完成</Option>
                <Option value={MatterStatus.COMPLETED}>已完成</Option>
                <Option value={MatterStatus.CANCELLED}>已取消</Option>
              </Select>
              <Select value={sortBy} onChange={(value) => setSortBy(value)} style={{ width: 120 }}>
                <Option value="asc">时间升序</Option>
                <Option value="desc">时间降序</Option>
              </Select>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddReminder}>新增事项</Button>
          </div>
        </Card>

        <Card className={styles.tableCard}>
          <Spin spinning={loading}>
            {reminders.length === 0 && !loading ? (
              <Empty description="暂无事项" image={Empty.PRESENTED_IMAGE_SIMPLE} className={styles.empty} />
            ) : (
              <Table columns={columns} dataSource={reminders} rowKey="matterId" pagination={paginationConfig} scroll={{ x: 1000 }} loading={loading} className={styles.table} />
            )}
          </Spin>
        </Card>

        {/* Add Modal */}
        <Modal title="新增事项" open={addModalVisible} onCancel={() => setAddModalVisible(false)} onOk={() => form.submit()} okText="确定" cancelText="取消" width={500}>
          <Form form={form} layout="vertical" onFinish={handleSubmitReminder}>
            <Form.Item name="ctId" label="联系人ID" rules={[{ required: true, message: '请输入联系人ID' }]}>
              <Input placeholder="请输入联系人ID" disabled={!!ctIdFromUrl} />
            </Form.Item>
            <Form.Item name="matterTime" label="事项时间" rules={[{ required: true, message: '请选择事项时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择事项时间" />
            </Form.Item>
            <Form.Item name="matter" label="事项内容" rules={[{ required: true, message: '请输入事项内容' }, { max: 100, message: '事项内容不能超过100字' }]}>
              <Input.TextArea rows={4} placeholder="请输入事项内容（最多100字）" maxLength={100} showCount />
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal title="编辑事项" open={editModalVisible} onCancel={() => setEditModalVisible(false)} onOk={() => editForm.submit()} okText="保存" cancelText="取消" width={500}>
          <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
            <Form.Item name="matterTime" label="事项时间" rules={[{ required: true, message: '请选择事项时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="matter" label="事项内容" rules={[{ required: true, message: '请输入事项内容' }, { max: 100, message: '事项内容不能超过100字' }]}>
              <Input.TextArea rows={4} placeholder="请输入事项内容（最多100字）" maxLength={100} showCount />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Reminders;
