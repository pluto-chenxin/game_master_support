import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert, message, Spin } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

const InvitationAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const verifyInvitation = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/workspaces/invitations/${token}`);
        setInvitation(response.data);
        setError(null);
      } catch (err) {
        console.error('Error verifying invitation:', err);
        setError(err.response?.data?.error || 'Invalid or expired invitation');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyInvitation();
    }
  }, [token]);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      await axios.post(`/api/workspaces/invitations/${token}/accept`, values);
      
      message.success('Account created successfully! Redirecting to login...');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      message.error(err.response?.data?.error || 'Failed to create account');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Verifying invitation..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 500, margin: '100px auto', padding: 20 }}>
        <Card>
          <Alert
            message="Invitation Error"
            description={error}
            type="error"
            showIcon
          />
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '100px auto', padding: 20 }}>
      <Card>
        <Title level={3}>Join Workspace</Title>
        
        <div style={{ marginBottom: 20 }}>
          <Text>
            You've been invited to join <strong>{invitation?.workspaceName}</strong> with the role of <strong>{invitation?.role}</strong>.
          </Text>
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <Text type="secondary">
            To accept this invitation, please create your account below.
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ email: invitation?.email }}
        >
          <Form.Item
            name="email"
            label="Email"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter a password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password placeholder="Enter a secure password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm your password" />
          </Form.Item>

          <div style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Create Account & Join
            </Button>
          </div>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            Already have an account? <a href="/login">Log in</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default InvitationAccept; 