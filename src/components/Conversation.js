import React, { useState, useRef, useEffect } from 'react';

const Conversation = ({ conversationHistory, currentFileContext, sessionMemory, processQuery, navigateTo }) => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    setIsProcessing(true);
    const query = inputValue.trim();
    setInputValue('');

    try {
      await processQuery(query);
    } catch (error) {
      console.error('Error processing query:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    return (
      <div key={message.id} className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
        <div className="message-content">
          <div className="message-text">
            {message.text.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
          <div className="message-timestamp">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page conversation-page">
      <div className="conversation-header">
        <h1>AI Assistant</h1>
        <p>Ask me to find, open, and work with your files naturally</p>
        
        {currentFileContext && (
          <div className="current-context">
            <strong>Current file:</strong> {currentFileContext.name} ({currentFileContext.platform})
          </div>
        )}
        
        <div className="navigation-buttons">
          <button className="button secondary" onClick={() => navigateTo('home')}>
            Home
          </button>
          <button className="button secondary" onClick={() => navigateTo('search')}>
            Search
          </button>
        </div>
      </div>

      <div className="conversation-container">
        <div className="messages-container">
          {conversationHistory.length === 0 ? (
            <div className="welcome-message">
              <h3>Welcome! I'm your AI file assistant.</h3>
              <p>Try saying things like:</p>
              <ul>
                <li>"Open the marketing document"</li>
                <li>"Summarize the sales report"</li>
                <li>"Compare it with the budget file"</li>
                <li>"Show me project files"</li>
              </ul>
            </div>
          ) : (
            conversationHistory.map(renderMessage)
          )}
          
          {isProcessing && (
            <div className="message assistant-message processing">
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

        <form className="conversation-input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about your files..."
            disabled={isProcessing}
            className="conversation-text-input"
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isProcessing}
            className="send-button"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
