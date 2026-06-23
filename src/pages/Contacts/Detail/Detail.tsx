import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button, Skeleton, Empty, message, Spin, Tag, Table, Popconfirm, Tag as AntTag, Modal, Checkbox, Form,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  UserOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined,
  QqOutlined, WechatOutlined, CalendarOutlined, NumberOutlined,
  ManOutlined, WomanOutlined, PlusOutlined, UploadOutlined,
  StopOutlined, TagOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { contactService } from '../../../services/contactService';
import { tagService } from '../../../services/tagService';
import { BASE_URL } from '../../../services/api';
import WeatherWidget from '../../../components/WeatherWidget/WeatherWidget';
import type { ContactDetail, MatterItem, ContactFormData } from '../../../types';
import { Tag as TagType } from '../../../types/tag';
import styles from './Detail.module.css';

const getFullUrl = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

const phoneRegex = /^1[3-9]\d{9}$/;
const zipRegex = /^\d{6}$/;
const qqRegex = /^\d{5,11}$/;

const editSchema = z.object({
  ctName: z.string().min(2, '姓名至少2个字符'),
  ctPhone: z.string().regex(phoneRegex, '手机号格式不正确'),
  ctMf: z.enum(['男', '女']),
  ctAd: z.string().max(100).optional().or(z.literal('')),
  ctYb: z.string().regex(zipRegex, '邮编必须为6位数字').optional().or(z.literal('')),
  ctQq: z.string().regex(qqRegex, 'QQ号格式不正确').optional().or(z.literal('')),
  ctWx: z.string().min(6).max(20).optional().or(z.literal('')),
  ctEm: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  ctBirth: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof editSchema>;

const MATTER_STATUS_LABELS: Record<number, { color: string; text: string }> = {
  0: { color: 'orange', text: '待完成' },
  1: { color: 'default', text: '已取消' },
  2: { color: 'green', text: '已完成' },
};

const TAG_COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#2f54eb'];

const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Tags
  const [tags, setTags] = useState<TagType[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagForm] = Form.useForm();
  const [savingTags, setSavingTags] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(editSchema),
    mode: 'onBlur',
  });

  const watchedMf = watch('ctMf');

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await contactService.getContactById(id);
      setDetail(data);
      const allTags = await tagService.getTags();
      setTags(allTags);
    } catch {
      message.error('加载联系人详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const startEdit = () => {
    if (!detail) return;
    reset({
      ctName: detail.ctName,
      ctPhone: detail.ctPhone,
      ctMf: detail.ctMf,
      ctAd: detail.ctAd || '',
      ctYb: detail.ctYb || '',
      ctQq: detail.ctQq || '',
      ctWx: detail.ctWx || '',
      ctEm: detail.ctEm || '',
      ctBirth: detail.ctBirth || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const onSave = async (values: FormValues) => {
    if (!id) return;
    setSaving(true);
    try {
      const data: Partial<ContactFormData> = {
        ctName: values.ctName,
        ctPhone: values.ctPhone,
        ctMf: values.ctMf,
        ctAd: values.ctAd || undefined,
        ctYb: values.ctYb || undefined,
        ctQq: values.ctQq || undefined,
        ctWx: values.ctWx || undefined,
        ctEm: values.ctEm || undefined,
        ctBirth: values.ctBirth || undefined,
      };
      await contactService.updateContact(id, data);
      message.success('保存成功');
      setEditing(false);
      loadDetail();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      message.error('仅支持 JPG、JPEG、PNG 格式的图片');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('头像大小不能超过5MB');
      return;
    }
    setUploading(true);
    try {
      const result = await contactService.uploadAvatar(id, file);
      setDetail((prev) => prev ? { ...prev, avatar: result.avatar } : prev);
      message.success('头像更新成功');
    } catch {
      message.error('头像上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddToBlacklist = async () => {
    if (!id) return;
    try {
      await contactService.addToBlacklist(id);
      message.success('已加入黑名单');
      navigate('/contacts', { replace: true });
    } catch {
      message.error('操作失败');
    }
  };

  // Tag management
  const openTagModal = () => {
    if (!detail) return;
    const currentTagIds = (detail as any).tags?.map((t: any) => t.tagId) || [];
    tagForm.setFieldsValue({ tagIds: currentTagIds });
    setTagModalOpen(true);
  };

  const handleSaveTags = async (values: { tagIds: string[] }) => {
    if (!id) return;
    setSavingTags(true);
    try {
      await tagService.assignTagsToContact(id, values.tagIds);
      message.success('标签更新成功');
      setTagModalOpen(false);
      loadDetail();
    } catch {
      message.error('标签更新失败');
    } finally {
      setSavingTags(false);
    }
  };

  const renderDetailTags = () => {
    const currentTags = (detail as any).tags || [];
    if (currentTags.length === 0) {
      return (
        <AntTag color="default" style={{ cursor: 'pointer' }} onClick={openTagModal}>
          <PlusOutlined style={{ fontSize: 10 }} /> 添加标签
        </AntTag>
      );
    }
    return (
      <>
        {currentTags.map((t: any, i: number) => (
          <AntTag key={t.tagId} color={t.tagColor || TAG_COLORS[i % TAG_COLORS.length]} style={{ margin: '2px 4px' }}>
            {t.tagName}
          </AntTag>
        ))}
        <AntTag color="default" style={{ cursor: 'pointer' }} onClick={openTagModal}>
          <PlusOutlined style={{ fontSize: 10 }} />
        </AntTag>
      </>
    );
  };

  const matterColumns: ColumnsType<MatterItem> = [
    { title: '事项时间', dataIndex: 'matterTime', width: 180,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    { title: '事项内容', dataIndex: 'matter', ellipsis: true },
    { title: '状态', dataIndex: 'matterDelete', width: 90,
      render: (s: number) => {
        const cfg = MATTER_STATUS_LABELS[s] || MATTER_STATUS_LABELS[0];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <Empty description="联系人不存在" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={() => navigate('/contacts')}>返回列表</Button>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button className={styles.backBtn} onClick={() => navigate('/contacts')}>
          <ArrowLeftOutlined /> 返回列表
        </button>

        <div style={{ marginBottom: 24 }}>
          <WeatherWidget />
        </div>

        {!editing && (
          <div className={styles.card}>
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <div className={styles.avatarBox}>
                  {detail.avatar ? (
                    <img src={getFullUrl(detail.avatar)} alt={detail.ctName} className={styles.avatarImg} />
                  ) : (
                    <UserOutlined className={styles.avatarPlaceholder} />
                  )}
                </div>
                <label className={styles.uploadBtn}>
                  <UploadOutlined /> 更换头像
                  <input type="file" accept="image/jpeg,image/png" onChange={handleAvatarUpload} className={styles.fileInput} />
                </label>
                {uploading && <Spin size="small" style={{ marginLeft: 8 }} />}
              </div>
              <div className={styles.headerRight}>
                <h1 className={styles.name}>{detail.ctName}</h1>
                <Tag color={detail.ctMf === '男' ? 'blue' : 'pink'}>{detail.ctMf}</Tag>
                <div className={styles.tagGroup}>
                  {renderDetailTags()}
                </div>
              </div>
              <div className={styles.headerActions}>
                <Button icon={<EditOutlined />} onClick={startEdit}>编辑</Button>
                <Popconfirm title="确定加入黑名单？" onConfirm={handleAddToBlacklist} okText="确定" cancelText="取消">
                  <Button danger icon={<StopOutlined />}>拉黑</Button>
                </Popconfirm>
              </div>
            </div>

            <div className={styles.infoGrid}>
              <Field label="手机号" value={detail.ctPhone} icon={<PhoneOutlined />} />
              <Field label="邮箱" value={detail.ctEm || '-'} icon={<MailOutlined />} />
              <Field label="出生日期" value={detail.ctBirth || '-'} icon={<CalendarOutlined />} />
              <Field label="地址" value={detail.ctAd || '-'} icon={<EnvironmentOutlined />} span />
              <Field label="邮编" value={detail.ctYb || '-'} icon={<NumberOutlined />} />
              <Field label="QQ" value={detail.ctQq || '-'} icon={<QqOutlined />} />
              <Field label="微信" value={detail.ctWx || '-'} icon={<WechatOutlined />} />
            </div>

            {detail.matters && detail.matters.length > 0 && (
              <div className={styles.mattersSection}>
                <div className={styles.mattersHeader}>
                  <span className={styles.mattersTitle}>相关事项</span>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => navigate(`/reminders?ctId=${detail.ctId}`)}>
                    新增
                  </Button>
                </div>
                <Table
                  columns={matterColumns}
                  dataSource={detail.matters}
                  rowKey="matterId"
                  pagination={false}
                  size="small"
                  className={styles.matterTable}
                />
              </div>
            )}
          </div>
        )}

        {editing && (
          <div className={styles.card}>
            <h2 className={styles.editTitle}>编辑联系人</h2>
            <form onSubmit={handleSubmit(onSave)} className={styles.form} noValidate>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>姓名 *</label>
                  <div className={`${styles.inputBox} ${errors.ctName ? styles.inputBoxError : ''}`}>
                    <UserOutlined className={styles.inputIcon} />
                    <input className={styles.inputField} {...register('ctName')} />
                  </div>
                  {errors.ctName && <span className={styles.fieldError}>{errors.ctName.message}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>手机号 *</label>
                  <div className={`${styles.inputBox} ${errors.ctPhone ? styles.inputBoxError : ''}`}>
                    <PhoneOutlined className={styles.inputIcon} />
                    <input className={styles.inputField} {...register('ctPhone')} />
                  </div>
                  {errors.ctPhone && <span className={styles.fieldError}>{errors.ctPhone.message}</span>}
                </div>
              </div>

              <div className={styles.field} style={{ maxWidth: 200 }}>
                <label className={styles.fieldLabel}>性别 *</label>
                <div className={styles.genderGroup}>
                  <label className={`${styles.genderOption} ${watchedMf === '男' ? styles.genderActive : ''}`}>
                    <ManOutlined /> 男
                    <input type="radio" value="男" className={styles.radioHidden} {...register('ctMf')} />
                  </label>
                  <label className={`${styles.genderOption} ${watchedMf === '女' ? styles.genderActive : ''}`}>
                    <WomanOutlined /> 女
                    <input type="radio" value="女" className={styles.radioHidden} {...register('ctMf')} />
                  </label>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>邮箱</label>
                  <div className={`${styles.inputBox} ${errors.ctEm ? styles.inputBoxError : ''}`}>
                    <MailOutlined className={styles.inputIcon} />
                    <input className={styles.inputField} {...register('ctEm')} />
                  </div>
                  {errors.ctEm && <span className={styles.fieldError}>{errors.ctEm.message}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>出生日期</label>
                  <div className={styles.inputBox}>
                    <CalendarOutlined className={styles.inputIcon} />
                    <input type="date" className={styles.inputField} {...register('ctBirth')} />
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>地址</label>
                <div className={styles.inputBox}>
                  <EnvironmentOutlined className={styles.inputIcon} />
                  <input className={styles.inputField} {...register('ctAd')} />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>邮编</label>
                  <div className={`${styles.inputBox} ${errors.ctYb ? styles.inputBoxError : ''}`}>
                    <NumberOutlined className={styles.inputIcon} />
                    <input className={styles.inputField} {...register('ctYb')} />
                  </div>
                  {errors.ctYb && <span className={styles.fieldError}>{errors.ctYb.message}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>QQ</label>
                  <div className={`${styles.inputBox} ${errors.ctQq ? styles.inputBoxError : ''}`}>
                    <QqOutlined className={styles.inputIcon} />
                    <input className={styles.inputField} {...register('ctQq')} />
                  </div>
                  {errors.ctQq && <span className={styles.fieldError}>{errors.ctQq.message}</span>}
                </div>
              </div>

              <div className={styles.field} style={{ maxWidth: '50%' }}>
                <label className={styles.fieldLabel}>微信</label>
                <div className={`${styles.inputBox} ${errors.ctWx ? styles.inputBoxError : ''}`}>
                  <WechatOutlined className={styles.inputIcon} />
                  <input className={styles.inputField} {...register('ctWx')} />
                </div>
                {errors.ctWx && <span className={styles.fieldError}>{errors.ctWx.message}</span>}
              </div>

              <div className={styles.actions}>
                <Button icon={<CloseOutlined />} onClick={cancelEdit}>取消</Button>
                <button type="submit" disabled={saving} className={styles.submitBtn}>
                  {saving ? <Spin size="small" /> : <><SaveOutlined /> 保存</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Tag Modal - inside the outer div but outside .wrapper */}
      <Modal
        title={<><TagOutlined /> 管理标签</>}
        open={tagModalOpen}
        onCancel={() => setTagModalOpen(false)}
        onOk={() => tagForm.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={tagForm} onFinish={handleSaveTags}>
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

const Field: React.FC<{
  label: string; value: string; icon: React.ReactNode; span?: boolean;
}> = ({ label, value, icon, span }) => (
  <div className={span ? styles.infoFieldSpan : styles.infoField}>
    <span className={styles.infoIcon}>{icon}</span>
    <div>
      <div className={styles.infoLabel}>{label}</div>
      <div className={styles.infoValue}>{value}</div>
    </div>
  </div>
);

export default ContactDetailPage;
