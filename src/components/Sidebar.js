import React, { useState } from 'react';

const Sidebar = ({ 
  conversations, 
  activeConversationId, 
  setActiveConversationId, 
  createNewConversation, 
  deleteConversation,
  collapsed,
  setCollapsed,
  onViewChange,
  user,
  onShowAuth,
  onShowSettings,
  onShowAccountSettings
}) => {
  const [hoveredConversation, setHoveredConversation] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const groupConversationsByDate = () => {
    const groups = {};
    conversations.forEach(conv => {
      const dateKey = formatDate(conv.createdAt);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(conv);
    });
    return groups;
  };

  const groupedConversations = groupConversationsByDate();

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
        
        {!collapsed && (
          <button className="new-chat-btn" onClick={createNewConversation}>
            <span className="plus-icon">+</span>
            New Chat
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="conversations-list">
          {Object.entries(groupedConversations).map(([dateGroup, convs]) => (
            <div key={dateGroup} className="conversation-group">
              <div className="group-header">{dateGroup}</div>
              {convs.map(conversation => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${
                    conversation.id === activeConversationId ? 'active' : ''
                  }`}
                  onClick={() => {
                    setActiveConversationId(conversation.id);
                    if (onViewChange) {
                      onViewChange('chat');
                    }
                  }}
                  onMouseEnter={() => setHoveredConversation(conversation.id)}
                  onMouseLeave={() => setHoveredConversation(null)}
                >
                  <div className="conversation-title">
                    {conversation.title}
                  </div>
                  <div className="conversation-preview">
                    {conversation.messages.length > 0 
                      ? conversation.messages[conversation.messages.length - 1].text.substring(0, 50) + '...'
                      : 'No messages yet'
                    }
                  </div>
                  
                  {hoveredConversation === conversation.id && conversations.length > 1 && (
                    <button
                      className="delete-conversation-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                      title="Delete conversation"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        {!collapsed && (
          <>
            <div className="user-info" onClick={user ? onShowSettings : onShowAuth}>
              <div className="user-avatar">👤</div>
              <div className="user-details">
                <div className="user-name">{user ? `${user.firstName} ${user.lastName}` : 'Sign In'}</div>
                <div className="user-plan">{user ? user.plan : 'Create Account'}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
