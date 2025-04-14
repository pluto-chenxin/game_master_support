import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, DatePicker, Typography, message, Card, Select, Spin, Space, Divider } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { EditOutlined, ArrowLeftOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import SingleImageUploader from '../components/SingleImageUploader';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const EditGame = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(true);
  const [game, setGame] = useState(null);
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

  // Fetch game data on component mount
  useEffect(() => {
    const fetchGame = async () => {
      try {
        setGameLoading(true);
        const response = await axios.get(`http://localhost:5000/api/games/${id}`);
        setGame(response.data);
        
        // Format dates for form fields
        const formData = {
          ...response.data,
          releaseDate: response.data.releaseDate ? moment(response.data.releaseDate) : null,
          purchaseDate: response.data.purchaseDate ? moment(response.data.purchaseDate) : null
        };
        
        // Set form values
        form.setFieldsValue(formData);
        setGameLoading(false);
      } catch (error) {
        console.error('Error fetching game:', error);
        message.error('Failed to load game information');
        setGameLoading(false);
        navigate('/games');
      }
    };

    fetchGame();
  }, [id, form, navigate]);

  const onFinish = async (values) => {
    setLoading(true);

    try {
      // Format dates for API
      const formattedValues = {
        ...values,
        releaseDate: values.releaseDate ? values.releaseDate.toISOString() : null,
        purchaseDate: values.purchaseDate ? values.purchaseDate.toISOString() : null
      };

      // Update the game
      await axios.put(`http://localhost:5000/api/games/${id}`, formattedValues);
      
      message.success('Game updated successfully!');
      navigate(`/games/${id}`);
    } catch (error) {
      console.error('Error updating game:', error);
      message.error('Failed to update game');
    } finally {
      setLoading(false);
    }
  };

  // Handle cover image upload
  const handleImageUpload = (path) => {
    form.setFieldsValue({ imageUrl: path });
    setImageUrl(path);
  };

  if (gameLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading game information..." />
      </div>
    );
  }

  return (
    <div>
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(`/games/${id}`)}
        style={{ marginBottom: 16, padding: 0 }}
      >
        Back to Game Details
      </Button>
      
      <Card title={
        <span>
          <EditOutlined /> Edit Game: {game?.name}
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
          
          <Form.Item
            name="purchaseDate"
            label="Purchase Date"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Game
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditGame;
