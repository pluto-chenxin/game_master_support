import React from 'react';
import { Button, Dropdown, Menu, Space, Typography } from 'antd';
import { TeamOutlined, DownOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Text } = Typography;

const WorkspaceHeader = () => {
  const { currentWorkspace, workspaces, switchWorkspace } = useAuth();
  const navigate = useNavigate();

  if (!currentWorkspace || !workspaces || workspaces.length === 0) {
    return (
      <Button 
        type="primary" 
        icon={<TeamOutlined />} 
        onClick={() => navigate('/workspaces')}
      >
        Select Workspace
      </Button>
    );
  }

  const menu = (
    <Menu>
      <Menu.Item key="workspace-settings" onClick={() => navigate('/workspace-settings')}>
        <SettingOutlined /> Workspace Settings
      </Menu.Item>
      <Menu.Divider />
      {Array.isArray(workspaces) && workspaces.map(workspace => (
        <Menu.Item 
          key={workspace.id} 
          onClick={() => {
            switchWorkspace(workspace);
            // Force a page reload to ensure all components refresh with the new workspace
            window.location.reload();
          }}
          disabled={workspace.id === currentWorkspace?.id}
        >
          {workspace.name}
        </Menu.Item>
      ))}
      <Menu.Divider />
      <Menu.Item key="manage" onClick={() => navigate('/workspaces')}>
        Manage Workspaces
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Button type="link" style={{ color: 'white', padding: 0 }}>
        <Space>
          <TeamOutlined />
          <Text style={{ color: 'white' }} ellipsis={{ tooltip: currentWorkspace?.name }}>
            {currentWorkspace?.name}
          </Text>
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  );
};

export default WorkspaceHeader; 