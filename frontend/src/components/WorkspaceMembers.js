import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Input, Select, Modal, Tag, message, Spin, Tooltip } from 'antd';
import { UserAddOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;

const WorkspaceMembers = ({ workspaceId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  // For debugging
  useEffect(() => {
    console.log("Current user role:", userRole);
    console.log("Is admin:", userRole === 'ADMIN' || userRole === 'SUPER_ADMIN');
  }, [userRole]);

  const fetchMembers = async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    try {
      console.log('Fetching workspace members for workspace ID:', workspaceId);
      const response = await axios.get(`/api/workspaces/${workspaceId}/users`);
      console.log('Workspace members data:', response.data);
      setMembers(response.data);
      
      // Find current user's role in this workspace
      const currentMember = response.data.find(m => m.id === currentUser?.id);
      console.log("Current member found:", currentMember);
      if (currentMember) {
        console.log("Setting user role to:", currentMember.workspaceRole);
        setUserRole(currentMember.workspaceRole);
      } else {
        console.log("Current user not found in members list");
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      message.error('Failed to load workspace members: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleInvite = async (values) => {
    setInviteLoading(true);
    try {
      await axios.post(`/api/workspaces/${workspaceId}/invite`, {
        email: values.email,
        role: values.role
      });
      
      form.resetFields();
      setInviteModalVisible(false);
      message.success('Invitation sent successfully');
      fetchMembers();
    } catch (error) {
      console.error('Error inviting user:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send invitation';
      message.error(errorMessage);
    }
    setInviteLoading(false);
  };

  const handleRemoveMember = async (userId) => {
    Modal.confirm({
      title: 'Remove Member',
      content: 'Are you sure you want to remove this member from the workspace?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await axios.delete(`/api/workspaces/${workspaceId}/users/${userId}`);
          message.success('Member removed successfully');
          fetchMembers();
        } catch (error) {
          console.error('Error removing member:', error);
          message.error(error.response?.data?.error || 'Failed to remove member');
        }
      }
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'red';
      case 'ADMIN':
        return 'volcano';
      case 'USER':
        return 'blue';
      default:
        return 'default';
    }
  };

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => text || 'Unnamed User'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Workspace Role',
      dataIndex: 'workspaceRole',
      key: 'workspaceRole',
      render: (role) => <Tag color={getRoleColor(role)}>{role}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        // Don't allow removing yourself or removing if not admin
        const canRemove = isAdmin && record.id !== currentUser?.id;
        
        return (
          <div>
            {canRemove && (
              <Tooltip title="Remove from workspace">
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleRemoveMember(record.id)}
                />
              </Tooltip>
            )}
          </div>
        );
      }
    }
  ];

  if (!workspaceId) {
    return <div>No workspace selected</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Workspace Members</h2>
        <Button 
          type="primary" 
          icon={<UserAddOutlined />} 
          onClick={() => setInviteModalVisible(true)}
        >
          Invite User
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table 
          dataSource={members} 
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      )}

      <Modal
        title="Invite User to Workspace"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleInvite}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter an email address' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            initialValue="USER"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select>
              <Option value="USER">Regular User</Option>
              <Option value="ADMIN">Admin</Option>
            </Select>
          </Form.Item>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => setInviteModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={inviteLoading}>
              Send Invitation
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkspaceMembers; 