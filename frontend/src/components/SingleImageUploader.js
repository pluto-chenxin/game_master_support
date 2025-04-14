import React, { useState, useEffect } from 'react';
import { Upload, Modal, message, Button } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';

const SingleImageUploader = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    if (value) {
      // If value starts with http, it's a direct URL
      // Otherwise, it's a path from our backend
      const fullUrl = value.startsWith('http') 
        ? value 
        : `http://localhost:5000${value}`;
      setImageUrl(fullUrl);
    }
  }, [value]);

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
    }
    
    return isImage && isLt5M;
  };

  const handleCancel = () => setPreviewVisible(false);

  const handlePreview = async () => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
    setPreviewTitle('Cover Image');
  };

  const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Add progress tracking
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
          const percent = Math.floor((e.loaded / e.total) * 100);
          onProgress({ percent });
        }
      };
      
      const response = await axios.post('http://localhost:5000/api/uploads', formData, config);
      
      // Update component state
      const fullUrl = `http://localhost:5000${response.data.filePath}`;
      setImageUrl(fullUrl);
      
      // Call onChange with just the path
      if (onChange) {
        onChange(response.data.filePath);
      }
      
      onSuccess(response.data);
      message.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      onError(error);
      message.error('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <>
      <Upload
        listType="picture-card"
        showUploadList={false}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        onPreview={handlePreview}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="cover" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          uploadButton
        )}
      </Upload>
      
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default SingleImageUploader; 