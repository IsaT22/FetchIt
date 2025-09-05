import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import fileStorageService from '../services/fileStorageService';

const FileManager = ({ onFileSelect }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    dateFrom: '',
    dateTo: '',
    tags: []
  });
  const [storageStats, setStorageStats] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  useEffect(() => {
    loadFiles();
    loadStorageStats();
  }, [searchQuery, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFiles = async () => {
    try {
      setLoading(true);
      const allFiles = await fileStorageService.searchFiles(searchQuery, filters);
      setFiles(allFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await fileStorageService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const handleFilesUploaded = (uploadResults) => {
    const successfulUploads = uploadResults.filter(result => !result.error);
    if (successfulUploads.length > 0) {
      loadFiles();
      loadStorageStats();
    }
  };

  const handleSearch = async () => {
    await loadFiles();
  };

  const handleDeleteFiles = async () => {
    if (selectedFiles.size === 0) return;
    
    if (window.confirm(`Delete ${selectedFiles.size} selected file(s)?`)) {
      try {
        for (const fileId of selectedFiles) {
          await fileStorageService.deleteFile(fileId);
        }
        setSelectedFiles(new Set());
        loadFiles();
        loadStorageStats();
      } catch (error) {
        console.error('Error deleting files:', error);
      }
    }
  };

  const toggleFileSelection = (fileId) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('csv')) return '📊';
    if (type.includes('presentation')) return '📋';
    if (type.includes('text')) return '📃';
    return '📁';
  };

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <h2>File Manager</h2>
        
        {storageStats && (
          <div className="storage-stats">
            <span>{storageStats.totalFiles} files</span>
            <span>{formatFileSize(storageStats.totalSize)}</span>
          </div>
        )}
      </div>

      <FileUpload onFilesUploaded={handleFilesUploaded} />

      <div className="file-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-btn">
            🔍
          </button>
        </div>

        <div className="filter-section">
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="word">Word Documents</option>
            <option value="sheet">Spreadsheets</option>
            <option value="text">Text Files</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            className="date-filter"
            placeholder="From date"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            className="date-filter"
            placeholder="To date"
          />
        </div>

        {selectedFiles.size > 0 && (
          <div className="selection-actions">
            <span>{selectedFiles.size} selected</span>
            <button onClick={handleDeleteFiles} className="delete-btn">
              🗑️ Delete
            </button>
            <button onClick={() => setSelectedFiles(new Set())} className="clear-btn">
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="files-list">
        {loading ? (
          <div className="loading">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="no-files">
            {searchQuery ? 'No files match your search.' : 'No files uploaded yet.'}
          </div>
        ) : (
          files.map((file) => (
            <div 
              key={file.id} 
              className={`file-item ${selectedFiles.has(file.id) ? 'selected' : ''}`}
            >
              <div className="file-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                />
              </div>

              <div className="file-icon">
                {getFileIcon(file.type)}
              </div>

              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-meta">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{formatDate(file.uploadDate)}</span>
                  <span>•</span>
                  <span>{file.metadata.wordCount} words</span>
                  {file.relevanceScore && (
                    <>
                      <span>•</span>
                      <span className="relevance-score">
                        {Math.round(file.relevanceScore)}% match
                      </span>
                    </>
                  )}
                </div>
                
                {file.tags.length > 0 && (
                  <div className="file-tags">
                    {file.tags.slice(0, 5).map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                    {file.tags.length > 5 && (
                      <span className="tag-more">+{file.tags.length - 5}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="file-actions">
                <button 
                  onClick={() => onFileSelect && onFileSelect(file)}
                  className="action-btn"
                  title="View/Use file"
                >
                  👁️
                </button>
                <button 
                  onClick={() => toggleFileSelection(file.id)}
                  className="action-btn"
                  title="Select file"
                >
                  ✓
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileManager;
