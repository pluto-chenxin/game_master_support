import React, { useState } from 'react';
import { Upload, Modal, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import config from '../config';

const MultipleImageUploader = ({ value = [], onChange, puzzleId }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Convert backend image objects to upload component format
  React.useEffect(() => {
    if (value && value.length > 0) {
      const formattedFileList = value.map((img, index) => ({
        uid: img.id || `-${index}`,
        name: img.caption || `Image ${index + 1}`,
        status: 'done',
        url: `${config.API_URL}${img.imageUrl}`,
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary
      }));
      setFileList(formattedFileList);
    }
  }, [value]);

  // Add a console log to track the files being processed
  React.useEffect(() => {
    if (fileList.length > 0) {
      console.log('Updated file list in MultipleImageUploader:', fileList);
      // Process files for the form when fileList changes
      const processedFiles = fileList
        .filter(f => f.status === 'done' && (f.imageUrl || (f.response && f.response.filePath)))
        .map(f => ({
          imageUrl: f.imageUrl || (f.response && f.response.filePath),
          caption: f.name,
          isPrimary: f.isPrimary || false
        }));
      
      console.log('Processed files for onChange:', processedFiles);
      if (onChange && processedFiles.length > 0) {
        // Use a timeout to ensure the state update is processed correctly
        setTimeout(() => {
          onChange(processedFiles);
        }, 100);
      }
    }
  }, [fileList, onChange]);

  const handleCancel = () => setPreviewVisible(false);

  const handlePreview = async (file) => {
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
  };

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

  const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
    try {
      console.log('Starting upload for file:', file.name);
      const formData = new FormData();
      formData.append('image', file);
      
      // Add progress tracking
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
          const percent = Math.floor((e.loaded / e.total) * 100);
          console.log(`Upload progress for ${file.name}: ${percent}%`);
          onProgress({ percent });
        }
      };
      
      const response = await axios.post('/api/uploads', formData, config);
      console.log('Upload response:', response.data);
      
      // Create a unique response object with full path
      const responseWithPath = {
        ...response.data,
        uniqueId: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        fullUrl: `${config.API_URL}${response.data.filePath}`
      };
      
      // Explicitly mark the file as done
      file.status = 'done';
      file.response = responseWithPath;
      file.url = responseWithPath.fullUrl;
      file.thumbUrl = responseWithPath.fullUrl;
      file.imageUrl = response.data.filePath;
      
      onSuccess(responseWithPath, file);
      console.log('Marked file as done:', file.name);
      
      // If we have a puzzleId, save the image to the puzzle immediately
      if (puzzleId) {
        try {
          console.log(`Associating image ${file.name} with puzzle ID ${puzzleId}`);
          const puzzleImageResponse = await axios.post('/api/puzzle-images', {
            puzzleId,
            images: [{
              imageUrl: response.data.filePath,
              caption: file.name
            }]
          });
          console.log('Image association response:', puzzleImageResponse.data);
        } catch (error) {
          console.error('Error saving image to puzzle:', error);
        }
      }
      
      // Ensure our fileList state reflects this completed upload
      setFileList(prevList => {
        // Find if this file already exists in the list
        const fileExists = prevList.some(f => f.uid === file.uid);
        
        if (fileExists) {
          // Update the existing file
          return prevList.map(f => f.uid === file.uid ? {
            ...f,
            status: 'done',
            url: responseWithPath.fullUrl,
            thumbUrl: responseWithPath.fullUrl,
            imageUrl: response.data.filePath,
            response: responseWithPath
          } : f);
        } else {
          // Add the new file
          return [...prevList, {
            uid: file.uid,
            name: file.name,
            status: 'done',
            url: responseWithPath.fullUrl,
            thumbUrl: responseWithPath.fullUrl,
            imageUrl: response.data.filePath,
            response: responseWithPath
          }];
        }
      });
      
    } catch (error) {
      console.error('Error uploading image:', error);
      file.status = 'error';
      file.error = error;
      onError(error);
    }
  };

  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    
    // Process the fileList to provide the data in the format expected by your form
    const processedFiles = newFileList
      .filter(file => file.status === 'done' && (file.url || (file.response && file.response.filePath)))
      .map(file => ({
        imageUrl: file.imageUrl || (file.response && file.response.filePath),
        caption: file.name,
        isPrimary: file.isPrimary || false
      }));
    
    if (onChange) {
      onChange(processedFiles);
    }
  };

  // Handle manual upload of selected files
  const handleManualUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(file => {
        const formData = new FormData();
        formData.append('image', file);
        
        return axios.post('/api/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      });
      
      const responses = await Promise.all(uploadPromises);
      
      // Add the files to the fileList
      const newFiles = responses.map((response, index) => ({
        uid: Date.now() + index,
        name: files[index].name,
        status: 'done',
        response: response.data,
        url: `${config.API_URL}${response.data.filePath}`,
      }));
      
      // Update fileList and trigger onChange
      const updatedFileList = [...fileList, ...newFiles];
      setFileList(updatedFileList);
      
      const processedFiles = updatedFileList
        .filter(file => file.status === 'done' && (file.url || (file.response && file.response.filePath)))
        .map(file => ({
          imageUrl: file.imageUrl || (file.response && file.response.filePath),
          caption: file.name,
          isPrimary: file.isPrimary || false
        }));
      
      if (onChange) {
        onChange(processedFiles);
      }
      
      message.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      message.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDraggerUpload = async (info) => {
    console.log('Drag upload info:', info);
    const { file, fileList } = info;
    
    // Handle file state changes
    if (file.status === 'uploading') {
      console.log('File uploading:', file.name);
    }
    
    if (file.status === 'done' && file.response) {
      console.log('File done uploading:', file.name, file.response);
      
      // Create a processed file with proper URLs and status
      const processedFile = {
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: `${config.API_URL}${file.response.filePath}`,
        thumbUrl: `${config.API_URL}${file.response.filePath}`,
        response: file.response,
        imageUrl: file.response.filePath
      };
      
      // Update fileList with the processed file
      const updatedFileList = fileList.map(f => 
        f.uid === file.uid ? processedFile : f
      );
      
      // Update the state with the new file list
      setFileList(updatedFileList);
      
      // Process files for the form
      const processedFiles = updatedFileList
        .filter(f => f.status === 'done' && f.response)
        .map(f => ({
          imageUrl: f.response.filePath,
          caption: f.name,
          isPrimary: f.isPrimary || false
        }));
      
      console.log('Processed files for onChange:', processedFiles);
      
      if (onChange) {
        onChange(processedFiles);
      }
      
      message.success(`${file.name} uploaded successfully`);
    } else if (file.status === 'error') {
      message.error(`${file.name} upload failed.`);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <input
          type="file"
          multiple
          style={{ display: 'none' }}
          ref={fileInputRef => fileInputRef && (window.fileInputRef = fileInputRef)}
          onChange={e => handleManualUpload(e.target.files)}
        />
        <Button 
          onClick={() => window.fileInputRef && window.fileInputRef.click()}
          loading={uploading}
          type="primary"
          icon={<PlusOutlined />}
          style={{ marginRight: 8 }}
        >
          Upload Multiple Images
        </Button>
        <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
          Or use the drag area below
        </span>
      </div>
      
      {/* Drag area for uploads */}
      <Upload.Dragger
        fileList={[]}
        showUploadList={false}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        onChange={handleDraggerUpload}
        multiple={true}
        accept="image/*"
        style={{ padding: '10px 0', marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <PlusOutlined style={{ fontSize: 24, color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text">Click or drag files to this area to upload</p>
        <p className="ant-upload-hint">
          Support for multiple image uploads
        </p>
      </Upload.Dragger>
      
      {/* Display uploaded images */}
      {fileList.length > 0 && (
        <div className="uploaded-images-list">
          <div style={{ marginBottom: 8 }}>
            {fileList.length} image(s) uploaded
          </div>
          <Upload
            listType="picture-card"
            fileList={fileList.map(file => {
              // Force all files to be displayed as "done" if they have a response
              return {
                ...file,
                status: file.response ? 'done' : file.status,
                url: file.url || (file.response && `${config.API_URL}${file.response.filePath}`),
                thumbUrl: file.thumbUrl || (file.response && `${config.API_URL}${file.response.filePath}`),
                // Add a preview property for better image display
                preview: file.url || (file.response && `${config.API_URL}${file.response.filePath}`)
              };
            })}
            onPreview={handlePreview}
            onChange={handleChange}
            showUploadList={{ 
              showRemoveIcon: true,
              showPreviewIcon: true 
            }}
            customRequest={({ onSuccess }) => {
              setTimeout(() => {
                onSuccess("ok");
              }, 0);
            }}
          />
        </div>
      )}
      
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default MultipleImageUploader; 