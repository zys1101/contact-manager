import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Input, message, Popconfirm, Empty, Spin, Tag as AntTag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { tagService } from '../../services/tagService';
import { Tag, TagFormData } from '../../types/tag';
import styles from './Tags.module.css';

const PRESET_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#ff4d4f',
  '#722ed1', '#13c2c2', '#eb2f96', '#2f54eb',
  '#fa8c16', '#a0d911', '#f5222d', '#1da57a',
];

const Tags: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tagService.getTags();
      setTags(data);
    } catch {
      message.error('加载标签失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTags(); }, [loadTags]);

  const handleCreate = async (values: TagFormData) => {
    try {
      await tagService.createTag(values);
      message.success('标签创建成功');
      setAddModalOpen(false);
      loadTags();
    } catch {
      message.error('创建失败');
    }
  };

  const handleEdit = async (values: TagFormData) => {
    if (!editingTag) return;
    try {
      await tagService.updateTag(editingTag.tagId, values);
      message.success('标签更新成功');
      setEditModalOpen(false);
      loadTags();
    } catch {
      message.error('更新失败');
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      await tagService.deleteTag(tagId);
      message.success('标签已删除');
      loadTags();
    } catch {
      message.error('删除失败');
    }
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    editForm.setFieldsValue({ tagName: tag.tagName, tagColor: tag.tagColor });
    setEditModalOpen(true);
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
          <h1 className={styles.title}>标签管理</h1>
          <p className={styles.subtitle}>TAG MANAGEMENT</p>
        </div>

        {tags.length === 0 ? (
          <Empty description="暂无标签，点击下方添加" />
        ) : (
          <div className={styles.grid}>
            {tags.map((tag) => (
              <div key={tag.tagId} className={styles.tagCard}>
                <div className={styles.tagHeader}>
                  <div className={styles.tagDot} style={{ background: tag.tagColor }} />
                  <span className={styles.tagName}>{tag.tagName}</span>
                  <div className={styles.tagActions}>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(tag)} />
                    <Popconfirm title="确定删除此标签？" onConfirm={() => handleDelete(tag.tagId)}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </div>
                <div className={styles.tagCount}>
                  关联联系人: {tag.contactCount ?? 0} 人
                </div>
              </div>
            ))}
            <div className={styles.addCard} onClick={() => setAddModalOpen(true)}>
              <PlusOutlined className={styles.plusIcon} />
              <span>添加标签</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        title="添加标签"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={() => form.submit()}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ tagColor: '#1890ff' }}>
          <Form.Item name="tagName" label="标签名称" rules={[{ required: true, message: '请输入标签名称' }]}>
            <Input placeholder="如: 重要客户" />
          </Form.Item>
          <Form.Item name="tagColor" label="标签颜色">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((color) => (
                <div
                  key={color}
                  onClick={() => form.setFieldsValue({ tagColor: color })}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: color,
                    cursor: 'pointer',
                    border: form.getFieldValue('tagColor') === color ? '3px solid #333' : '3px solid transparent',
                  }}
                />
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="编辑标签"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="tagName" label="标签名称" rules={[{ required: true, message: '请输入标签名称' }]}>
            <Input placeholder="如: 重要客户" />
          </Form.Item>
          <Form.Item name="tagColor" label="标签颜色">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((color) => (
                <div
                  key={color}
                  onClick={() => editForm.setFieldsValue({ tagColor: color })}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: color,
                    cursor: 'pointer',
                    border: editForm.getFieldValue('tagColor') === color ? '3px solid #333' : '3px solid transparent',
                  }}
                />
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tags;
