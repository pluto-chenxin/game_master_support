import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Row, Col, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    setError(null);
    const success = await login(values);
    if (success) {
      navigate('/');
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: 'calc(100vh - 64px - 48px)' }}>
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card
          bordered
          style={{
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Title level={2}>
              <LoginOutlined /> Login
            </Title>
            <p>Sign in to access Game Master Support</p>
          </div>

          {error && (
            <Alert
              message="Authentication Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          <Form
            form={form}
            name="login"
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  message: 'Please input your email!',
                },
                {
                  type: 'email',
                  message: 'Please enter a valid email address',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Please input your password!',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                icon={<LoginOutlined />}
              >
                Log in
              </Button>
            </Form.Item>

            <Divider>or</Divider>

            <div style={{ textAlign: 'center' }}>
              <p>
                Don't have an account?{' '}
                <Link to="/register">Register now</Link>
              </p>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Login; 