import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';
import { LockOutlined, HomeOutlined } from '@ant-design/icons';

const UnauthorizedPage = () => {
  return (
    <div style={{ padding: '40px 0' }}>
      <Result
        status="403"
        title="Access Denied"
        subTitle="Sorry, you don't have permission to access this page."
        icon={<LockOutlined />}
        extra={[
          <Button type="primary" key="home" icon={<HomeOutlined />}>
            <Link to="/">Go Home</Link>
          </Button>,
          <Button key="workspace" type="default">
            <Link to="/workspaces">Switch Workspace</Link>
          </Button>
        ]}
      />
    </div>
  );
};

export default UnauthorizedPage; 