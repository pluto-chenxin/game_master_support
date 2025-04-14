import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Spin, Alert, Upload, message, Space } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;

const ReportForm = ({ gameId, puzzleId, onFinish }) => {
  const [form] = Form.useForm();
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  // If a puzzleId is directly provided, we don't need to fetch puzzles
  const shouldFetchPuzzles = !puzzleId && gameId;

  useEffect(() => {
    // If we don't have a gameId or we do have a specific puzzleId, no need to fetch puzzles
    if (!shouldFetchPuzzles) return;

    const fetchPuzzles = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/games/${gameId}/puzzles`);
        setPuzzles(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching puzzles:', err);
        setError('Failed to load puzzles. Please try again.');
        setLoading(false);
      }
    };

    fetchPuzzles();
  }, [gameId, puzzleId, shouldFetchPuzzles]);

  const handleSubmit = async (values) => {
    try {
      setError(null); // Clear any previous errors
      
      // Create report data with proper date handling
      const currentDate = moment();
      const reportDate = values.reportDate || currentDate;
      
      const reportData = {
        title: values.title,
        description: values.description,
        gameId: Number(gameId),
        reportDate: reportDate.toISOString(), // Use ISO string for consistent formatting
        imageUrls: imageUrls.length > 0 ? imageUrls : [],  // Include image URLs array
        priority: values.priority || 'high'
      };
      
      // Add puzzleId only if it exists
      if (puzzleId) {
        reportData.puzzleId = Number(puzzleId);
      } else if (values.puzzleId) {
        reportData.puzzleId = Number(values.puzzleId);
      }

      console.log('Submitting report:', reportData);
      
      const response = await axios.post('http://localhost:5000/api/reports', reportData);
      
      // Clear the form
      form.resetFields();
      setImageUrls([]);
      
      // Call the onFinish callback with the created report
      if (onFinish) {
        onFinish(response.data);
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      if (err.response && err.response.data && err.response.data.errors) {
        const validationErrors = err.response.data.errors.map(e => e.msg).join(', ');
        setError(`Failed to submit report: ${validationErrors}`);
      } else {
        setError('Failed to submit report. Please try again.');
      }
    }
  };

  const uploadProps = {
    name: 'image',
    action: 'http://localhost:5000/api/uploads',
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
    showUploadList: false, // Hide default upload list
  };

  const removeImage = (index) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    message.success('Image removed');
  };

  return (
    <div className="report-form-container">
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          reportDate: moment(), // Set current date as initial value
          priority: 'high'
        }}
      >
        <Form.Item
          name="title"
          label="Report Title"
          rules={[{ required: true, message: 'Please enter a title for the report' }]}
        >
          <Input placeholder="Enter report title" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <TextArea
            rows={4}
            placeholder="Describe the issue in detail"
          />
        </Form.Item>

        <Form.Item
          name="reportDate"
          label="Report Date"
          rules={[{ required: true, message: 'Please select a date' }]}
        >
          <DatePicker 
            showTime={{ defaultValue: moment() }} 
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
          />
        </Form.Item>

        {shouldFetchPuzzles && (
          <Form.Item
            name="puzzleId"
            label="Related Puzzle (Optional)"
          >
            {loading ? (
              <Spin size="small" />
            ) : (
              <Select
                placeholder="Select a puzzle (optional)"
                allowClear
              >
                {puzzles.map(puzzle => (
                  <Option key={puzzle.id} value={puzzle.id}>
                    {puzzle.title}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>
        )}
        
        <Form.Item
          name="priority"
          label="Priority"
        >
          <Select defaultValue="high">
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          label="Add Images (Optional)"
          help="Upload images related to the issue"
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
                      src={`http://localhost:5000${url}`} 
                      alt={`Image ${index + 1}`}
                      style={{ maxWidth: '150px', maxHeight: '150px' }} 
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
            Submit Report
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ReportForm; 