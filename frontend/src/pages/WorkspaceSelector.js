import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, List, Button, Modal, Form, 
  Input, Spin, Empty, Tag, Divider 
} from 'antd';
import { 
  PlusOutlined, SelectOutlined, AppstoreOutlined, 
  TeamOutlined, SettingOutlined, EditOutlined 
} from '@ant-design/icons';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const WorkspaceSelector = () => {
  const { user, workspaces, currentWorkspace, switchWorkspace, isAuthenticated } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  // Redirect to home if there's only one workspace and it's already selected
  useEffect(() => {
    if (workspaces.length === 1 && currentWorkspace && currentWorkspace.id === workspaces[0].id) {
      navigate('/');
    }
  }, [workspaces, currentWorkspace, navigate]);

  const handleCreateWorkspace = async (values) => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/workspaces', values);
      
      // Reload the page to refresh workspaces
      window.location.reload();
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error creating workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectWorkspace = (workspace) => {
    // First switch the workspace context
    switchWorkspace(workspace);
    
    // Force a page reload to refresh all data for the new workspace
    // Alternatively, we could use a more targeted approach with useContext and useReducer
    // to notify components to refresh their data
    window.location.href = '/games';
  };

  const roleColor = {
    'SUPER_ADMIN': 'red',
    'ADMIN': 'blue',
    'USER': 'green'
  };

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2}>
            <AppstoreOutlined /> Workspaces
          </Title>
          <Text>Select a workspace to continue or create a new one</Text>
        </div>

        <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {workspaces.length === 0 ? (
                <Empty 
                  description="You don't have any workspaces yet" 
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={workspaces}
                  renderItem={workspace => (
                    <List.Item
                      actions={[
                        <Button 
                          key="select" 
                          type="primary" 
                          icon={<SelectOutlined />}
                          onClick={() => selectWorkspace(workspace)}
                          disabled={currentWorkspace && currentWorkspace.id === workspace.id}
                        >
                          {currentWorkspace && currentWorkspace.id === workspace.id ? 'Current' : 'Select'}
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{ 
                            width: 40, 
                            height: 40, 
                            backgroundColor: '#1890ff', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px'
                          }}>
                            {workspace.name.charAt(0).toUpperCase()}
                          </div>
                        }
                        title={
                          <div>
                            {workspace.name} 
                            <Tag color={roleColor[workspace.role]} style={{ marginLeft: 10 }}>
                              {workspace.role}
                            </Tag>
                            {currentWorkspace && currentWorkspace.id === workspace.id && (
                              <Tag color="green" style={{ marginLeft: 5 }}>Active</Tag>
                            )}
                          </div>
                        }
                        description={workspace.description || 'No description'}
                      />
                    </List.Item>
                  )}
                />
              )}

              <Divider />

              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => setIsModalVisible(true)}
                >
                  Create New Workspace
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      <Modal
        title="Create New Workspace"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateWorkspace}
        >
          <Form.Item
            name="name"
            label="Workspace Name"
            rules={[
              {
                required: true,
                message: 'Please input workspace name!',
              },
            ]}
          >
            <Input prefix={<AppstoreOutlined />} placeholder="Workspace Name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea 
              placeholder="Description (optional)"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Create Workspace
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkspaceSelector; 