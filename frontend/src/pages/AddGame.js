import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, Typography, message, Card, Select, Space } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { PlusOutlined } from '@ant-design/icons';
import SingleImageUploader from '../components/SingleImageUploader';
import config from './config';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AddGame = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const navigate = useNavigate();
  const { currentWorkspace } = useAuth();

  // Watch for form value changes to update the image uploader
  useEffect(() => {
    const imageUrl = form.getFieldValue('imageUrl');
    if (imageUrl) {
      setImageUrl(imageUrl);
    }
  }, [form]);

  const onFinish = async (values) => {
    // Validation
    if (!values.name || !values.genre) {
      message.error('Please fill in all required fields');
      return;
    }
    
    if (!currentWorkspace) {
      message.error('Please select a workspace first');
      navigate('/workspaces');
      return;
    }

    setLoading(true);

    try {
      // Convert dates to ISO format if they exist
      const formattedValues = {
        ...values,
        releaseDate: values.releaseDate ? values.releaseDate.toISOString() : null,
        purchaseDate: values.purchaseDate ? values.purchaseDate.toISOString() : null,
        workspaceId: currentWorkspace.id
      };

      // Submit the data
      const response = await axios.post(`${config.API_URL}/api/games', formattedValues);
      
      message.success('Game added successfully!');
      navigate(`/games/${response.data.id}`);
    } catch (error) {
      console.error('Error adding game:', error);
      message.error('Failed to add game');
    } finally {
      setLoading(false);
    }
  };

  // Handle cover image upload
  const handleImageUpload = (path) => {
    form.setFieldsValue({ imageUrl: path });
    setImageUrl(path);
  };

  return (
    <Card title={
      <span>
        <PlusOutlined /> Add New Game
        {currentWorkspace && (
          <span style={{ fontSize: '14px', marginLeft: '10px', fontWeight: 'normal' }}>
            in {currentWorkspace.name}
          </span>
        )}
      </span>
    }>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="Game Name"
          rules={[{ required: true, message: 'Please enter the game name' }]}
        >
          <Input placeholder="Enter game name" />
        </Form.Item>
        
        <Form.Item
          name="genre"
          label="Genre"
          rules={[{ required: true, message: 'Please select a genre' }]}
        >
          <Select placeholder="Select escape room genre">
            <Option value="Horror">Horror</Option>
            <Option value="Mystery">Mystery</Option>
            <Option value="Sci-Fi">Sci-Fi</Option>
            <Option value="Fantasy">Fantasy</Option>
            <Option value="Adventure">Adventure</Option>
            <Option value="Historical">Historical</Option>
            <Option value="Detective">Detective</Option>
            <Option value="Puzzle">Puzzle</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea rows={4} placeholder="Enter game description" />
        </Form.Item>
        
        <Form.Item
          name="imageUrl"
          label="Cover Image URL"
          help="Enter a URL or upload an image below"
        >
          <Input placeholder="Enter URL for game cover image" />
        </Form.Item>
        
        <div style={{ marginBottom: 24 }}>
          <Space direction="vertical" align="center" style={{ width: '100%' }}>
            <SingleImageUploader 
              value={imageUrl}
              onChange={handleImageUpload}
            />
            <span style={{ color: '#888' }}>
              Upload image or enter URL in the field above
            </span>
          </Space>
        </div>
        
        <Form.Item
          name="releaseDate"
          label="Release Date"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Add Game
          </Button>
        </Form.Item>
        
        <Form.Item>
          <Button onClick={() => navigate('/games')} block>
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddGame; 