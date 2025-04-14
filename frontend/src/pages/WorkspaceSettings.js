import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, message, Spin } from 'antd';
import { useAuth } from '../context/AuthContext';
import WorkspaceMembers from '../components/WorkspaceMembers';
import axios from 'axios';

const { TabPane } = Tabs;

const WorkspaceSettings = () => {
  const { currentWorkspace } = useAuth();
  const [loading, setLoading] = useState(false);
  const [workspace, setWorkspace] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceDetails();
    }
  }, [currentWorkspace]);

  const fetchWorkspaceDetails = async () => {
    if (!currentWorkspace?.id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/workspaces/${currentWorkspace.id}`);
      setWorkspace(response.data);
      form.setFieldsValue({
        name: response.data.name,
        description: response.data.description
      });
    } catch (error) {
      console.error('Error fetching workspace details:', error);
      message.error('Failed to load workspace details');
    }
    setLoading(false);
  };

  const handleUpdateWorkspace = async (values) => {
    if (!currentWorkspace?.id) return;
    
    setLoading(true);
    try {
      await axios.put(`/api/workspaces/${currentWorkspace.id}`, values);
      message.success('Workspace updated successfully');
      fetchWorkspaceDetails();
    } catch (error) {
      console.error('Error updating workspace:', error);
      message.error('Failed to update workspace');
    }
    setLoading(false);
  };

  if (!currentWorkspace) {
    return (
      <Card title="Workspace Settings">
        <div style={{ textAlign: 'center', padding: 20 }}>
          No workspace selected. Please select a workspace first.
        </div>
      </Card>
    );
  }

  if (loading && !workspace) {
    return (
      <Card title="Workspace Settings">
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title={`${currentWorkspace.name} Settings`}>
      <Tabs defaultActiveKey="details">
        <TabPane tab="Workspace Details" key="details">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateWorkspace}
            initialValues={workspace || {}}
          >
            <Form.Item
              name="name"
              label="Workspace Name"
              rules={[{ required: true, message: 'Please enter workspace name' }]}
            >
              <Input placeholder="Enter workspace name" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="Enter workspace description" 
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Workspace
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="Members" key="members">
          <WorkspaceMembers workspaceId={currentWorkspace.id} />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default WorkspaceSettings; 