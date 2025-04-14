import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Tabs, Typography, Button, Descriptions, Tag, List, Timeline, 
  Popconfirm, message, Form, Input, DatePicker, Select, Switch, Modal, Spin, Alert,
  Space, Empty, Carousel, Row, Col, Tooltip
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, CheckCircleOutlined, 
  ClockCircleOutlined, ToolOutlined, BulbOutlined,
  ArrowLeftOutlined, PictureOutlined
} from '@ant-design/icons';
import ImageUploader from '../components/ImageUploader';
import MultipleImageUploader from '../components/MultipleImageUploader';
import axios from 'axios';
import moment from 'moment';
import ReportList from '../components/ReportList';
import ReportForm from '../components/ReportForm';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const statusIcons = {
  'active': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  'needs_attention': <ClockCircleOutlined style={{ color: '#faad14' }} />,
  'in_maintenance': <ToolOutlined style={{ color: '#f5222d' }} />
};

const statusColors = {
  'active': 'success',
  'needs_attention': 'warning',
  'in_maintenance': 'error'
};

const statusDescriptions = {
  'active': 'Puzzle is operational and ready for use',
  'needs_attention': 'Puzzle needs to be checked or prepared',
  'in_maintenance': 'Puzzle is undergoing repairs or updates'
};

const PuzzleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [puzzle, setPuzzle] = useState(null);
  const [puzzleImages, setPuzzleImages] = useState([]);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);
  
  const [hintModalVisible, setHintModalVisible] = useState(false);
  const [hintForm] = Form.useForm();
  const [hintLoading, setHintLoading] = useState(false);
  
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [maintenanceForm] = Form.useForm();
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [refreshTimestamp, setRefreshTimestamp] = useState(null);

  // Separate function to fetch puzzle images that can be called from multiple places
  const fetchPuzzleImages = React.useCallback(async () => {
    try {
      console.log(`Fetching images for puzzle ${id} at ${new Date().toISOString()}`);
      const imagesResponse = await axios.get(`http://localhost:5000/api/puzzle-images/puzzle/${id}?_t=${Date.now()}`);
      const images = imagesResponse.data;
      
      console.log('Fetched puzzle images:', images);
      
      // Only update state if there are actually images or if it's different from current state
      // Use JSON.stringify comparison to avoid unnecessary state updates
      const currentImagesJson = JSON.stringify(puzzleImages);
      const newImagesJson = JSON.stringify(images);
      
      if (currentImagesJson !== newImagesJson) {
        setPuzzleImages(images);
      }
      
      return images;
    } catch (error) {
      console.error('Error fetching puzzle images:', error);
      return [];
    }
  }, [id, puzzleImages]);  // Include dependencies explicitly

  useEffect(() => {
    let isMounted = true;
    let retryTimeout = null;
    
    const fetchPuzzleDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching puzzle details for ID:', id);
        
        // Fetch puzzle details
        const puzzleResponse = await axios.get(`http://localhost:5000/api/puzzles/${id}`);
        const puzzleData = puzzleResponse.data;
        
        if (!isMounted) return;
        
        setPuzzle(puzzleData);
        setGame(puzzleData.game);
        
        // Fetch puzzle images
        const images = await fetchPuzzleImages();
        
        if (!isMounted) return;
        setLoading(false);
        
        // If no images found and this is a newly created puzzle, do a limited number of retries
        if (images.length === 0) {
          console.log('No images found initially, will retry up to 3 times');
          let retryCount = 0;
          const MAX_RETRIES = 3;
          
          const attemptRetry = async () => {
            if (!isMounted) return;
            
            retryCount++;
            console.log(`Retry attempt ${retryCount}/${MAX_RETRIES}`);
            
            const retryImages = await fetchPuzzleImages();
            
            if (!isMounted) return;
            
            if (retryImages.length > 0) {
              console.log(`Found ${retryImages.length} images on retry ${retryCount}`);
              // No need for further retries
            } else if (retryCount < MAX_RETRIES) {
              console.log(`No images found on retry ${retryCount}, will retry again...`);
              // Schedule next retry
              retryTimeout = setTimeout(attemptRetry, 3000);
            } else {
              console.log(`Reached max retries (${MAX_RETRIES}). No images found.`);
            }
          };
          
          // Start first retry after delay
          retryTimeout = setTimeout(attemptRetry, 3000);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching puzzle details:', error);
        setError('Failed to load puzzle details. Please try again later.');
        setLoading(false);
      }
    };

    fetchPuzzleDetails();
    
    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [id, fetchPuzzleImages]); // Include fetchPuzzleImages in the dependency array

  const handlePuzzleEdit = () => {
    editForm.setFieldsValue({
      title: puzzle.title,
      description: puzzle.description,
      status: puzzle.status,
      difficulty: puzzle.difficulty,
      imageUrl: puzzle.imageUrl
    });
    setEditModalVisible(true);
  };

  const handlePuzzleUpdate = async (values) => {
    try {
      setEditLoading(true);
      await axios.put(`http://localhost:5000/api/puzzles/${id}`, values);
      
      // Update local state
      setPuzzle({
        ...puzzle,
        ...values
      });
      
      message.success('Puzzle updated successfully');
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating puzzle:', error);
      message.error('Failed to update puzzle');
    } finally {
      setEditLoading(false);
    }
  };

  const handlePuzzleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/puzzles/${id}`);
      message.success('Puzzle deleted successfully');
      navigate(`/games/${puzzle.gameId}`);
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      message.error('Failed to delete puzzle');
    }
  };

  const handleAddHint = () => {
    hintForm.resetFields();
    setHintModalVisible(true);
  };

  const handleHintSubmit = async (values) => {
    try {
      setHintLoading(true);
      const hintData = {
        ...values,
        puzzleId: parseInt(id)
      };
      
      const response = await axios.post(`http://localhost:5000/api/hints`, hintData);
      
      // Update local state
      setPuzzle({
        ...puzzle,
        hints: [...puzzle.hints, response.data]
      });
      
      message.success('Hint added successfully');
      setHintModalVisible(false);
    } catch (error) {
      console.error('Error adding hint:', error);
      message.error('Failed to add hint');
    } finally {
      setHintLoading(false);
    }
  };

  const handleDeleteHint = async (hintId) => {
    try {
      await axios.delete(`http://localhost:5000/api/hints/${hintId}`);
      
      // Update local state
      setPuzzle({
        ...puzzle,
        hints: puzzle.hints.filter(hint => hint.id !== hintId)
      });
      
      message.success('Hint deleted successfully');
    } catch (error) {
      console.error('Error deleting hint:', error);
      message.error('Failed to delete hint');
    }
  };

  const handleAddMaintenance = () => {
    maintenanceForm.resetFields();
    maintenanceForm.setFieldsValue({
      fixDate: moment(),
      status: 'planned'
    });
    setMaintenanceModalVisible(true);
  };

  const handleMaintenanceSubmit = async (values) => {
    try {
      setMaintenanceLoading(true);
      const maintenanceData = {
        ...values,
        fixDate: values.fixDate.toISOString(),
        puzzleId: parseInt(id)
      };
      
      const response = await axios.post(`http://localhost:5000/api/maintenance`, maintenanceData);
      
      // Update local state
      setPuzzle({
        ...puzzle,
        maintenance: [...puzzle.maintenance, response.data]
      });
      
      message.success('Maintenance record added successfully');
      setMaintenanceModalVisible(false);
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      message.error('Failed to add maintenance record');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleDeleteMaintenance = async (maintenanceId) => {
    try {
      await axios.delete(`http://localhost:5000/api/maintenance/${maintenanceId}`);
      
      // Update local state
      setPuzzle({
        ...puzzle,
        maintenance: puzzle.maintenance.filter(record => record.id !== maintenanceId)
      });
      
      message.success('Maintenance record deleted successfully');
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      message.error('Failed to delete maintenance record');
    }
  };

  const toggleHintUsed = async (hint) => {
    try {
      const updatedHint = { ...hint, isUsed: !hint.isUsed };
      await axios.put(`http://localhost:5000/api/hints/${hint.id}`, updatedHint);
      
      // Update local state
      setPuzzle({
        ...puzzle,
        hints: puzzle.hints.map(h => h.id === hint.id ? { ...h, isUsed: !h.isUsed } : h)
      });
      
      message.success(`Hint marked as ${updatedHint.isUsed ? 'used' : 'unused'}`);
    } catch (error) {
      console.error('Error updating hint:', error);
      message.error('Failed to update hint');
    }
  };

  const handleAddImage = () => {
    Modal.confirm({
      title: 'Add Images',
      content: (
        <div style={{ marginTop: 16 }}>
          <MultipleImageUploader 
            puzzleId={Number(id)} 
            onChange={(images) => {
              // Log the number of images uploaded without immediately fetching
              if (images && images.length > 0) {
                console.log('Images uploaded in modal:', images.length);
                // Don't call fetchPuzzleImages here to avoid multiple API calls
              }
            }}
          />
        </div>
      ),
      width: 600,
      okText: 'Done',
      onOk: () => {
        // Only fetch puzzle images once when modal is closed
        fetchPuzzleImages()
          .then((images) => {
            message.success(`Images updated successfully (${images.length} images)`);
          })
          .catch(error => {
            console.error('Error fetching images:', error);
            message.error('Failed to update images');
          });
      }
    });
  };

  const handleDeleteImage = (imageId) => {
    Modal.confirm({
      title: 'Delete Image',
      content: 'Are you sure you want to delete this image? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          console.log('Deleting image with ID:', imageId);
          await axios.delete(`http://localhost:5000/api/puzzle-images/${imageId}`);
          
          // Update the images list with immediate UI update
          setPuzzleImages(prev => prev.filter(img => img.id !== imageId));
          message.success('Image deleted successfully');
          
          // After deletion, fetch the updated list from server to ensure consistency
          fetchPuzzleImages();
        } catch (error) {
          console.error('Error deleting image:', error);
          message.error('Failed to delete image');
        }
      }
    });
  };

  const handleSetPrimaryImage = (imageId) => {
    console.log('Setting primary image ID:', imageId);
    axios.put(`http://localhost:5000/api/puzzle-images/${imageId}`, { isPrimary: true })
      .then(() => {
        // Immediate UI update
        setPuzzleImages(prev => prev.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        })));
        
        message.success('Primary image updated');
        
        // Refresh from server to ensure consistency
        fetchPuzzleImages();
      })
      .catch(error => {
        console.error('Error setting primary image:', error);
        message.error('Failed to update primary image');
      });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading puzzle details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (!puzzle) {
    return <Alert message="Puzzle not found" type="error" />;
  }

  return (
    <div>
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(`/games/${game.id}`)}
        style={{ marginBottom: 16, padding: 0 }}
      >
        Back to {game.name}
      </Button>
      
      <Card
        title={
          <div>
            <Title level={2}>{puzzle.title}</Title>
            <Link to={`/games/${game.id}`}>
              <Text strong>{game.name}</Text>
            </Link>
            <Tag
              color={statusColors[puzzle.status]}
              style={{ marginLeft: 16 }}
            >
              {statusIcons[puzzle.status]} {puzzle.status}
            </Tag>
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={handlePuzzleEdit}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete this puzzle?"
              description="All hints and maintenance records will be deleted. This action cannot be undone."
              onConfirm={handlePuzzleDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[puzzle.status]}>
              {statusIcons[puzzle.status]} {puzzle.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Difficulty">
            {[...Array(puzzle.difficulty || 1)].map((_, i) => (
              <span key={i} role="img" aria-label="star">⭐</span>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(puzzle.createdAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Updated">
            {new Date(puzzle.updatedAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Hints" span={2}>
            {puzzle.hints.length} ({puzzle.hints.filter(h => h.isUsed).length} used)
          </Descriptions.Item>
        </Descriptions>

        {puzzleImages.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Carousel autoplay={puzzleImages.length > 1} dots={puzzleImages.length > 1}>
                  {puzzleImages.map((image, index) => (
                    <div key={index}>
                      <div style={{ textAlign: 'center', position: 'relative', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img 
                          src={`http://localhost:5000${image.imageUrl}`} 
                          alt={`Puzzle image ${index + 1}`}
                          style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                          onError={(e) => {
                            // Handle image load errors
                            console.log('Image failed to load:', image.imageUrl);
                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                          }}
                        />
                        {image.caption && (
                          <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', padding: '8px', color: 'white' }}>
                            <Typography.Text style={{ color: 'white' }}>{image.caption}</Typography.Text>
                          </div>
                        )}
                        {image.isPrimary && (
                          <Tag color="blue" style={{ position: 'absolute', top: 8, right: 8 }}>
                            Primary
                          </Tag>
                        )}
                      </div>
                    </div>
                  ))}
                </Carousel>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {puzzleImages.map((image, index) => (
                <Col key={index} xs={12} sm={8} md={6} lg={4}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ height: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        <img 
                          alt={`Thumbnail ${index + 1}`} 
                          src={`http://localhost:5000${image.imageUrl}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100x100?text=Image+Not+Found';
                          }}
                        />
                      </div>
                    }
                    size="small"
                    actions={[
                      <Button 
                        type="link" 
                        icon={<CheckCircleOutlined />} 
                        disabled={image.isPrimary}
                        onClick={() => handleSetPrimaryImage(image.id)}
                      />,
                      <Button 
                        type="link" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteImage(image.id)}
                      />
                    ]}
                  >
                    {image.isPrimary && <Tag color="blue">Primary</Tag>}
                    {image.caption && (
                      <Typography.Text ellipsis style={{ fontSize: '12px' }}>
                        {image.caption}
                      </Typography.Text>
                    )}
                  </Card>
                </Col>
              ))}
              <Col xs={12} sm={8} md={6} lg={4}>
                <Card
                  hoverable
                  style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  onClick={handleAddImage}
                >
                  <PlusOutlined style={{ fontSize: 24 }} />
                  <div>Add Images</div>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {puzzleImages.length === 0 && (
          <Empty
            image={<PictureOutlined style={{ fontSize: 64 }} />}
            description="No images added yet"
            style={{ margin: '24px 0' }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddImage}>
              Add Images
            </Button>
          </Empty>
        )}

        {puzzle.description && (
          <Card style={{ marginTop: 16 }}>
            <Typography.Paragraph>{puzzle.description}</Typography.Paragraph>
          </Card>
        )}
      </Card>

      <Tabs defaultActiveKey="details">
        <TabPane tab="Details" key="details">
          <Card>
            <Descriptions title="Puzzle Information" bordered column={2}>
              <Descriptions.Item label="Title">{puzzle.title}</Descriptions.Item>
              <Descriptions.Item label="Status">
                {statusIcons[puzzle.status]} {puzzle.status.replace('_', ' ')}
              </Descriptions.Item>
              <Descriptions.Item label="Difficulty" span={2}>
                {[...Array(puzzle.difficulty || 1)].map((_, i) => (
                  <span key={i} role="img" aria-label="star">⭐</span>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {puzzle.description || "No description provided"}
              </Descriptions.Item>
              <Descriptions.Item label="Game">
                <Link to={`/games/${puzzle.gameId}`}>{game?.name}</Link>
              </Descriptions.Item>
              <Descriptions.Item label="Creation Date">
                {new Date(puzzle.createdAt).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </TabPane>

        <TabPane tab="Images" key="images">
          {/* ... existing code ... */}
        </TabPane>

        <TabPane tab="Hints" key="hints">
          <Card
            title="Hints"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddHint}>
                Add Hint
              </Button>
            }
          >
            {puzzle.hints.length === 0 ? (
              <Empty description="No hints added yet" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={puzzle.hints}
                renderItem={item => (
                  <List.Item
                    className="hint-item"
                    actions={[
                      <Switch
                        checkedChildren="Used"
                        unCheckedChildren="Unused"
                        checked={item.isUsed}
                        onChange={() => toggleHintUsed(item)}
                      />,
                      <Popconfirm
                        title="Delete this hint?"
                        onConfirm={() => handleDeleteHint(item.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div>
                          {item.isPremium && <Tag color="gold">Premium</Tag>}
                          <Text delete={item.isUsed}>{item.content}</Text>
                        </div>
                      }
                      description={`Added: ${new Date(item.createdAt).toLocaleDateString()}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="Maintenance" key="maintenance">
          <Card
            title="Maintenance Records"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMaintenance}>
                Add Record
              </Button>
            }
          >
            {puzzle.maintenance.length === 0 ? (
              <Empty description="No maintenance records added yet" />
            ) : (
              <Timeline mode="left">
                {puzzle.maintenance.map(record => (
                  <Timeline.Item
                    key={record.id}
                    label={new Date(record.fixDate).toLocaleDateString()}
                    color={
                      record.status === 'completed' ? 'green' :
                      record.status === 'in-progress' ? 'blue' : 'orange'
                    }
                  >
                    <div className="maintenance-item">
                      <div>
                        <Tag color={
                          record.status === 'completed' ? 'success' :
                          record.status === 'in-progress' ? 'processing' : 'warning'
                        }>
                          {record.status}
                        </Tag>
                        <Text strong>{record.description}</Text>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Popconfirm
                          title="Delete this maintenance record?"
                          onConfirm={() => handleDeleteMaintenance(record.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                            Delete
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </Card>
        </TabPane>

        <TabPane tab="Reports" key="reports">
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Issue Reports</span>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => setReportModalVisible(true)}
                >
                  New Report
                </Button>
              </div>
            }
          >
            <ReportList puzzleId={id} showGameInfo={true} refreshTimestamp={refreshTimestamp} />
          </Card>
        </TabPane>
      </Tabs>

      {/* Edit Puzzle Modal */}
      <Modal
        title="Edit Puzzle"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handlePuzzleUpdate}
        >
          <Form.Item
            name="title"
            label="Puzzle Title"
            rules={[{ required: true, message: 'Please enter the puzzle title' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} />
          </Form.Item>
          
          <Form.Item
            name="imageUrl"
            label="Puzzle Image"
            valuePropName="value"
            style={{ display: 'none' }}
          >
            <ImageUploader />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
          >
            <Select>
              <Option value="active">
                <Tooltip title={statusDescriptions.active}>
                  <span>{statusIcons.active} Active</span>
                </Tooltip>
              </Option>
              <Option value="needs_attention">
                <Tooltip title={statusDescriptions.needs_attention}>
                  <span>{statusIcons.needs_attention} Needs Attention</span>
                </Tooltip>
              </Option>
              <Option value="in_maintenance">
                <Tooltip title={statusDescriptions.in_maintenance}>
                  <span>{statusIcons.in_maintenance} In Maintenance</span>
                </Tooltip>
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="difficulty"
            label="Difficulty"
            rules={[{ required: true, message: 'Please select difficulty' }]}
          >
            <Select>
              <Option value={1}>1 - Easy</Option>
              <Option value={2}>2 - Moderate</Option>
              <Option value={3}>3 - Medium</Option>
              <Option value={4}>4 - Hard</Option>
              <Option value={5}>5 - Very Hard</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={editLoading} block>
              Update Puzzle
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Hint Modal */}
      <Modal
        title="Add Hint"
        open={hintModalVisible}
        onCancel={() => setHintModalVisible(false)}
        footer={null}
      >
        <Form
          form={hintForm}
          layout="vertical"
          onFinish={handleHintSubmit}
        >
          <Form.Item
            name="content"
            label="Hint Content"
            rules={[{ required: true, message: 'Please enter hint content' }]}
          >
            <TextArea rows={4} placeholder="Enter hint content" />
          </Form.Item>
          
          <Form.Item
            name="isPremium"
            label="Premium Hint"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="isUsed"
            label="Already Used"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={hintLoading} block>
              Add Hint
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Maintenance Modal */}
      <Modal
        title="Add Maintenance Record"
        open={maintenanceModalVisible}
        onCancel={() => setMaintenanceModalVisible(false)}
        footer={null}
      >
        <Form
          form={maintenanceForm}
          layout="vertical"
          onFinish={handleMaintenanceSubmit}
        >
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <TextArea rows={4} placeholder="Describe the maintenance task" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select>
              <Option value="planned">Planned</Option>
              <Option value="in-progress">In Progress</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="fixDate"
            label="Fix Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={maintenanceLoading} block>
              Add Maintenance Record
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Report Modal */}
      <Modal
        title={`Add Issue Report for ${puzzle?.title}`}
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={700}
      >
        <ReportForm 
          gameId={puzzle?.gameId}
          puzzleId={id}
          onFinish={() => {
            setReportModalVisible(false);
            message.success('Report submitted successfully');
            setRefreshTimestamp(Date.now());
          }}
        />
      </Modal>
    </div>
  );
};

export default PuzzleDetail; 