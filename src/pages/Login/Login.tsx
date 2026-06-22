import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store';
import styles from './Login.module.css';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名').min(2, '用户名至少2个字符'),
  password: z.string().min(1, '请输入密码').min(6, '密码至少6个字符'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login: storeLogin, setLoading } = useAuthStore();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await authService.login(values);

      storeLogin(response.user, response.token, response.refreshToken);
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(response.user));

      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || '登录失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.bg}>
        <div className={styles.grain} />
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>&#9632;</span>
        </div>

        <h1 className={styles.title}>联系人管理</h1>
        <p className={styles.subtitle}>CONTACT MANAGEMENT SYSTEM</p>

        {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>账号</label>
            <div className={`${styles.inputBox} ${errors.username ? styles.inputBoxError : ''}`}>
              <UserOutlined className={styles.inputIcon} />
              <input
                type="text"
                placeholder="请输入用户名"
                className={styles.inputField}
                autoComplete="username"
                {...register('username')}
              />
            </div>
            {errors.username && (
              <span className={styles.fieldError}>{errors.username.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>密码</label>
            <div className={`${styles.inputBox} ${errors.password ? styles.inputBoxError : ''}`}>
              <LockOutlined className={styles.inputIcon} />
              <input
                type={passwordVisible ? 'text' : 'password'}
                placeholder="请输入密码"
                className={styles.inputField}
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setPasswordVisible((v) => !v)}
                tabIndex={-1}
              >
                {passwordVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {errors.password && (
              <span className={styles.fieldError}>{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? (
              <span className={styles.btnLoading}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </span>
            ) : (
              '登 录'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <span className={styles.footerText}>
            Demo: admin / 123456
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
