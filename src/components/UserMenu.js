import React, { useState } from 'react';
import { Dropdown, Menu, Avatar, Modal, Button } from 'antd';
import { UserOutlined, LogoutOutlined, BarChartOutlined } from '@ant-design/icons';

export default function UserMenu({ username }) {
  const [visible, setVisible] = useState(true);
  const token = localStorage.getItem('auth_token') || '';

  const menu = (
    <Menu>
      <Menu.Item key="stats" icon={<BarChartOutlined />} onClick={() => setVisible(true)}>
        Token 统计
      </Menu.Item>
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        onClick={() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/';
        }}
      >
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="user-menu">
      <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
        <div className="user-button" aria-haspopup>
          <Avatar size={36} icon={<UserOutlined />} />
          <span className="user-name">{username || '访客'}</span>
        </div>
      </Dropdown>

      <Modal
        title="Token 统计"
        visible={visible}
        footer={<Button onClick={() => setVisible(false)}>关闭</Button>}
        onCancel={() => setVisible(false)}
      >
        <p>当前 token 长度: {token.length}</p>
        <p>是否存在 token: {token ? '是' : '否'}</p>
      </Modal>
    </div>
  );
}
