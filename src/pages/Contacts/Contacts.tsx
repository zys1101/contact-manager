import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, message, Tag, Card, Avatar,
  Popconfirm, Spin, Empty,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, UserOutlined,
  DeleteOutlined, StopOutlined, EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { contactService } from '../../services/contactService';
import WeatherWidget from '../../components/WeatherWidget/WeatherWidget';
import { Contact, ContactQueryParams } from '../../types';
import styles from './Contacts.module.css';

const { Search } = Input;
const { Option } = Select;

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [genderFilter, setGenderFilter] = useState<'男' | '女' | ''>('');

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: ContactQueryParams = {
        page: currentPage,
        pageSize,
        ctName: searchName || undefined,
        ctPhone: searchPhone || undefined,
        ctMf: genderFilter || undefined,
        sortBy: 'ctName',
        sortOrder: 'asc',
      };
      const response = await contactService.getContacts(params);
      setContacts(response.list);
      setTotal(response.total);
    } catch {
      message.error('加载联系人列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, genderFilter, searchName, searchPhone]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const handleSearch = () => { setCurrentPage(1); loadContacts(); };

  const handleReset = () => {
    setSearchName(''); setSearchPhone(''); setGenderFilter(''); setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try { await contactService.deleteContact(id); message.success('删除成功'); loadContacts(); }
    catch { message.error('删除失败'); }
  };

  const handleAddToBlacklist = async (id: string) => {
    try { await contactService.addToBlacklist(id); message.success('已加入黑名单'); loadContacts(); }
    catch { message.error('操作失败'); }
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
    {
      title: '性别', dataIndex: 'ctMf', key: 'ctMf', width: 80,
      render: (gender: string) => <Tag color={gender === '男' ? 'blue' : 'pink'}>{gender}</Tag>,
    },
    { title: '电话', dataIndex: 'ctPhone', key: 'ctPhone', width: 140 },
    { title: '邮箱', dataIndex: 'ctEm', key: 'ctEm', width: 200, ellipsis: true },
    {
      title: '操作', key: 'action', width: 280, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/contacts/detail/${record.ctId}`)}>详情</Button>
          <Button type="link" size="small" onClick={() => navigate(`/reminders?ctId=${record.ctId}`)}>事项</Button>
          <Popconfirm title="确定要加入黑名单吗？" onConfirm={() => handleAddToBlacklist(record.ctId)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<StopOutlined />}>拉黑</Button>
          </Popconfirm>
          <Popconfirm title="确定要删除此联系人吗？" onConfirm={() => handleDelete(record.ctId)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
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
      <div className={styles.wrapper}>
        <div className={styles.weatherWrap}>
          <WeatherWidget />
        </div>
        <div className={styles.header}>
          <h1 className={styles.title}>联系人管理</h1>
          <p className={styles.subtitle}>CONTACT MANAGEMENT</p>
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
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/contacts/add')}>添加联系人</Button>
              <Button onClick={() => navigate('/blacklist')}>查看黑名单</Button>
            </Space>
          </div>
        </Card>
        <Card className={styles.tableCard}>
          <Spin spinning={loading}>
            {contacts.length === 0 && !loading ? (
              <Empty description="暂无联系人" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table columns={columns} dataSource={contacts} rowKey="ctId" pagination={paginationConfig} scroll={{ x: 1200 }} loading={loading} className={styles.table} />
            )}
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default Contacts;
