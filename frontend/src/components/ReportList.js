import React, { useState, useEffect } from 'react';
import { 
  List, Card, Tag, Typography, Space, Button, 
  Modal, Form, Select, Input, Badge, Tooltip, 
  Popconfirm, Empty, Spin, Alert, Upload, message, Carousel,
  Pagination, Row, Col, InputNumber, Dropdown, Menu, Divider
} from 'antd';
import { 
  CheckCircleOutlined, ClockCircleOutlined, 
  SyncOutlined, DeleteOutlined, EditOutlined,
  UploadOutlined, PictureOutlined,
  LeftOutlined, RightOutlined,
  SearchOutlined, SortAscendingOutlined, SortDescendingOutlined,
  DownOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useLocation, useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import config from '../config';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Search } = Input;

const ReportItem = ({ report, onEdit, onDelete, showGameInfo, showPuzzleInfo }) => {
  const [reportData, setReportData] = useState(report);
  
  // Fetch fresh data directly from the API for this report
  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/api/reports/${report.id}?_=${Date.now()}`);
        setReportData(response.data);
      } catch (err) {
        console.error(`Error fetching report ${report.id} details:`, err);
        setReportData(report);
      }
    };
    
    fetchReportDetails();
  }, [report.id]);
  
  const getPriorityTag = (priority) => {
    switch (priority) {
      case 'high':
        return <Tag color="red">High Priority</Tag>;
      case 'medium':
        return <Tag color="orange">Medium Priority</Tag>;
      case 'low':
        return <Tag color="blue">Low Priority</Tag>;
      default:
        return <Tag color="red">High Priority</Tag>;
    }
  };
  
  const getStatusTag = (status) => {
    switch (status) {
      case 'open':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Open</Tag>;
      case 'in-progress':
        return <Tag icon={<SyncOutlined spin />} color="processing">In Progress</Tag>;
      case 'resolved':
        return <Tag icon={<CheckCircleOutlined />} color="success">Resolved</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };
  
  return (
    <Card 
      title={
        <div>
          {reportData.title}
          <div style={{ float: 'right', marginRight: '40px' }}>
            {getPriorityTag(reportData.priority)}
          </div>
        </div>
      }
      extra={getStatusTag(reportData.status)}
      cover={reportData.images && reportData.images.length > 0 ? (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f5f5f5', 
          textAlign: 'center'
        }}>
          <div className="custom-carousel-container" style={{ position: 'relative' }}>
            <Carousel 
              autoplay={false}
              dots={reportData.images.length > 1}
              style={{ maxWidth: '100%' }}
            >
              {reportData.images.map((image, index) => (
                <div key={index} style={{ 
                  height: '100px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: '#f0f0f0'
                }}>
                  <div 
                    style={{ 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <img
                      src={`${config.API_URL}${encodeURI(image.imageUrl)}`}
                      alt={`${reportData.title} - Image ${index + 1}`}
                      style={{ 
                        maxWidth: '25%', 
                        maxHeight: '25%', 
                        objectFit: 'contain',
                        display: 'block',
                        margin: 'auto'
                      }}
                    />
                  </div>
                </div>
              ))}
            </Carousel>
            
            {reportData.images.length > 1 && (
              <>
                <Button 
                  icon={<LeftOutlined />} 
                  className="custom-carousel-prev-button"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 10,
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderColor: '#fff',
                    color: '#fff',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}
                />
                <Button 
                  icon={<RightOutlined />} 
                  className="custom-carousel-next-button"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 10,
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderColor: '#fff',
                    color: '#fff',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}
                />
              </>
            )}
          </div>
          {reportData.images.length > 1 && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {reportData.images.length} images - click to enlarge
            </Text>
          )}
        </div>
      ) : null}
      actions={[
        <Tooltip title="Edit Status">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => onEdit(reportData)}
          />
        </Tooltip>,
        <Popconfirm
          title="Delete this report?"
          description="This action cannot be undone."
          onConfirm={() => onDelete(reportData.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ]}
    >
      <Paragraph>{reportData.description}</Paragraph>
      
      <div style={{ marginTop: 16 }}>
        <Space direction="vertical" size={0}>
          {showGameInfo && reportData.game && (
            <Text type="secondary">Game: {reportData.game.name}</Text>
          )}
          
          {showPuzzleInfo && reportData.puzzle && (
            <Text type="secondary">Puzzle: {reportData.puzzle.title}</Text>
          )}
          
          <Text type="secondary">
            Reported: {moment(reportData.reportDate).format('MMM DD, YYYY HH:mm')}
          </Text>
          
          {reportData.resolvedAt && (
            <Text type="secondary">
              Resolved: {moment(reportData.resolvedAt).format('MMM DD, YYYY HH:mm')}
            </Text>
          )}
        </Space>
      </div>
      
      {reportData.resolution && (
        <div style={{ marginTop: 8 }}>
          <Text strong>Resolution:</Text>
          <Paragraph>{reportData.resolution}</Paragraph>
        </div>
      )}
    </Card>
  );
};

const ReportList = ({ 
  gameId, 
  puzzleId, 
  showGameInfo = false, 
  showPuzzleInfo = false, 
  filterStatus, 
  refreshTimestamp,
  workspaceId
}) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [form] = Form.useForm();
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const carouselRefs = React.useRef({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Sorting and search state
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use location and navigate for URL parameters
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get filter from URL params or use default
  const getFilterFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('filter') || filterStatus || 'all';
  };

  // Get pagination, sort and search params from URL
  const getParamsFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return {
      page: parseInt(params.get('page')) || 1,
      pageSize: parseInt(params.get('pageSize')) || 10,
      sortOrder: params.get('sortOrder') || 'desc',
      search: params.get('search') || ''
    };
  };
  
  const [localFilterStatus, setLocalFilterStatus] = useState(getFilterFromUrl());

  // Initialize state from URL on component mount
  useEffect(() => {
    const { page, pageSize, sortOrder, search } = getParamsFromUrl();
    setCurrentPage(page);
    setPageSize(pageSize);
    setSortOrder(sortOrder);
    setSearchQuery(search);
  }, []);

  // Update URL when filter changes
  const updateUrlFilter = (newFilter) => {
    const params = new URLSearchParams(location.search);
    params.set('filter', newFilter);
    
    // Preserve other parameters
    const { page, pageSize, sortOrder, search } = getParamsFromUrl();
    params.set('page', page);
    params.set('pageSize', pageSize);
    params.set('sortOrder', sortOrder);
    if (search) params.set('search', search);
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    setLocalFilterStatus(newFilter);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Update URL with pagination, sort and search params
  const updateUrlParams = (params) => {
    const urlParams = new URLSearchParams(location.search);
    
    // Update passed parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlParams.set(key, value);
      } else {
        urlParams.delete(key);
      }
    });
    
    navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true });
  };

  // Handle page change
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
    updateUrlParams({ page, pageSize: size });
  };

  // Handle page size change
  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
    updateUrlParams({ pageSize: size });
  };

  // Handle sort order change
  const handleSortOrderChange = (order) => {
    setSortOrder(order);
    updateUrlParams({ sortOrder: order });
  };

  // Handle search query change - debounced to prevent too many API calls
  const debouncedSearch = debounce((value) => {
    setSearchQuery(value);
    updateUrlParams({ search: value, page: 1 }); // Reset to first page on search
  }, 500);

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    updateUrlParams({ search: '', page: 1 });
  };

  useEffect(() => {
    // Update filter when URL changes
    setLocalFilterStatus(getFilterFromUrl());
  }, [location.search]);

  useEffect(() => {
    if (filterStatus) {
      updateUrlFilter(filterStatus);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchReports();
  }, [gameId, puzzleId, localFilterStatus, refreshTimestamp, currentPage, pageSize, sortOrder, searchQuery, workspaceId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let url;
      
      if (puzzleId) {
        url = `${config.API_URL}/api/reports/puzzle/${puzzleId}`;
      } else if (gameId) {
        url = `${config.API_URL}/api/reports/game/${gameId}`;
      } else {
        url = `${config.API_URL}/api/reports`;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add status filter parameter if not 'all'
      if (localFilterStatus !== 'all') {
        params.set('status', localFilterStatus);
      }
      
      // Add workspace ID if available
      if (workspaceId) {
        params.set('workspaceId', workspaceId);
      }
      
      // Add pagination parameters
      params.set('page', currentPage);
      params.set('limit', pageSize);
      
      // Add sort parameter
      params.set('sortOrder', sortOrder);
      
      // Add search parameter if exists
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      
      // Add a cache-busting parameter to ensure fresh data
      params.set('_', Date.now());
      
      // Add query parameters to URL
      url += `?${params.toString()}`;
      
      const response = await axios.get(url);
      
      // Handle pagination data from API
      setReports(response.data.reports);
      setTotal(response.data.total);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setCurrentReport(report);
    // Extract image URLs from the images array
    setImageUrls(report.images?.map(img => img.imageUrl) || []);
    form.setFieldsValue({
      status: report.status,
      resolution: report.resolution || '',
      priority: report.priority || 'high'
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async (values) => {
    try {
      // Include the image URLs in the update
      const updateData = {
        status: values.status,
        resolution: values.resolution,
        priority: values.priority,
        imageUrls: imageUrls
      };
      
      const response = await axios.put(`${config.API_URL}/api/reports/${currentReport.id}`, updateData);
      
      // Close the modal first
      setEditModalVisible(false);
      
      // Add a unique timestamp to force a clean reload
      const timestamp = Date.now();
      window.location.href = window.location.pathname + 
        window.location.search + 
        (window.location.search.includes('?') ? '&' : '?') + 
        `forceUpdate=${timestamp}`;
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report. Please try again.');
    }
  };

  const handleDelete = async (reportId) => {
    try {
      await axios.delete(`${config.API_URL}/api/reports/${reportId}`);
      // Remove the deleted report from the list
      setReports(prevReports => prevReports.filter(report => report.id !== reportId));
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report. Please try again.');
    }
  };

  const uploadProps = {
    name: 'image',
    action: `${config.API_URL}/api/uploads`,
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
      if (info.file.status === 'uploading') {
        setUploadLoading(true);
        return;
      }
      
      if (info.file.status === 'done') {
        // Get the image URL from the server response
        const imageUrl = info.file.response.filePath;
        setImageUrls(prev => [...prev, imageUrl]);
        setUploadLoading(false);
        message.success(`${info.file.name} uploaded successfully`);
      } else if (info.file.status === 'error') {
        setUploadLoading(false);
        message.error(`${info.file.name} upload failed.`);
      }
    },
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
      }
      
      return isImage && isLt5M;
    },
    showUploadList: false,
  };

  const removeImage = (index) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    message.success('Image removed');
  };

  const handlePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  if (loading) {
    return <Spin tip="Loading reports..." />;
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        closable
        onClose={() => setError(null)}
      />
    );
  }

  return (
    <div className="reports-list-container">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <Title level={4}>
          Issue Reports
          <Badge 
            count={total > 0 && localFilterStatus !== 'resolved' ? total : 0} 
            style={{ backgroundColor: '#faad14', marginLeft: 8 }}
          />
        </Title>
        
        <Space wrap>
          {/* Search Box */}
          <Search
            placeholder="Search reports..."
            allowClear
            value={searchQuery}
            onChange={(e) => debouncedSearch(e.target.value)}
            onSearch={(value) => debouncedSearch(value)}
            style={{ width: 250 }}
          />
          
          {/* Sort Order Toggle */}
          <Tooltip title={`Sort by ${sortOrder === 'desc' ? 'oldest first' : 'newest first'}`}>
            <Button 
              icon={sortOrder === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />} 
              onClick={() => handleSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
            />
          </Tooltip>
          
          {/* Status Filter (only if not already provided by parent) */}
          {!filterStatus && (
            <Select 
              value={localFilterStatus} 
              onChange={updateUrlFilter}
              style={{ width: 150 }}
            >
              <Option value="all">All Issues</Option>
              <Option value="open">Open</Option>
              <Option value="in-progress">In Progress</Option>
              <Option value="resolved">Resolved</Option>
            </Select>
          )}
        </Space>
      </div>

      {reports.length === 0 ? (
        <Empty description="No reports found" />
      ) : (
        <>
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 2 }}
            dataSource={reports}
            renderItem={report => (
              <List.Item key={`report-${report.id}-${report.priority}-${Date.now()}`}>
                <ReportItem 
                  report={report} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete}
                  showGameInfo={showGameInfo}
                  showPuzzleInfo={showPuzzleInfo}
                />
              </List.Item>
            )}
            pagination={false}
          />
          
          {/* Pagination Controls */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger
              onShowSizeChange={handlePageSizeChange}
              pageSizeOptions={['10', '25', '50']}
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
            />
          </div>
        </>
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="max-content"
        bodyStyle={{ padding: 0 }}
      >
        <img 
          alt="Preview" 
          src={previewImage} 
          style={{ maxWidth: '100vw', maxHeight: '80vh' }} 
        />
      </Modal>

      {/* Edit Report Modal */}
      <Modal
        title="Update Report Status"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={700}
      >
        {currentReport && (
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
              console.log('Form submitted with values:', values);
              handleUpdate(values);
            }}
            onValuesChange={(changedValues) => {
              console.log('Form values changed:', changedValues);
            }}
            initialValues={{
              status: currentReport.status,
              resolution: currentReport.resolution || '',
              priority: currentReport.priority || 'high'
            }}
          >
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select a status' }]}
            >
              <Select>
                <Option value="open">Open</Option>
                <Option value="in-progress">In Progress</Option>
                <Option value="resolved">Resolved</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="priority"
              label="Priority"
            >
              <Select>
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="resolution"
              label="Resolution Notes"
              help="Add details about how the issue was resolved or is being addressed"
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              label="Report Images"
              help="Add or remove images related to this report"
            >
              <Upload {...uploadProps} multiple>
                <Button icon={<UploadOutlined />} loading={uploadLoading}>
                  Upload Images
                </Button>
              </Upload>
              
              {imageUrls.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 8 }}>Uploaded Images:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {imageUrls.map((url, index) => (
                      <div 
                        key={index}
                        style={{ 
                          position: 'relative', 
                          border: '1px solid #d9d9d9',
                          borderRadius: '2px',
                          padding: 4,
                          marginBottom: 8
                        }}
                      >
                        <img 
                          src={`${config.API_URL}${encodeURI(url)}`}
                          alt={`Image ${index + 1}`}
                          style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'contain' }}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeImage(index)}
                          style={{ 
                            position: 'absolute', 
                            top: 0, 
                            right: 0,
                            background: 'rgba(255, 255, 255, 0.8)'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update Report
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ReportList; 