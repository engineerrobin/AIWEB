// 采用懒加载的方式引入SSQPage组件，只有在访问该路由时才会加载该组件，从而减少初始加载时间
import React, { lazy } from "react";
// 引入createBrowserRouter函数
import { createBrowserRouter } from "react-router-dom";
// 引入路由对应的组件
import App from "../App";
import DPage from "../pages/3D/3D";
// 引入高阶组件
import WithTokenCheck from "../components/hoc/withTokenCheck";
// 引入错误边界组件
import { ErrorBoundary } from 'react-error-boundary';
const SSQPage = lazy(() => import("../pages/ssq/ssq"));
const Conversation = lazy(() => import("../pages/conversation/conversation"));
const Register = lazy(() => import("../pages/register/register"));
const LotteryPage = lazy(() => import("../pages/lottery/lottery"));

// 创建路由对象
const routes = createBrowserRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary FallbackComponent={() => <h1 style={{ textAlign: 'center' }}>出错了，请联系开发人员</h1>}>
        <WithTokenCheck><LotteryPage /></WithTokenCheck>
      </ErrorBoundary>
    ),
    children: [
      {
        // path: "/lottery/ssq",
        index: true,
        element: (
          <ErrorBoundary FallbackComponent={() => <h1 style={{ textAlign: 'center' }}>出错了，联系开发人员</h1>}>
            <WithTokenCheck><SSQPage /></WithTokenCheck>
          </ErrorBoundary>
        )
      },
      {
        path: "/lottery/conversation",
        element: (
          <ErrorBoundary FallbackComponent={() => <h1 style={{ textAlign: 'center' }}>出错了，联系开发人员</h1>}>
            <WithTokenCheck><Conversation /></WithTokenCheck>
          </ErrorBoundary>
        ),
      },
      {
        path:"/lottery/3D",
        element: (
          <ErrorBoundary FallbackComponent={() => <h1 style={{ textAlign: 'center' }}>出错了，联系开发人员</h1>}>
            <WithTokenCheck><DPage /></WithTokenCheck>
          </ErrorBoundary>
        ),
      },
    ],
  },
  {
      path: "/login",
      element:<App />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  // 设置默认路由，当访问根路径时，重定向到 /lottery 页面
  {
    path: "*",
    element: <h1>404 Not Found</h1>,
  }
]);
// 默认暴露路由对象(默认暴露引入时不需要大括号)
export default routes;