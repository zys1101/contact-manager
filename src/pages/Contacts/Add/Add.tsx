import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, message, Spin } from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, PhoneOutlined, MailOutlined,
  EnvironmentOutlined, QqOutlined, WechatOutlined, CalendarOutlined,
  NumberOutlined, ManOutlined, WomanOutlined, PlusOutlined,
} from '@ant-design/icons';
import { contactService } from '../../../services/contactService';
import WeatherWidget from '../../../components/WeatherWidget/WeatherWidget';
import type { ContactFormData } from '../../../types';
import styles from './Add.module.css';

const phoneRegex = /^1[3-9]\d{9}$/;
const zipRegex = /^\d{6}$/;
const qqRegex = /^\d{5,11}$/;

const contactSchema = z.object({
  ctName: z.string().min(1, '请输入姓名').min(2, '姓名至少2个字符'),
  ctPhone: z.string().min(1, '请输入手机号').regex(phoneRegex, '手机号格式不正确'),
  ctMf: z.enum(['男', '女'], { required_error: '请选择性别' }),
  ctAd: z.string().max(100, '地址不超过100个字符').optional().or(z.literal('')),
  ctYb: z.string().regex(zipRegex, '邮编必须为6位数字').optional().or(z.literal('')),
  ctQq: z.string().regex(qqRegex, 'QQ号格式不正确').optional().or(z.literal('')),
  ctWx: z.string().min(6, '微信号至少6个字符').max(20, '微信号不超过20个字符').optional().or(z.literal('')),
  ctEm: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  ctBirth: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof contactSchema>;

const initialValues: FormValues = {
  ctName: '',
  ctPhone: '',
  ctMf: '男',
  ctAd: '',
  ctYb: '',
  ctQq: '',
  ctWx: '',
  ctEm: '',
  ctBirth: '',
};

const ContactAdd: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const watchedMf = watch('ctMf');

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      message.error('仅支持 JPG、JPEG、PNG 格式');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('头像大小不能超过5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const data: ContactFormData = {
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
      const result = await contactService.createContact(data);
      if (avatarFile && result.ctId) {
        await contactService.uploadAvatar(result.ctId, avatarFile);
      }
      message.success('联系人添加成功');
      navigate('/contacts', { replace: true });
    } catch {
      message.error('添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.bg}>
        <div className={styles.grain} />
        <div className={styles.orb} />
      </div>

      <div className={styles.wrapper}>
        <button className={styles.backBtn} onClick={() => navigate('/contacts')}>
          <ArrowLeftOutlined /> 返回列表
        </button>

        <div style={{ marginBottom: 24 }}>
          <WeatherWidget />
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>新增联系人</h1>
          <p className={styles.subtitle}>NEW CONTACT</p>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
            {/* 头像 */}
            <div className={styles.avatarSection}>
              <div className={styles.avatarBox}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="预览" className={styles.avatarImg} />
                ) : (
                  <UserOutlined className={styles.avatarPlaceholder} />
                )}
              </div>
              <div className={styles.avatarActions}>
                <label className={styles.uploadLabel}>
                  <PlusOutlined /> 选择头像
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleAvatarSelect}
                    className={styles.fileInput}
                  />
                </label>
                {avatarFile && (
                  <button type="button" className={styles.removeBtn} onClick={removeAvatar}>
                    移除
                  </button>
                )}
              </div>
            </div>

            {/* 必填区 */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>基本信息</div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>姓名 *</label>
                  <div className={`${styles.inputBox} ${errors.ctName ? styles.inputBoxError : ''}`}>
                    <UserOutlined className={styles.inputIcon} />
                    <input className={styles.inputField} placeholder="请输入姓名" {...register('ctName')} />
                  </div>
                  {errors.ctName && <span className={styles.fieldError}>{errors.ctName.message}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>手机号 *</label>
                  <div className={`${styles.inputBox} ${errors.ctPhone ? styles.inputBoxError : ''}`}>
                    <PhoneOutlined className={styles.inputIcon} />
                    <input className={styles.inputField} placeholder="请输入手机号" {...register('ctPhone')} />
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
                {errors.ctMf && <span className={styles.fieldError}>{errors.ctMf.message}</span>}
              </div>
            </div>

            {/* 选填区 */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>选填信息</div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>邮箱</label>
                  <div className={`${styles.inputBox} ${errors.ctEm ? styles.inputBoxError : ''}`}>
                    <MailOutlined className={styles.inputIcon} />
                    <input className={styles.inputField} placeholder="请输入邮箱" {...register('ctEm')} />
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
                  <input className={styles.inputField} placeholder="请输入地址" {...register('ctAd')} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>邮编</label>
                  <div className={`${styles.inputBox} ${errors.ctYb ? styles.inputBoxError : ''}`}>
                    <NumberOutlined className={styles.inputIcon} />
                    <input className={styles.inputField} placeholder="6位邮编" {...register('ctYb')} />
                  </div>
                  {errors.ctYb && <span className={styles.fieldError}>{errors.ctYb.message}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>QQ</label>
                  <div className={`${styles.inputBox} ${errors.ctQq ? styles.inputBoxError : ''}`}>
                    <QqOutlined className={styles.inputIcon} />
                    <input className={styles.inputField} placeholder="QQ号码" {...register('ctQq')} />
                  </div>
                  {errors.ctQq && <span className={styles.fieldError}>{errors.ctQq.message}</span>}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>微信</label>
                <div className={`${styles.inputBox} ${errors.ctWx ? styles.inputBoxError : ''}`}>
                  <WechatOutlined className={styles.inputIcon} />
                  <input className={styles.inputField} placeholder="微信号" {...register('ctWx')} />
                </div>
                {errors.ctWx && <span className={styles.fieldError}>{errors.ctWx.message}</span>}
              </div>
            </div>

            {/* 按钮 */}
            <div className={styles.actions}>
              <Button size="large" onClick={() => navigate('/contacts')}>取消</Button>
              <button type="submit" disabled={submitting} className={styles.submitBtn}>
                {submitting ? <Spin size="small" /> : <><PlusOutlined /> 添加联系人</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactAdd;
