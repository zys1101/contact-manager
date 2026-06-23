import { useState, useEffect, useCallback } from 'react';
import { Table, Input, Select, Space, Button, Card, Spin, Empty, Tag as AntTag } from 'antd';
import { SearchOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import styles from './OperationLog.module.css';

const { Search } = Input;
const { Option } = Select;

interface LogItem {
  logId: string;
  userId: string;
  username: string;
  operationType: string;
  operationDesc: string;
  requestUrl: string;
  requestMethod: string;
  requestParams: string;
  operationTime: string;
}

const TYPE_COLORS: Record<string, string> = {
  新增: 'green',
  修改: 'blue',
  删除: 'red',
  拉黑: 'orange',
  恢复: 'cyan',
  导入: 'purple',
  导出: 'magenta',
};

const OperationLogPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterType, setFilterType] = useState<string>('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get<any>('/logs', {
        params: { page: currentPage, pageSize, operationType: filterType || undefined },
      });
      setLogs(res.list || []);
      setTotal(res.total || 0);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filterType]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleSearch = () => { setCurrentPage(1); loadLogs(); };
  const handleReset = () => { setFilterType(''); setCurrentPage(1); };

  const columns = [
    {
      title: '时间', dataIndex: 'operationTime', key: 'operationTime', width: 180,
      render: (t: string) => t ? t.replace('T', ' ').slice(0, 19) : '-',
    },
    { title: '用户', dataIndex: 'username', key: 'username', width: 100 },
    {
      title: '操作类型', dataIndex: 'operationType', key: 'operationType', width: 90,
      render: (type: string) => <AntTag color={TYPE_COLORS[type] || 'default'}>{type}</AntTag>,
    },
    { title: '操作描述', dataIndex: 'operationDesc', key: 'operationDesc', ellipsis: true },
    { title: '请求方式', dataIndex: 'requestMethod', key: 'requestMethod', width: 80 },
    {
      title: '请求参数', dataIndex: 'requestParams', key: 'requestParams',
      ellipsis: true,
      render: (p: string) => p ? p.slice(0, 80) + (p.length > 80 ? '...' : '') : '-',
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
          <ArrowLeftOutlined /> 返回
        </button>

        <div className={styles.header}>
          <h1 className={styles.title}>操作日志</h1>
          <p className={styles.subtitle}>OPERATION LOG</p>
        </div>

        <Card className={styles.searchCard}>
          <div className={styles.searchBar}>
            <Select placeholder="操作类型" allowClear value={filterType || undefined} onChange={(v) => setFilterType(v || '')} style={{ width: 130 }}>
              {Object.keys(TYPE_COLORS).map((type) => <Option key={type} value={type}>{type}</Option>)}
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
          </div>
        </Card>

        <Card className={styles.tableCard}>
          <Spin spinning={loading}>
            {logs.length === 0 && !loading ? (
              <Empty description="暂无操作日志" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table columns={columns} dataSource={logs} rowKey="logId" pagination={paginationConfig} scroll={{ x: 800 }} loading={loading} />
            )}
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default OperationLogPage;
