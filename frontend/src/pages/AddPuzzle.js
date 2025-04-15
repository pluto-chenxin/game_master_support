import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Select, Slider, Typography, message, Card, Spin } from 'antd';
import MultipleImageUploader from '../components/MultipleImageUploader';
import axios from 'axios';
import config from '../config';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AddPuzzle = () => {
  const { id: gameId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setGameLoading(true);
        const response = await axios.get(`${config.API_URL}/api/games/${gameId}`);
        setGame(response.data);
        setGameLoading(false);
      } catch (error) {
        console.error('Error fetching game:', error);
        message.error('Failed to load game information');
        setGameLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Debug log for diagnosis
      console.log('Submitting form with values:', values);
      console.log('Direct uploadedImages state:', uploadedImages);
      
      // Step 1: Create the puzzle first
      const puzzleResponse = await axios.post(`${config.API_URL}/api/puzzles`, {
        title: values.title,
        description: values.description,
        status: values.status,
        difficulty: values.difficulty,
        gameId: Number(gameId)
      });
      
      const newPuzzleId = puzzleResponse.data.id;
      console.log('Created new puzzle with ID:', newPuzzleId);
      
      // Step 2: Check if we have images to associate
      let imageAssociationSuccess = false;
      
      if (uploadedImages && uploadedImages.length > 0) {
        console.log('Found images to associate:', uploadedImages.length);
        try {
          // Process images to ensure they have the correct format - filter out any invalid images
          const processedImages = uploadedImages
            .filter(img => img && img.imageUrl) // Only include images with valid imageUrl
            .map(img => ({
              imageUrl: img.imageUrl,
              caption: img.caption || 'Puzzle image'
            }));
          
          console.log('Processed images for API call:', JSON.stringify(processedImages));
          
          if (processedImages.length > 0) {
            // Make the API call to associate images and wait for it to complete
            const imageResponse = await axios.post(`${config.API_URL}/api/puzzle-images`, {
              puzzleId: newPuzzleId,
              images: processedImages
            });
            
            console.log('Image association API response:', imageResponse.data);
            imageAssociationSuccess = true;
            message.success('Puzzle and images added successfully!');
          } else {
            console.log('No valid images found to associate');
            message.success('Puzzle added successfully!');
          }
        } catch (imageError) {
          console.error('Error associating images with puzzle:', imageError);
          message.warning('Puzzle created but there was an issue with the images.');
        }
      } else {
        console.log('No images to associate with the puzzle');
        message.success('Puzzle added successfully!');
      }
      
      // Add a longer delay before navigation to ensure database operations complete
      const delay = imageAssociationSuccess ? 3000 : 1000;
      
      // Wait for the specified delay before navigating
      setTimeout(() => {
        navigate(`/puzzles/${newPuzzleId}`);
      }, delay);
      
    } catch (error) {
      console.error('Error adding puzzle:', error);
      message.error('Failed to add puzzle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (gameLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading game information...</p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <Card>
        <Title level={2}>Add New Puzzle</Title>
        <Title level={4} style={{ marginTop: 0 }}>For: {game?.name}</Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          initialValues={{
            status: 'active',
            difficulty: 1
          }}
        >
          <Form.Item
            name="title"
            label="Puzzle Title"
            rules={[{ required: true, message: 'Please enter the puzzle title' }]}
          >
            <Input placeholder="Enter puzzle title or name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} placeholder="Enter puzzle description" />
          </Form.Item>
          
          <Form.Item
            name="images"
            label="Puzzle Images"
            valuePropName="value"
          >
            <div className="image-uploader-container">
              <div style={{ marginBottom: 8 }}>
                <strong>Uploaded Images: {uploadedImages.length > 0 ? uploadedImages.length : 'None'}</strong>
              </div>
              <MultipleImageUploader 
                value={uploadedImages}
                onChange={(images) => {
                  // Only update state if we actually have images
                  if (images && Array.isArray(images) && images.length > 0) {
                    console.log('Received images from uploader:', images);
                    
                    // Verify each image has the required properties
                    const validImages = images.filter(img => img && img.imageUrl);
                    console.log('Valid images with imageUrl:', validImages);
                    
                    if (validImages.length > 0) {
                      setUploadedImages(validImages);
                      console.log('Updated uploadedImages state with valid images');
                    }
                  }
                }}
              />
            </div>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
          >
            <Select>
              <Option value="active">Active - Ready for use</Option>
              <Option value="needs_attention">Needs Attention</Option>
              <Option value="in_maintenance">In Maintenance</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="difficulty"
            label="Difficulty (1-5)"
          >
            <Slider
              min={1}
              max={5}
              marks={{
                1: 'Easy',
                2: 'Moderate',
                3: 'Medium',
                4: 'Hard',
                5: 'Very Hard'
              }}
            />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Add Puzzle
            </Button>
          </Form.Item>
          
          <Form.Item>
            <Button onClick={() => navigate(`/games/${gameId}`)} block>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddPuzzle; 