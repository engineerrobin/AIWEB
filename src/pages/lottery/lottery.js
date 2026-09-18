import './lottery.less';
// 引入菜单api
import { getMenu, getUserToken, getUserTokenBalance } from '../../apis/index.js';
import React, { useState,useEffect } from 'react';
// 引入封装的icon组件
import Icon from '../../components/iconSvg/icon.js';
// 引入折线图组件
import LineChart from '../../components/lineChart.js';
// 引入react-router-dom的useNavigate钩子函数
import { Outlet, useNavigate } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined, 
  SettingOutlined, 
} from '@ant-design/icons';
import { Button, Layout, Menu, Avatar,message,Dropdown,Space,Modal} from 'antd';
const { Header, Sider, Content } = Layout;
const LotteryPage = () => {
  const navigate = useNavigate();
  const [menuData, setMenuData] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [siderCollapsedByBreakpoint, setSiderCollapsedByBreakpoint] = useState(false);
  // 根据窗口宽度初始化侧边栏显示状态
  const [siderBar, setSiderBar] = useState(window.innerWidth >= 768);
  // token使用情况数据
  const [tokenUsageData, setTokenUsageData] = useState([]);
  // 用户 token 余额
  const [tokenBalance, setTokenBalance] = useState(0);
  // open状态用来控制token消耗统计模态框的显示与隐藏
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const menuData = await getMenu();
        if (menuData.status === 'success'){
          setMenuData(menuData.data);
        }
      } catch (error) {
        message.error(error.message || '获取菜单数据失败');
        navigate('/login'); 
      }
    };
    fetchMenuData();
  }, []);
  useEffect(() => {
    // 监听窗口大小变化
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
        setSiderBar(false);
      }else{
        setCollapsed(false);
        setSiderBar(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  // 根据用户角色动态生成菜单项
  let items=function() {
    let role = localStorage.getItem('role')==='65a1b2c3d4e5f67890a1b2c4';
    if(!role){
      return [
        {
          key: 'tokenCount',
          label: 'token统计',
          icon: <SettingOutlined />,
        },
        {
          type: 'divider',
        },
        {
          key: 'logout',
          label: '退出',
          icon: <LogoutOutlined />,
          danger: true,
        },
      ];
    }
    return[
        {
          key: 'logout',
          label: '退出',
          icon: <LogoutOutlined />,
          danger: true,
        }
    ]
  }();
  // 获取token余额和使用情况数据
  const fetchTokenData = async () => {
  try {
    const response = await getUserTokenBalance();
    if (response.status === 'success'){
      console.log('Token balance response:', response);
      setTokenBalance(response.data.tokensBalance);
      
    }
  } catch (error) {
    message.error(error.message || '获取用户 token 余额失败');
    navigate('/login'); 
  }
};
// 获取用户 token 使用情况数据
  const fetchTokenUsageData = async () => {
    try {
      const response = await getUserToken();
      if (response.status === 'success') {
        // 可以将获取到的 token 使用情况传递给折线图组件
        console.log('Token usage response:', response);
        setTokenUsageData(response.data);
        fetchTokenData();
      }
    } catch (error) {
      message.error(error.message || '获取用户 token 使用情况失败');
      navigate('/login'); 
    }
  };
  const sharedProps = {
    menu: { 
      items,
      onClick: ({ key }) => {
        if (key === 'logout') {
          // 清除本地存储的 token 和用户信息
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          // 跳转到登录页
          navigate('/login');
        }else{
          // 打开模态框
          setOpen(true);
          fetchTokenUsageData();
          // fetchTokenData();
        }
      } 
   },
    placement: 'bottomLeft',
  };
  return (
    <div className="lottery-page">
      <Modal
        title="token消耗统计"
        open={open}
        okText="关闭"
        onCancel={() => setOpen(false)}
        centered={true}
        footer={null}
        getContainer={document.getElementsByClassName('lottery-page')[0]}
        zIndex={20000}
      >
        <LineChart data={Object.values(tokenUsageData)} xTitle={Object.keys(tokenUsageData)} />
        <div className="tokenMessage">
          您的token余额为：{tokenBalance}
        </div>
      </Modal>
      <Layout>
      {siderBar ?
        <Sider
        trigger={null}
        collapsible
        collapsed={collapsed || siderCollapsedByBreakpoint}
        breakpoint="md"
        collapsedWidth={0}
        onBreakpoint={(broken) => setSiderCollapsedByBreakpoint(broken)}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={['/ssq']}
          items={menuData.map((item) => (
            {
              key: item.path,
              icon: <Icon name={item.icon} style={{ width: '16px', height: '16px' }} />,
              label: item.name,
            }
          ))}
          onClick={({key}) => {
            if(key==='/ssq') {
              navigate('/');
            }else{
              navigate(`/lottery${key}`);
            }
          }}  
        />
      </Sider> : <Header>
        <Menu
          items={menuData.map((item) => (
            {
              key: item.path,
              icon: <Icon name={item.icon} style={{ width: '16px', height: '16px' }} />,
              label: item.name,
            }
          ))}
          onClick={({key}) => {
            if(key==='/ssq') {
              navigate('/');
            }else{
              navigate(`/lottery${key}`);
            } 
          }}  
        />
      </Header>}
      <Layout>
        {siderBar ?
        <div className="lottery-header">
          <Header>
           <Button
              type="text"
              icon={collapsed || siderCollapsedByBreakpoint ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <div className="user-info">
              <Dropdown {...sharedProps} trigger={['hover']}>
                  <Space>
                    您好<Avatar size={35}>{localStorage.getItem('auth_user')}</Avatar>
                  </Space>
              </Dropdown>
            </div>
          </Header>
        </div>:<div className="phone-user-info">
              <Dropdown {...sharedProps} trigger={['hover']}>
                  <Space>
                    <Avatar size={35}>{localStorage.getItem('auth_user')}</Avatar>
                  </Space>
              </Dropdown>
            </div>}
        <Content>
          <Outlet />
        </Content>
      </Layout>
      </Layout>
    </div>
  );
};

export default LotteryPage;