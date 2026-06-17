// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

// 后端统一返回结构
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class ApiService {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const res = response.data;
        if (res.code === 200) {
          return res.data as unknown as AxiosResponse;
        }
        message.error(res.message || '请求失败');
        return Promise.reject(new Error(res.message || '请求失败'));
      },
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          switch (status) {
            case 401:
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userInfo');
              message.error('登录已过期，请重新登录');
              window.location.href = '/login';
              break;
            case 403:
              message.error('没有权限访问该资源');
              break;
            case 404:
              message.error('请求的资源不存在');
              break;
            case 500:
              message.error(data?.message || '服务器错误，请稍后重试');
              break;
            default:
              message.error(data?.message || '网络错误');
          }
        } else if (error.request) {
          message.error('网络连接失败，请检查网络');
        } else {
          message.error('请求配置错误');
        }
        return Promise.reject(error);
      },
    );
  }

  public get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config) as Promise<T>;
  }

  public post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config) as Promise<T>;
  }

  public put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config) as Promise<T>;
  }

  public delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config) as Promise<T>;
  }

  public upload<T = unknown>(url: string, file: File, config?: AxiosRequestConfig): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    return this.instance.post(url, formData, {
      ...config,
      headers: { ...config?.headers },
    }) as Promise<T>;
  }
}

const apiService = new ApiService();
export default apiService;
