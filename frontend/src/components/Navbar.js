import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Space, Divider } from 'antd';
import { 
  HomeOutlined, 
  AppstoreOutlined, 
  FileAddOutlined, 
  UserOutlined, 
  LoginOutlined, 
  LogoutOutlined, 
  UserAddOutlined,
  BugOutlined,
  LineChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import WorkspaceHeader from './WorkspaceHeader';
import { useAuth } from '../context/AuthContext';

const { Header } = Layout;

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, currentWorkspace } = useAuth();
  const [selectedKey, setSelectedKey] = useState('/');

  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) {
      setSelectedKey('/');
    } else {
      setSelectedKey(`/${pathSegments[0]}`);
    }
  }, [location]);

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  // Main menu items based on authentication status
  const getMenuItems = () => {
    const items = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: <Link to="/">Home</Link>,
      }
    ];

    // Add authenticated routes
    if (isAuthenticated()) {
      // Show menu items regardless of workspace selection
      items.push(
        {
          key: '/games',
          icon: <AppstoreOutlined />,
          label: <Link to="/games">Games</Link>,
        },
        {
          key: '/reports',
          icon: <BugOutlined />,
          label: <Link to="/reports">Reports</Link>,
        },
        {
          key: '/statistics',
          icon: <LineChartOutlined />,
          label: <Link to="/statistics">Statistics</Link>,
        }
      );
    }

    return items;
  };

  return (
    <Header style={{ 
      position: 'fixed', 
      zIndex: 1, 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      padding: '0 24px',
      overflow: 'auto'
    }}>
      <div 
        style={{ 
          color: 'white', 
          fontSize: '18px', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          overflow: 'auto'
        }}
      >
        <Link to="/" style={{ color: 'white', marginRight: 20, whiteSpace: 'nowrap' }}>
          Game Master Support
        </Link>
        
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={getMenuItems()}
          style={{ minWidth: 'auto', flex: 1 }}
          overflowedIndicator={null}
          disabledOverflow={true}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        {isAuthenticated() ? (
          <>
            {currentWorkspace && (
              <>
                <WorkspaceHeader />
                <Divider type="vertical" style={{ backgroundColor: '#303030', height: 20, margin: '0 16px' }} />
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#1890ff', marginRight: 8 }}
                size="small"
              />
              <span style={{ color: 'white', marginRight: 16 }}>{user?.name || 'User'}</span>
              <Button 
                type="text" 
                icon={<LogoutOutlined />} 
                style={{ color: 'white' }}
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Logout
              </Button>
            </div>
          </>
        ) : (
          <Space>
            <Button 
              type="text" 
              icon={<LoginOutlined />} 
              style={{ color: 'white' }}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Space>
        )}
      </div>
    </Header>
  );
};

export default Navbar; 