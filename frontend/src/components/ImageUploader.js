import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import config from '../config';

const ImageUploader = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(value);

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

  const handleChange = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      setLoading(false);
      // The response includes the file path
      const filePath = info.file.response.filePath;
      setImageUrl(filePath);
      
      // Call the form onChange to update form values
      if (onChange) {
        onChange(filePath);
      }
      
      message.success('Image uploaded successfully');
    } else if (info.file.status === 'error') {
      setLoading(false);
      message.error('Image upload failed');
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post('/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      onSuccess(response.data, file);
    } catch (error) {
      console.error('Error uploading image:', error);
      onError(error);
    }
  };

  return (
    <Upload
      name="image"
      listType="picture-card"
      className="puzzle-image-uploader"
      showUploadList={false}
      beforeUpload={beforeUpload}
      onChange={handleChange}
      customRequest={customRequest}
    >
      {imageUrl ? (
        <img 
          src={`${config.API_URL}${imageUrl}`} 
          alt="puzzle" 
          style={{ width: '100%' }} 
        />
      ) : (
        uploadButton
      )}
    </Upload>
  );
};

export default ImageUploader; 