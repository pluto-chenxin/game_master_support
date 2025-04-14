import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Row, Col, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    const success = await register({
      name: values.name,
      email: values.email,
      password: values.password
    });

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
              <UserAddOutlined /> Register
            </Title>
            <p>Create an account to access Game Master Support</p>
          </div>

          {error && (
            <Alert
              message="Registration Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          <Form
            form={form}
            name="register"
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              name="name"
              rules={[
                {
                  required: true,
                  message: 'Please input your name!',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Full Name"
                size="large"
              />
            </Form.Item>

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
                prefix={<MailOutlined />}
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
                {
                  min: 6,
                  message: 'Password must be at least 6 characters',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[
                {
                  required: true,
                  message: 'Please confirm your password!',
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm Password"
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
                icon={<UserAddOutlined />}
              >
                Register
              </Button>
            </Form.Item>

            <Divider>or</Divider>

            <div style={{ textAlign: 'center' }}>
              <p>
                Already have an account?{' '}
                <Link to="/login">Log in</Link>
              </p>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Register;
