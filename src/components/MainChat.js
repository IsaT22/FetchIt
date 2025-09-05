import React, { useState, useRef, useEffect } from 'react';
import ConnectionsPanel from './ConnectionsPanel';
import chromaService from '../services/chromaService';

const MainChat = ({ 
  conversation, 
  processQuery, 
  isProcessing,
  showToolsPanel, 
  setShowToolsPanel,
  voiceMode,
  setVoiceMode,
  connections,
  toggleConnection,
  connectPlatform,
  setCurrentView,
  onViewChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const toolsPanelRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!showToolsPanel) return;

    const handleClickOutside = (event) => {
      const toolsContainer = document.querySelector('.tools-panel');
      const toolsButton = document.querySelector('.tools-btn');
      const clickedElement = event.target;
      
      // Don't close if clicking inside the tools panel or on the tools button
      if ((toolsContainer && toolsContainer.contains(clickedElement)) || 
          (toolsButton && (toolsButton === clickedElement || toolsButton.contains(clickedElement)))) {
        return;
      }
      
      setShowToolsPanel(false);
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showToolsPanel, setShowToolsPanel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inputValue.trim() || isProcessing) return;

    const query = inputValue.trim();
    setInputValue('');

    try {
      await processQuery(query);
    } catch (error) {
      console.error('Error processing query:', error);
    }
  };

  const handleVoiceInput = () => {
    setVoiceMode(!voiceMode);
    // Voice input functionality will be integrated later
    alert('Voice mode ' + (voiceMode ? 'disabled' : 'enabled') + '! Voice input will be integrated with Eleven Labs.');
  };

  const handleFileUpload = () => {
    // Get connected platforms
    const connectedPlatforms = Object.entries(connections).filter(([_, connection]) => connection.connected);
    
    if (connectedPlatforms.length === 0) {
      // No connected platforms - show local file upload only
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
      fileInput.multiple = true;
      
      fileInput.onchange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
          alert(`Thank you! ${files.length} file(s) received. This will help improve our AI's understanding of your data.`);
          console.log('Files to process for AI learning:', files.map(f => f.name));
        }
      };
      
      fileInput.click();
    } else {
      // Show platform selection modal
      showPlatformSelectionModal(connectedPlatforms);
    }
  };

  const showPlatformSelectionModal = (connectedPlatforms) => {
    // Check if modal already exists
    if (document.querySelector('.platform-selection-modal')) {
      return;
    }
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'platform-selection-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <h3>Select File Source</h3>
          <p>Choose where to upload or select files from:</p>
          <div class="platform-options">
            <button class="platform-option local" data-platform="local">
              <span class="platform-icon">💻</span>
              <span class="platform-name">Local Files</span>
              <span class="platform-desc">Upload from your device</span>
            </button>
            ${connectedPlatforms.map(([platformId, connection]) => `
              <button class="platform-option connected" data-platform="${platformId}">
                <span class="platform-icon">${getPlatformIcon(platformId)}</span>
                <span class="platform-name">${getPlatformName(platformId)}</span>
                <span class="platform-desc">Select from connected account</span>
              </button>
            `).join('')}
          </div>
          <button class="modal-close">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle platform selection with proper event delegation
    const handleModalClick = (e) => {
      e.stopPropagation();
      
      if (e.target.closest('.platform-option')) {
        const platformOption = e.target.closest('.platform-option');
        const platform = platformOption.dataset.platform;
        
        // Remove modal
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        
        if (platform === 'local') {
          // Local file upload
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
          fileInput.multiple = true;
          
          fileInput.onchange = async (event) => {
            const files = Array.from(event.target.files);
            if (files.length > 0) {
              alert(`Thank you! ${files.length} file(s) received from local device.`);
              console.log('Local files to process:', files.map(f => f.name));
              
              // Index files in vector database
              for (const file of files) {
                try {
                  const text = await file.text();
                  const fileId = `local_${Date.now()}_${file.name}`;
                  await chromaService.addDocument(fileId, file.name, text, {
                    platform: 'local',
                    fileType: file.type,
                    fileSize: file.size
                  });
                  console.log(`Indexed file: ${file.name}`);
                } catch (error) {
                  console.error(`Error indexing file ${file.name}:`, error);
                }
              }
            }
          };
          
          fileInput.click();
        } else {
          // Connected platform file picker
          handlePlatformFilePicker(platform);
        }
      } else if (e.target.closest('.modal-close') || e.target.classList.contains('modal-overlay')) {
        // Close modal
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      }
    };
    
    modal.addEventListener('click', handleModalClick);
  };

  const getPlatformIcon = (platformId) => {
    const icons = {
      googleDrive: '📁',
      oneDrive: '☁️',
      dropbox: '📦',
      notion: '📝',
      github: '🐙',
      slack: '💬'
    };
    return icons[platformId] || '🔗';
  };

  const getPlatformName = (platformId) => {
    const names = {
      googleDrive: 'Google Drive',
      oneDrive: 'OneDrive',
      dropbox: 'Dropbox',
      notion: 'Notion',
      github: 'GitHub',
      slack: 'Slack'
    };
    return names[platformId] || platformId;
  };

  const handlePlatformFilePicker = (platformId) => {
    alert(`File picker for ${getPlatformName(platformId)} will be implemented. For now, files are automatically indexed when you connect the platform.`);
    // TODO: Implement platform-specific file pickers
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const timestamp = message.timestamp;
    
    return (
      <div key={message.id} className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}>
        <div className="message-content">
          <div className="message-text" dangerouslySetInnerHTML={{
            __html: message.text
              .split('\n')
              .map(line => {
                // Convert markdown links to HTML links
                return line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
              })
              .join('<br>')
          }} />
          
          {message.sources && message.sources.length > 0 && (
            <div className="message-sources">
              <div className="sources-header">Sources:</div>
              {message.sources.map((source, index) => (
                <button 
                  key={index} 
                  className="source-item clickable"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const link = source.webViewLink || source.webContentLink;
                    if (link) {
                      console.log('Opening file:', source.name, 'Link:', link);
                      window.open(link, '_blank');
                    } else {
                      console.warn('No link available for:', source.name);
                    }
                  }}
                  style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                >
                  <span className="source-icon">📄</span>
                  <span className="source-name">{source.name}</span>
                  <span className="source-platform">({source.platform})</span>
                  {source.relevance && (
                    <span className="source-relevance">{Math.round(source.relevance)}% match</span>
                  )}
                  <span className="source-link-icon">🔗</span>
                </button>
              ))}
            </div>
          )}
          
          {message.showFileUpload && (
            <div className="file-upload-section">
              <button 
                className="file-upload-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFileUpload();
                }}
              >
                Send file over
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="main-chat">
      <div className="chat-header">
        <h1>AI File Assistant</h1>
        <ConnectionsPanel 
          connections={connections}
          toggleConnection={toggleConnection}
          connectPlatform={connectPlatform}
          setCurrentView={setCurrentView}
        />
      </div>


      <div className="chat-messages">
        {conversation.messages.map(renderMessage)}
        
        {isProcessing && (
          <div className="chat-message assistant-message processing">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {conversation.messages.length === 0 && (
        <div className="tips-section">
          <h3>Tips</h3>
          <ul>
            <li>Use specific keywords for better results</li>
            <li>Try file names, content, or document types</li>
            <li>Voice search is available for hands-free operation</li>
          </ul>
        </div>
      )}

      <div className={`chat-input-container ${conversation.messages.length > 0 ? 'has-messages' : ''}`}>
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about your files..."
              disabled={isProcessing}
              className="chat-input"
            />
            
            <div className="input-actions">
              <div className="tools-button-container">
                <button 
                  type="button"
                  className={`tools-btn ${showToolsPanel ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Tools button clicked, current state:', showToolsPanel);
                    setShowToolsPanel(!showToolsPanel);
                  }}
                  title="Tools"
                  ref={toolsPanelRef}
                >
                  🔧
                </button>
                
                {showToolsPanel && (
                  <div className="tools-panel">
                    <div className="tools-header">Tools</div>
                    <button 
                      className="tool-item"
                      onClick={handleVoiceInput}
                    >
                      <span className="tool-icon">{voiceMode ? '🔇' : '🎤'}</span>
                      <span className="tool-label">
                        {voiceMode ? 'Disable Voice' : 'Enable Voice'}
                      </span>
                    </button>
                    <button 
                      className="tool-item"
                      onClick={() => onViewChange && onViewChange('files')}
                    >
                      <span className="tool-icon">📁</span>
                      <span className="tool-label">File Manager</span>
                    </button>
                  </div>
                )}
              </div>
              
              {voiceMode && (
                <button
                  type="button"
                  className="voice-input-btn active"
                  onClick={handleVoiceInput}
                  title="Voice input active"
                >
                  🎤
                </button>
              )}
              
              <button 
                type="button"
                className="file-upload-btn-permanent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFileUpload();
                }}
                title="Upload or select files"
              >
                📁
              </button>
              
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isProcessing}
                className="send-btn"
                title="Send message"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit(e);
                }}
              >
                {isProcessing ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MainChat;
