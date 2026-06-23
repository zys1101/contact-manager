import { useState } from 'react';
import { Button, message, Spin, Result } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, UploadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../services/api';
import styles from './Excel.module.css';

const ExcelPage: React.FC = () => {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    successCount: number;
    failCount: number;
    errors: string[];
  } | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/excel/export`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('导出失败');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      message.error('仅支持 .xlsx 或 .xls 格式');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BASE_URL}/excel/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await response.json();
      if (json.code === 200) {
        const data = json.data;
        setImportResult({
          success: true,
          successCount: data.successCount || 0,
          failCount: data.failCount || 0,
          errors: data.errors || [],
        });
        message.success('导入完成');
      } else {
        message.error(json.message || '导入失败');
      }
    } catch {
      message.error('导入失败，请检查网络连接');
    } finally {
      setImporting(false);
      // reset input to allow same file again
      e.target.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
          <ArrowLeftOutlined /> 返回
        </button>

        <div className={styles.header}>
          <h1 className={styles.title}>Excel 导入导出</h1>
          <p className={styles.subtitle}>EXCEL IMPORT & EXPORT</p>
        </div>

        {/* Export */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>📤 导出联系人</h3>
          <p style={{ color: '#8c8e94', marginBottom: 16 }}>
            将所有联系人数据导出为 Excel 文件（.xlsx格式），包含姓名、电话、邮箱、地址、性别等信息。
          </p>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            loading={exporting}
            onClick={handleExport}
          >
            {exporting ? '导出中...' : '导出Excel'}
          </Button>
        </div>

        {/* Import */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>📥 导入联系人</h3>
          <p style={{ color: '#8c8e94', marginBottom: 16 }}>
            从 Excel 文件批量导入联系人。请确保文件格式正确，系统会自动校验数据。
          </p>
          <label className={styles.uploadArea}>
            <FileExcelOutlined style={{ fontSize: 40, color: '#52c41a', marginBottom: 8 }} />
            <br />
            <Button icon={<UploadOutlined />} size="large" loading={importing}>
              {importing ? '导入中...' : '选择Excel文件'}
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>

          {/* Import Result */}
          {importResult && (
            <div className={styles.resultBox}>
              <p className={styles.successText}>
                ✅ 成功导入 {importResult.successCount} 条
              </p>
              {importResult.failCount > 0 && (
                <p className={styles.errorText}>
                  ❌ 失败 {importResult.failCount} 条
                </p>
              )}
              {importResult.errors.length > 0 && (
                <ul className={styles.errorList}>
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <Spin spinning={exporting || importing} />
      </div>
    </div>
  );
};

export default ExcelPage;
