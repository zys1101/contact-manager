import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, message, Tag, Card, Avatar,
  Popconfirm, Spin, Empty,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, UserOutlined,
  CheckCircleOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { blacklistService } from '../../services/blacklistService';
import WeatherWidget from '../../components/WeatherWidget/WeatherWidget';
import { Contact, ContactQueryParams } from '../../types';
import styles from './Blacklist.module.css';

const { Search } = Input;
const { Option } = Select;

const Blacklist: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [blacklist, setBlacklist] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [genderFilter, setGenderFilter] = useState<'男' | '女' | ''>('');

  const loadBlacklist = useCallback(async () => {
    setLoading(true);
    try {
      const params: ContactQueryParams = {
        page: currentPage, pageSize,
        ctName: searchName || undefined,
        ctPhone: searchPhone || undefined,
        ctMf: genderFilter || undefined,
        sortBy: 'ctName', sortOrder: 'asc',
      };
      const response = await blacklistService.getBlacklist(params);
      setBlacklist(response.list); setTotal(response.total);
    } catch { message.error('加载黑名单列表失败'); }
    finally { setLoading(false); }
  }, [currentPage, pageSize, genderFilter, searchName, searchPhone]);

  useEffect(() => { loadBlacklist(); }, [loadBlacklist]);

  const handleSearch = () => { setCurrentPage(1); loadBlacklist(); };
  const handleReset = () => { setSearchName(''); setSearchPhone(''); setGenderFilter(''); setCurrentPage(1); };

  const handleRestore = async (id: string) => {
    try { await blacklistService.restoreContact(id); message.success('已恢复联系人'); loadBlacklist(); }
    catch { message.error('恢复失败'); }
  };

  const columns: ColumnsType<Contact> = [
    {
      title: '头像', dataIndex: 'avatar', key: 'avatar', width: 80,
      render: (avatar: string, record: Contact) => (
        <Avatar size={48} src={avatar} icon={<UserOutlined />} className={styles.avatar}>
          {record.ctName?.charAt(0)}
        </Avatar>
      ),
    },
    { title: '姓名', dataIndex: 'ctName', key: 'ctName', width: 120, sorter: true },
    { title: '性别', dataIndex: 'ctMf', key: 'ctMf', width: 80, render: (g: string) => <Tag color={g === '男' ? 'blue' : 'pink'}>{g}</Tag> },
    { title: '电话', dataIndex: 'ctPhone', key: 'ctPhone', width: 140 },
    { title: '邮箱', dataIndex: 'ctEm', key: 'ctEm', width: 200, ellipsis: true },
    { title: '拉黑时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180, render: (t: string) => t || '-' },
    {
      title: '操作', key: 'action', width: 120, fixed: 'right',
      render: (_, record) => (
        <Popconfirm title="确定要恢复此联系人吗？" onConfirm={() => handleRestore(record.ctId)} okText="确定" cancelText="取消">
          <Button type="primary" size="small" icon={<CheckCircleOutlined />}>恢复</Button>
        </Popconfirm>
      ),
    },
  ];

  const paginationConfig = {
    current: currentPage, pageSize, total, showSizeChanger: true, showQuickJumper: true,
    showTotal: (t: number) => `共 ${t} 条记录`,
    onChange: (page: number, size: number) => { setCurrentPage(page); setPageSize(size); },
  };

  return (
    <div className={styles.container}>
      <div className={styles.bg}>
        <div className={styles.grain} />
        <div className={styles.orb} />
      </div>
      <div className={styles.wrapper}>
        <button className={styles.backBtn} onClick={() => navigate('/contacts')}>
          <ArrowLeftOutlined /> 返回联系人
        </button>
        <div className={styles.weatherWrap}><WeatherWidget /></div>
        <div className={styles.header}>
          <h1 className={styles.title}>黑名单管理</h1>
          <p className={styles.subtitle}>BLACKLIST MANAGEMENT</p>
        </div>
        <Card className={styles.searchCard}>
          <div className={styles.searchBar}>
            <Space size="middle" wrap>
              <Search placeholder="搜索姓名" allowClear value={searchName} onChange={(e) => setSearchName(e.target.value)} onSearch={handleSearch} style={{ width: 200 }} prefix={<SearchOutlined />} />
              <Search placeholder="搜索电话" allowClear value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} onSearch={handleSearch} style={{ width: 200 }} prefix={<SearchOutlined />} />
              <Select placeholder="性别筛选" allowClear value={genderFilter || undefined} onChange={(value) => setGenderFilter(value || '')} style={{ width: 120 }}>
                <Option value="男">男</Option><Option value="女">女</Option>
              </Select>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </div>
        </Card>
        <Card className={styles.tableCard}>
          <Spin spinning={loading}>
            {blacklist.length === 0 && !loading ? (
              <Empty description="黑名单为空" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table columns={columns} dataSource={blacklist} rowKey="ctId" pagination={paginationConfig} scroll={{ x: 1000 }} loading={loading} className={styles.table} />
            )}
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default Blacklist;
