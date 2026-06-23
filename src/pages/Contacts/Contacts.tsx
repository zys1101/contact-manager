import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Button, Input, Select, Space, message, Tag as AntTag, Card, Avatar,
  Popconfirm, Spin, Empty, Modal, Form, Checkbox, Row, Col,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, UserOutlined,
  DeleteOutlined, StopOutlined, EyeOutlined, TagOutlined,
  ArrowLeftOutlined, AppstoreOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { contactService } from '../../services/contactService';
import { tagService } from '../../services/tagService';
import { BASE_URL } from '../../services/api';
import WeatherWidget from '../../components/WeatherWidget/WeatherWidget';
import { Contact, ContactQueryParams } from '../../types';
import { Tag } from '../../types/tag';
import styles from './Contacts.module.css';

const getFullUrl = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

const { Search } = Input;
const { Option } = Select;

const TAG_COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#2f54eb'];

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

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
  const [tagFilter, setTagFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Real-time search with debounce
  const debouncedName = useDebounce(searchName, 400);
  const debouncedPhone = useDebounce(searchPhone, 400);

  // Tags
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagForm] = Form.useForm();
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const loadTags = useCallback(async () => {
    try {
      const data = await tagService.getTags();
      setTags(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadTags(); }, [loadTags]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (tagFilter) {
        const contactsByTag = await tagService.getContactsByTagId(tagFilter);
        response = { list: contactsByTag as any, total: contactsByTag.length };
      } else {
        const params: ContactQueryParams = {
          page: currentPage,
          pageSize,
          ctName: debouncedName || undefined,
          ctPhone: debouncedPhone || undefined,
          ctMf: genderFilter || undefined,
          sortBy: 'ctName',
          sortOrder: 'asc',
        };
        response = await contactService.getContacts(params);
      }
      setContacts(response.list);
      setTotal(response.total);
    } catch {
      message.error('加载联系人列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, genderFilter, debouncedName, debouncedPhone, tagFilter]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const handleReset = () => {
    setSearchName(''); setSearchPhone(''); setGenderFilter(''); setTagFilter(''); setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try { await contactService.deleteContact(id); message.success('删除成功'); loadContacts(); }
    catch { message.error('删除失败'); }
  };

  const handleAddToBlacklist = async (id: string) => {
    try { await contactService.addToBlacklist(id); message.success('已加入黑名单'); loadContacts(); }
    catch { message.error('操作失败'); }
  };

  // Tag modal handlers
  const openTagModal = (contact: Contact) => {
    setEditingContact(contact);
    const tagNames: string[] = (contact as any).tags || [];
    const tagIds = tagNames.map((name: string) => {
      const found = tags.find(t => t.tagName === name);
      return found ? found.tagId : '';
    }).filter((id: string) => id !== '');
    tagForm.setFieldsValue({ tagIds });
    setTagModalOpen(true);
  };

  const handleTagSubmit = async (values: { tagIds: string[] }) => {
    if (!editingContact) return;
    try {
      await tagService.assignTagsToContact(editingContact.ctId, values.tagIds);
      message.success('标签更新成功');
      setTagModalOpen(false);
      loadContacts();
    } catch {
      message.error('标签更新失败');
    }
  };

  const renderTags = (tagNames: string[] | undefined) => {
    if (!tagNames || tagNames.length === 0) return null;
    return (
      <Space size={4} wrap>
        {tagNames.map((name, i) => (
          <AntTag key={name} color={TAG_COLORS[i % TAG_COLORS.length]}>{name}</AntTag>
        ))}
      </Space>
    );
  };

  // Table columns
  const columns: ColumnsType<Contact> = [
    {
      title: '头像', dataIndex: 'avatar', key: 'avatar', width: 80,
      render: (avatar: string, record: Contact) => (
        <Avatar size={48} src={getFullUrl(avatar)} icon={<UserOutlined />}>
          {record.ctName?.charAt(0)}
        </Avatar>
      ),
    },
    { title: '姓名', dataIndex: 'ctName', key: 'ctName', width: 120, sorter: true },
    {
      title: '性别', dataIndex: 'ctMf', key: 'ctMf', width: 80,
      render: (gender: string) => <AntTag color={gender === '男' ? 'blue' : 'pink'}>{gender}</AntTag>,
    },
    {
      title: '标签', key: 'tags', width: 200,
      render: (_: unknown, record: Contact) => renderTags((record as any).tags),
    },
    { title: '电话', dataIndex: 'ctPhone', key: 'ctPhone', width: 140 },
    { title: '邮箱', dataIndex: 'ctEm', key: 'ctEm', width: 200, ellipsis: true },
    {
      title: '操作', key: 'action', width: 320, fixed: 'right',
      render: (_: unknown, record: Contact) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/contacts/detail/${record.ctId}`)}>详情</Button>
          <Button type="link" size="small" onClick={() => navigate(`/reminders?ctId=${record.ctId}`)}>事项</Button>
          <Button type="link" size="small" icon={<TagOutlined />} onClick={() => openTagModal(record)}>标签</Button>
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
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
          <ArrowLeftOutlined /> 返回Dashboard
        </button>

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
              <Search
                placeholder="实时搜索姓名..."
                allowClear
                value={searchName}
                onChange={(e) => { setSearchName(e.target.value); setCurrentPage(1); }}
                style={{ width: 200 }}
                prefix={<SearchOutlined />}
              />
              <Search
                placeholder="实时搜索电话..."
                allowClear
                value={searchPhone}
                onChange={(e) => { setSearchPhone(e.target.value); setCurrentPage(1); }}
                style={{ width: 200 }}
                prefix={<SearchOutlined />}
              />
              <Select placeholder="性别筛选" allowClear value={genderFilter || undefined} onChange={(value) => setGenderFilter(value || '')} style={{ width: 120 }}>
                <Option value="男">男</Option><Option value="女">女</Option>
              </Select>
              <Select placeholder="标签筛选" allowClear value={tagFilter || undefined} onChange={(value) => { setTagFilter(value || ''); setCurrentPage(1); }} style={{ width: 150 }}>
                {tags.map((tag) => (
                  <Option key={tag.tagId} value={tag.tagId}>{tag.tagName}</Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/contacts/add')}>添加联系人</Button>
              <Button onClick={() => navigate('/blacklist')}>黑名单</Button>
              <Button onClick={() => navigate('/contacts/excel')}>Excel</Button>
              {/* View mode toggle */}
              <Button.Group>
                <Button icon={<UnorderedListOutlined />} type={viewMode === 'table' ? 'primary' : 'default'} onClick={() => setViewMode('table')} />
                <Button icon={<AppstoreOutlined />} type={viewMode === 'card' ? 'primary' : 'default'} onClick={() => setViewMode('card')} />
              </Button.Group>
            </Space>
          </div>
        </Card>

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className={styles.tableCard}>
            <Spin spinning={loading}>
              {contacts.length === 0 && !loading ? (
                <Empty description="暂无联系人" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Table columns={columns} dataSource={contacts} rowKey="ctId" pagination={paginationConfig} scroll={{ x: 1200 }} loading={loading} className={styles.table} />
              )}
            </Spin>
          </Card>
        )}

        {/* Card View */}
        {viewMode === 'card' && (
          <Spin spinning={loading}>
            {contacts.length === 0 && !loading ? (
              <Empty description="暂无联系人" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  {contacts.map((contact) => (
                    <Col key={contact.ctId} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        className={styles.contactCard}
                        hoverable
                        onClick={() => navigate(`/contacts/detail/${contact.ctId}`)}
                      >
                        <div className={styles.cardHeader}>
                          <Avatar
                            size={56}
                            src={getFullUrl(contact.avatar)}
                            icon={<UserOutlined />}
                            className={styles.cardAvatar}
                          >
                            {contact.ctName?.charAt(0)}
                          </Avatar>
                          <div className={styles.cardName}>{contact.ctName}</div>
                        </div>
                        <div className={styles.cardInfo}>
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>📱</span>
                            <span className={styles.cardValue}>{contact.ctPhone || '-'}</span>
                          </div>
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>📧</span>
                            <span className={styles.cardValue}>{contact.ctEm || '-'}</span>
                          </div>
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>👤</span>
                            <AntTag color={contact.ctMf === '男' ? 'blue' : 'pink'} style={{ fontSize: 11 }}>
                              {contact.ctMf}
                            </AntTag>
                          </div>
                          {renderTags((contact as any).tags) && (
                            <div className={styles.cardRow}>
                              <span className={styles.cardLabel}>🏷️</span>
                              {renderTags((contact as any).tags)}
                            </div>
                          )}
                        </div>
                        <div className={styles.cardActions}>
                          <Button size="small" icon={<TagOutlined />} onClick={(e) => { e.stopPropagation(); openTagModal(contact); }}>标签</Button>
                          <Popconfirm title="确定要加入黑名单吗？" onConfirm={(e) => { e?.stopPropagation(); handleAddToBlacklist(contact.ctId); }} okText="确定" cancelText="取消">
                            <Button size="small" danger icon={<StopOutlined />} onClick={(e) => e.stopPropagation()}>拉黑</Button>
                          </Popconfirm>
                          <Popconfirm title="确定要删除此联系人吗？" onConfirm={(e) => { e?.stopPropagation(); handleDelete(contact.ctId); }} okText="确定" cancelText="取消">
                            <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()}>删除</Button>
                          </Popconfirm>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Table
                    dataSource={[]}
                    columns={[]}
                    pagination={paginationConfig}
                    showHeader={false}
                    locale={{ emptyText: null }}
                  />
                </div>
              </>
            )}
          </Spin>
        )}
      </div>

      {/* Tag Management Modal */}
      <Modal
        title={<><TagOutlined /> 管理标签</>}
        open={tagModalOpen}
        onCancel={() => setTagModalOpen(false)}
        onOk={() => tagForm.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={tagForm} onFinish={handleTagSubmit}>
          <Form.Item name="tagIds" label="选择标签">
            <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tags.map((tag) => (
                <Checkbox key={tag.tagId} value={tag.tagId}>
                  <AntTag color={tag.tagColor}>{tag.tagName}</AntTag>
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Contacts;
