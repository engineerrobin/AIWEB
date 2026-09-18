// 创建axios实例
import axios from 'axios';
// 引入antd的message组件用于提示错误信息
import { message } from 'antd';
// 引入路由器实例，用于在401错误时跳转到登录页
import router from '../router';
const service = axios.create({
  // baseURL: 'http://localhost:3000', // api的base_url
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});
// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 设置token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 判断
    return Promise.reject(error);
  }
);  
// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // http状态为200时的处理,返回的json对象为错误信息
    if (response.data.status ==='error') {
      return Promise.reject(new Error(`请求失败，${response.data.message}`));
    }
    return response.data;
    },
    (error) => {
      // (1) 没有 HTTP 状态码的情况(网络层)
      if (!error.response) {
        if (error.message.includes('timeout')) {
          message.error('请求超时，请检查网络');
        } else {
          message.error('网络异常，请检查您的网络连接');
        }
        // 返回
        // return Promise.reject(error);
      }
      // (2) 有 HTTP 状态码的情况（http 层）: 400/401/403/404/500/502/503/504
      const { status, data } = error.response;
      let errMsg = '';
      console.log('HTTP错误状态码:', status);
      switch (status) {
        case 400:
          errMsg = '请求参数有误';
          break;
        case 401:
          // 这里通常已经在上面成功拦截的 code=401 处理了，但以防万一做兜底
          errMsg = '未授权，请重新登录';
          localStorage.removeItem('auth_token');
          router.push('/login');
          break;
        case 403:
          errMsg = '您没有权限执行此操作';
          break;
        case 404:
          errMsg = '请求的资源不存在';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errMsg = '服务器维护中，请稍后再试';
          break;
        default:
          errMsg = data?.msg || `连接异常 (${status})`;
          message.error(errMsg);
          // return Promise.reject(error);
      }
      // switch 命中后统一在这里提示并把错误继续抛出，否则 errMsg 被丢弃、错误被吞成"成功"
      message.error(errMsg);
      // return Promise.reject(error);
  }
);
export default service;