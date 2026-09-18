import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as registerApi } from '../../apis/index.js';

// 引入button组件
import { Button, message } from 'antd';
import '../../App.less';
import './register.less';

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !phone.trim() || !passwordConfirm.trim()) {
      message.error('用户名、手机号和密码不能为空');
      return;
    }

    // 简单手机号校验（中国手机号 11 位）
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      message.error('请输入有效的手机号');
      return;
    }

    if (password !== passwordConfirm) {
      message.error('两次输入的密码不一致');
      return;
    }
    try {
      const response = await registerApi({ username, password, phone });
      if (response.statusCode === 200) {
        message.success('注册成功，请登录');
        navigate('/');
      } else {
        message.error(response.message || '注册失败');
      }
    } catch (error) {
      message.error(error.message || '注册请求失败，请稍后再试');
    }
  };

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-header">
          <h1>注册</h1>
          <p className="lead">创建一个账号以保存你的会话和设置。</p>
        </div>
        <form className="login-form" onSubmit={handleRegister}>
          <label>用户名</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
          <label>手机号</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" />
          <label>密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <label>确认密码</label>
          <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
          <div className="login-form-actions">
            <Button type="primary" htmlType="submit" size='large'>注册</Button>
            <Button type="default" style={{ marginLeft: 8 }} onClick={() => navigate(-1)} size='large'>返回</Button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Register;
