import { useEffect, useState } from 'react';
// 引入路由组件
import { useNavigate } from 'react-router-dom';
import './App.less';
// 引入antd
import{message}from'antd';
// 引入登录API
import { login } from './apis/index.js';
function App() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState('');

  useEffect(() => {
    const cachedUser = localStorage.getItem('auth_user');

    if (cachedUser) {
      setUsername(cachedUser);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // trim() 方法用于去除字符串两端的空格
    if (!username.trim() || !password.trim()) {
      message.error('用户名和密码不能为空');
      return;
    }
    // 请求登录接口
    try {
      const response = await login({ username: username, password: password});
      // 业务层错误处理：如果后端返回的状态码不是200，则提示错误信息
      if(response.statusCode !== 200){
        message.error(response.message || '登录失败');
        return;
      }
      const newToken = response.token;
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', username.trim());
      localStorage.setItem('role', response.role);
      setPassword('');
      message.success('登录成功');
      navigate('/'); // 登录成功后跳转到首页
    } catch (error) {
      // 接口层已经处理了401错误，这里只需要处理其他错误
      // message.error(error.message || '登录失败');
    }
  };

  return (
    <div className="App">
      <main className="login-shell">
        <section className="login-card">
          <div className="login-header">
            <h1>登录</h1>
            <p className="lead">使用账号登录以开始AI选号</p>
          </div>
            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="username">用户名</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="请输入用户名"
              />

              <label htmlFor="password">密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
              />
              <button type="submit" className="btn">
                登录
              </button>
              <div className="register-row">
                <span>没有账号？</span>
                <button type="button" className="link-btn" onClick={() => navigate('/register')}>
                  注册
                </button>
              </div>
            </form>
        </section>
      </main>
    </div>
  );
}

export default App;
