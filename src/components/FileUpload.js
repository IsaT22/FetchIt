import React, { useState, useRef } from 'react';
import fileStorageService from '../services/fileStorageService';

const FileUpload = ({ onFilesUploaded, onUploadProgress }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(files.map(file => ({ name: file.name, progress: 0, status: 'processing' })));

    try {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 25, status: 'extracting' } : item
        ));

        try {
          // Process file
          const result = await fileStorageService.uploadFiles([file]);
          
          // Update progress
          setUploadProgress(prev => prev.map((item, index) => 
            index === i ? { ...item, progress: 100, status: 'completed' } : item
          ));

          results.push(result[0]);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setUploadProgress(prev => prev.map((item, index) => 
            index === i ? { ...item, progress: 100, status: 'error', error: error.message } : item
          ));
          results.push({ error: error.message, fileName: file.name });
        }
      }

      // Notify parent component
      if (onFilesUploaded) {
        onFilesUploaded(results);
      }

      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  return (
    <div className="file-upload-container">
      <div 
        className={`file-upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <div className="upload-icon">
          {isUploading ? (
            <div className="upload-spinner">⟳</div>
          ) : (
            <span>📁</span>
          )}
        </div>
        
        <div className="upload-text">
          {isUploading ? (
            <div>
              <h3>Processing files...</h3>
              <p>Extracting content and generating metadata</p>
            </div>
          ) : (
            <div>
              <h3>Drop files here or click to browse</h3>
              <p>Supports PDF, DOC, XLS, CSV, TXT, PPT files</p>
            </div>
          )}
        </div>
      </div>

      {uploadProgress.length > 0 && (
        <div className="upload-progress">
          <h4>Upload Progress</h4>
          {uploadProgress.map((item, index) => (
            <div key={index} className="progress-item">
              <div className="progress-header">
                <span className="file-name">{item.name}</span>
                <span className={`status ${item.status}`}>
                  {item.status === 'processing' && '⏳ Processing'}
                  {item.status === 'extracting' && '🔍 Extracting'}
                  {item.status === 'completed' && '✅ Complete'}
                  {item.status === 'error' && '❌ Error'}
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
              {item.error && (
                <div className="error-message">{item.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
