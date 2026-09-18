// 引入 craco-less 插件,作用是为了在 create-react-app 项目中支持 less 语法
const CracoLessPlugin = require('craco-less');
// 引入路径模块
const path = require('path');
module.exports = {
// 配置 craco-less 插件
  plugins: [
    {
      // 配置 craco-less 插件,作用是为了在 create-react-app 项目中支持 less 语法
      plugin: CracoLessPlugin,
      // 配置 less-loader 选项
      options: {
        lessLoaderOptions: {
        // 配置 less-loader 选项
          lessOptions: {
            modifyVars: { '@primary-color': '#1DA57A' }, // 自定义 less 变量
            javascriptEnabled: true,// 允许在 less 文件中使用 JavaScript 表达式
          },
        },
      },
    },
  ],
  // 配置 Babel(babel作用是对 JavaScript 代码进行转译，使其兼容不同浏览器)
  babel:{
    // 配置 Babel 插件
      plugins: [
      [
        // 配置按需加载 antd 组件及样式
        'import',
        {
          // 配置按需加载 antd 组件及样式的选项
          libraryName: 'antd',
          // 指定按需加载的目录为 es
          libraryDirectory: 'es',
          // 自动导入对应的 Less 样式
          style: true, 
        },
        // 指定按需加载的库名称
        'antd',
      ],
    ],
  },

// 配置代理
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '',
        },
      },
    },
  },
  webpack: {
    // 配置路径别名(例如 '@' 指向 'src' 目录)
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig, { env, paths }) => {
        // 配置 Webpack 输出选项，设置哈希函数为 sha256
        webpackConfig.output = {
          ...webpackConfig.output,
          hashFunction: 'sha256',
        };
      if (env === 'production') {
        // 关闭源码映射
        webpackConfig.devtool = false;
        // 生产环境下的代码分割配置
        webpackConfig.optimization.splitChunks = {
          // 保留原有的 splitChunks 配置，确保自定义的 cacheGroups 不会覆盖默认配置
          ...webpackConfig.optimization.splitChunks,
          // 自定义的 cacheGroups 配置，用于将不同的依赖打包到不同的文件中
          cacheGroups: {
            reactBase: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom|@reduxjs\/toolkit|react-redux)[\\/]/,
              name: 'react-vendor',
              chunks: 'all',
              priority: 100,
            },
            // 其他第三方库的打包配置可以在这里添加
            antd: {
              test: /[\\/]node_modules[\\/]antd[\\/]/,
              name: 'antd-vendor',
              chunks: 'all',
              priority: 90,
            },
            // 其他第三方库的打包配置可以在这里添加
            echarts: {
              test: /[\\/]node_modules[\\/]echarts[\\/]/,
              name: 'echarts-vendor',
              chunks: 'all',
              priority: 85,
            },
            // 其他第三方库的打包配置可以在这里添加
            commons: {
              chunks: 'all',
              minChunks: 2,
              name: 'commons',
              priority: 80,
            },
          },
        };
      }
      return webpackConfig;
    },
  },
};
