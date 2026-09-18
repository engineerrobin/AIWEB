import './index.css';
import 'streamdown/styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
// 引入RouterProvider组件和路由配置
import { RouterProvider } from 'react-router-dom';
// 引入configProvider组件和配置
import { ConfigProvider } from 'antd';
// 引入中文语言包
import zhCN from 'antd/locale/zh_CN';
import routes  from './router/index.js';
// 引入redux的Provider组件和store对象
import { Provider } from 'react-redux';
import store from './store'; 
const root = ReactDOM.createRoot(document.getElementById('root'));
// 配置主题颜色
let object = {
  token: {
    colorPrimary: '#e56b2f',
  },
  components:{
    Button: {
      colorPrimary: '#e56b2f',
      defaultHoverBorderColor: '#e56b2f',
      defaultActiveBorderColor: '#e56b2f',
      defaultActiveBgColor: '#e56b2f',
    },
  }
};

root.render(

  // <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={{
      ...object,
    }}>
      <Provider store={store}>
        <RouterProvider router={routes} />
      </Provider>
    </ConfigProvider>
  // </React.StrictMode>
);

