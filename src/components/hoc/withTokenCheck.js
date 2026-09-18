// 路由守卫组件：检查用户是否已登录
import React from 'react';
import { Navigate } from 'react-router-dom';
const WithTokenCheck = ({children}) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        // 如果没有 token，重定向到登录页
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

export default WithTokenCheck;