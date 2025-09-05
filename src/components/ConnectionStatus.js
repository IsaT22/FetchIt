// Connection Status Component - Shows real-time OAuth connection status
import React, { useState, useEffect } from 'react';
import tokenValidationService from '../services/tokenValidationService';

const ConnectionStatus = ({ connections, onRefresh }) => {
  const [connectionStatus, setConnectionStatus] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Check connection status on component mount and periodically
  useEffect(() => {
    checkConnectionStatus();
    
    // Check every 5 minutes
    const interval = setInterval(checkConnectionStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    setIsChecking(true);
    try {
      const status = await tokenValidationService.checkAllConnections();
      setConnectionStatus(status);
      setLastChecked(new Date());
      
      // If any connections are invalid, notify parent to update UI
      if (onRefresh && status.googleDrive && !status.googleDrive.valid) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReconnect = async (platform) => {
    try {
      // Clear invalid tokens
      tokenValidationService.clearTokens(platform);
      
      // Redirect to platform setup
      window.location.hash = '#connections';
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error during reconnection:', error);
    }
  };

  const formatLastChecked = () => {
    if (!lastChecked) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - lastChecked) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const getStatusIcon = (status) => {
    if (!status) return '⚪';
    if (status.valid) return '🟢';
    return '🔴';
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    if (status.valid) return 'Connected';
    return status.reason || 'Disconnected';
  };

  return (
    <div className="connection-status">
      <div className="status-header">
        <h3>Connection Status</h3>
        <button 
          onClick={checkConnectionStatus} 
          disabled={isChecking}
          className="refresh-btn"
        >
          {isChecking ? '🔄' : '↻'} Refresh
        </button>
      </div>

      <div className="status-list">
        {/* Google Drive Status */}
        <div className="status-item">
          <div className="status-info">
            <span className="status-icon">
              {getStatusIcon(connectionStatus.googleDrive)}
            </span>
            <span className="platform-name">Google Drive</span>
            <span className="status-text">
              {getStatusText(connectionStatus.googleDrive)}
            </span>
          </div>
          
          {connectionStatus.googleDrive && !connectionStatus.googleDrive.valid && (
            <button 
              onClick={() => handleReconnect('googleDrive')}
              className="reconnect-btn"
            >
              Reconnect
            </button>
          )}
          
          {connectionStatus.googleDrive && connectionStatus.googleDrive.valid && connectionStatus.googleDrive.user && (
            <div className="user-info">
              <small>
                {connectionStatus.googleDrive.user.displayName || connectionStatus.googleDrive.user.emailAddress}
              </small>
            </div>
          )}
        </div>

        {/* Add other platforms here as needed */}
      </div>

      <div className="status-footer">
        <small>Last checked: {formatLastChecked()}</small>
      </div>

      <style jsx="true">{`
        .connection-status {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .status-header h3 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }

        .refresh-btn {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }

        .refresh-btn:hover {
          background: #0056b3;
        }

        .refresh-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .status-item:last-child {
          border-bottom: none;
        }

        .status-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-icon {
          font-size: 14px;
        }

        .platform-name {
          font-weight: 500;
          color: #333;
        }

        .status-text {
          color: #666;
          font-size: 14px;
        }

        .reconnect-btn {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 12px;
          cursor: pointer;
          font-size: 12px;
        }

        .reconnect-btn:hover {
          background: #c82333;
        }

        .user-info {
          margin-top: 4px;
        }

        .user-info small {
          color: #666;
          font-size: 12px;
        }

        .status-footer {
          margin-top: 12px;
          text-align: center;
        }

        .status-footer small {
          color: #999;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatus;
