import React, { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import MainChat from './components/MainChat';
import ConnectionsPanel from './components/ConnectionsPanel';
import ConnectionsManager from './components/ConnectionsManager';
import AccountSettings from './components/AccountSettings';
import ConnectionStatus from './components/ConnectionStatus';
import FileManager from './components/FileManager';
import UserAuth from './components/UserAuth';
import UserSettings from './components/UserSettings';
import Settings from './components/Settings';
import driveService from './services/driveService';
import fileStorageService from './services/fileStorageService';
import embeddingService from './services/embeddingService';
import encryptionService from './services/encryptionService';
import llmService from './services/llmService';
import chromaService from './services/chromaService';
import supabaseService from './services/supabaseService';
import aiAgentService from './services/aiAgentService';
import userStorageService from './services/userStorageService';

function App() {
  // User authentication
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  
  // Conversation management
  const [conversations, setConversations] = useState([
    { id: 1, title: 'New Chat', messages: [], createdAt: new Date().toISOString() }
  ]);
  const [activeConversationId, setActiveConversationId] = useState(1);
  
  // Platform connections
  const [connections, setConnections] = useState({
    googleDrive: { enabled: false, connected: false, name: 'Google Drive', icon: '📁', description: 'Access your Google Drive files and folders' },
    oneDrive: { enabled: false, connected: false, name: 'OneDrive', icon: '☁️', description: 'Connect to Microsoft OneDrive' },
    dropbox: { enabled: false, connected: false, name: 'Dropbox', icon: '📦', description: 'Sync with your Dropbox account' },
    notion: { enabled: false, connected: false, name: 'Notion', icon: '📝', description: 'Access your Notion workspace' }
  });
  
  // UI state
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'files', 'connections', 'auth', or 'settings'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get active conversation
  const activeConversation = conversations.find(conv => conv.id === activeConversationId) || conversations[0];
  
  // Conversation management functions
  const createNewConversation = () => {
    const newConversation = {
      id: Date.now(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    
    // Reset any processing state when creating new conversation
    setIsProcessing(false);
  };
  
  const deleteConversation = (id) => {
    if (conversations.length <= 1) return;
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(conversations.find(conv => conv.id !== id).id);
    }
  };
  
  const updateConversationTitle = (id, title) => {
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, title } : conv
    ));
  };
  
  const addMessageToConversation = (message) => {
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversationId 
        ? { ...conv, messages: [...conv.messages, message] }
        : conv
    ));
    
    // Auto-generate title from first user message
    if (message.type === 'user' && activeConversation.messages.length === 0) {
      const title = message.text.length > 30 
        ? message.text.substring(0, 30) + '...' 
        : message.text;
      updateConversationTitle(activeConversationId, title);
    }
  };
  
  // Connection management
  const toggleConnection = (connectionId) => {
    setConnections(prev => ({
      ...prev,
      [connectionId]: {
        ...prev[connectionId],
        enabled: !prev[connectionId].enabled
      }
    }));
  };
  
  const connectPlatform = async (connectionId, credentials) => {
    if (credentials && credentials.toggle) {
      // Toggle enabled state
      setConnections(prev => ({
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          enabled: !prev[connectionId].enabled
        }
      }));
    } else if (credentials && credentials.connected) {
      // Connect platform with OAuth tokens
      setConnections(prev => ({
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          connected: true,
          enabled: true,
          tokens: credentials.tokens,
          connectedAt: new Date().toISOString()
        }
      }));
      
      // Store connection state persistently
      try {
        const encryptionService = (await import('./services/encryptionService')).default;
        const connectionData = {
          connected: true,
          enabled: true,
          connectedAt: new Date().toISOString()
        };
        const encrypted = encryptionService.encrypt(connectionData);
        localStorage.setItem(`connection_${connectionId}`, encrypted);
      } catch (error) {
        console.error('Failed to save connection state:', error);
      }
    } else {
      // Navigate to connection setup
      setCurrentView('connections');
      window.location.hash = '#connections';
    }
  };

  const disconnectPlatform = async (connectionId) => {
    console.log(`🔌 Disconnecting platform: ${connectionId}`);
    
    try {
      // Remove stored credentials and tokens
      const encryptionService = (await import('./services/encryptionService')).default;
      encryptionService.removeCredentials(connectionId);
      
      // Remove OAuth tokens
      localStorage.removeItem(`tokens_${connectionId}`);
      localStorage.removeItem(`connection_${connectionId}`);
      
      console.log(`✅ Removed credentials and tokens for ${connectionId}`);
      
      // Update connection state
      setConnections(prev => ({
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          connected: false,
          enabled: false
        }
      }));
      
      // Save updated connections to user data
      if (user) {
        await saveUserSpecificData(user.id);
      }
      
      console.log(`✅ Platform ${connectionId} disconnected successfully`);
    } catch (error) {
      console.error(`❌ Error disconnecting ${connectionId}:`, error);
    }
  };

  // Load saved user data and connections on app start
  useEffect(() => {
    const loadUserData = async () => {
      const encryptionService = (await import('./services/encryptionService')).default;
      
      // Load user data
      const savedUser = localStorage.getItem('fetchit_user');
      if (savedUser) {
        try {
          // Try to decrypt user data
          const userData = encryptionService.decrypt(savedUser);
          setUser(userData);
        } catch (error) {
          // Fallback to plain JSON for backward compatibility
          try {
            setUser(JSON.parse(savedUser));
          } catch (parseError) {
            console.error('Failed to parse saved user:', parseError);
            localStorage.removeItem('fetchit_user');
          }
        }
      } else {
        // Check if there's a user in IndexedDB
        try {
          const userStorageService = (await import('./services/userStorageService')).default;
          await userStorageService.initialize();
          
          // Try to get last logged in user
          const lastUser = localStorage.getItem('fetchit_last_user_email');
          if (lastUser) {
            console.log('Found previous user email, checking session...');
            // For now, just show auth - we'll add session restoration later
          }
        } catch (error) {
          console.warn('Could not check for existing users:', error);
        }
        
        // Show authentication screen
        setCurrentView('auth');
      }
      
      // Load saved connections
      const connectionKeys = Object.keys(localStorage).filter(key => key.startsWith('connection_'));
      const savedConnections = {};
      
      for (const key of connectionKeys) {
        const connectionId = key.replace('connection_', '');
        try {
          const encrypted = localStorage.getItem(key);
          const connectionData = encryptionService.decrypt(encrypted);
          if (connectionData.connected) {
            savedConnections[connectionId] = {
              ...connections[connectionId],
              ...connectionData
            };
          }
        } catch (error) {
          console.warn(`Failed to load connection ${connectionId}:`, error);
        }
      }
      
      if (Object.keys(savedConnections).length > 0) {
        setConnections(prev => ({
          ...prev,
          ...savedConnections
        }));
      }
    };
    loadUserData();
  }, []);

  // Load user-specific data (conversations, connections)
  const loadUserSpecificData = async (userId) => {
    try {
      console.log(`📂 Loading data for user: ${userId}`);
      
      // Load user's conversations
      const savedConversations = localStorage.getItem(`conversations_${userId}`);
      if (savedConversations) {
        const encryptionService = (await import('./services/encryptionService')).default;
        try {
          const decryptedConversations = encryptionService.decrypt(savedConversations);
          setConversations(decryptedConversations);
          console.log(`✅ Loaded ${decryptedConversations.length} conversations`);
        } catch (error) {
          console.warn('Failed to decrypt conversations, using defaults');
        }
      }
      
      // Load user's connections
      const savedUserConnections = localStorage.getItem(`user_connections_${userId}`);
      if (savedUserConnections) {
        const encryptionService = (await import('./services/encryptionService')).default;
        try {
          const decryptedConnections = encryptionService.decrypt(savedUserConnections);
          setConnections(prev => ({ ...prev, ...decryptedConnections }));
          console.log('✅ Loaded user connections');
        } catch (error) {
          console.warn('Failed to decrypt user connections');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
    }
  };

  // Save user-specific data
  const saveUserSpecificData = async (userId) => {
    if (!userId) return;
    
    try {
      const encryptionService = (await import('./services/encryptionService')).default;
      
      // Save conversations
      const encryptedConversations = encryptionService.encrypt(conversations);
      localStorage.setItem(`conversations_${userId}`, encryptedConversations);
      
      // Save connections
      const encryptedConnections = encryptionService.encrypt(connections);
      localStorage.setItem(`user_connections_${userId}`, encryptedConnections);
      
      console.log('✅ User data saved successfully');
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
    }
  };

  // User authentication handlers
  const handleAuthSuccess = async (userData) => {
    console.log('🔐 User authentication successful:', userData);
    setUser(userData);
    
    // Save user data with encryption
    try {
      const encryptionService = (await import('./services/encryptionService')).default;
      const encrypted = encryptionService.encrypt(userData);
      localStorage.setItem('fetchit_user', encrypted);
      localStorage.setItem('fetchit_last_user_email', userData.email);
      console.log('✅ User data saved securely');
      
      // Load user-specific data (conversations, connections)
      await loadUserSpecificData(userData.id);
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
    }
    
    setCurrentView('chat');
  };

  const handleSignOut = async () => {
    if (user?.id) {
      try {
        // Save current data before signing out
        await saveUserSpecificData(user.id);
        
        // Clear current session
        await userStorageService.deleteSession(user.id);
      } catch (error) {
        console.warn('Failed to clear session:', error);
      }
    }
    setUser(null);
    setShowSettings(false);
    setCurrentView('auth');
    localStorage.removeItem('fetchit_current_user');
    localStorage.removeItem('fetchit_user');
  };

  // User management functions
  const handleUserUpdate = async (updatedUser) => {
    setUser(updatedUser);
    // Encrypt and save user data
    try {
      const encryptionService = (await import('./services/encryptionService')).default;
      const encryptedUserData = encryptionService.encrypt(updatedUser);
      localStorage.setItem('fetchit_user', encryptedUserData);
    } catch (error) {
      console.error('Failed to encrypt user data:', error);
      // Fallback to plain storage
      localStorage.setItem('fetchit_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteAccount = () => {
    setUser(null);
    setShowAccountSettings(false);
    setCurrentView('chat');
    window.location.hash = '';
  };

  const handleShowSettings = () => {
    setCurrentView('settings');
    setShowAccountSettings(false);
    setShowSettings(false);
    window.location.hash = '#settings';
  };

  const handleSettingsNavigation = (view) => {
    setShowSettings(false);
    if (view === 'connections') {
      setCurrentView('connections');
      window.location.hash = '#connections';
    } else if (view === 'files') {
      setCurrentView('files');
      window.location.hash = '#files';
    }
  };

  // Initialize services on app start
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize user storage first
        await userStorageService.initialize();
        
        // Check for existing session
        const savedUser = localStorage.getItem('fetchit_current_user');
        if (savedUser && !user) {
          try {
            const userData = JSON.parse(savedUser);
            const session = await userStorageService.getSession(userData.id);
            if (session) {
              const fullUser = await userStorageService.getUser(userData.id);
              if (fullUser) {
                setUser(fullUser);
              }
            } else {
              localStorage.removeItem('fetchit_current_user');
            }
          } catch (error) {
            console.warn('Failed to restore user session:', error);
            localStorage.removeItem('fetchit_current_user');
          }
        }
        
        // Initialize other services
        await supabaseService.initialize();
        await fileStorageService.initialize();
        await embeddingService.initialize();
        
        // Initialize AI Agent Service
        const userId = user?.id || 'default_user';
        await aiAgentService.initialize(userId);
        
        console.log('All services initialized successfully');
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initializeServices();
  }, [user]);

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('connections')) {
        setCurrentView('connections');
        // Extract platform parameter for preselection
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const preselectedPlatform = urlParams.get('platform');
        if (preselectedPlatform) {
          // Store preselected platform for ConnectionsManager
          window.preselectedPlatform = preselectedPlatform;
        }
      } else if (hash === 'files') {
        setCurrentView('files');
      } else if (hash === 'auth') {
        setCurrentView('auth');
      } else if (hash === 'settings') {
        setCurrentView('settings');
      } else {
        setCurrentView('chat');
        // Clear hash if it's not a valid route
        if (hash && hash !== 'chat') {
          window.history.replaceState(null, null, window.location.pathname);
        }
      }
    };

    // Preserve current view on reload based on hash
    // Don't force default to chat - let hash determine the view

    // Handle initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Enhanced AI processing for specific data extraction
  const processQuery = async (query) => {
    const userMessage = {
      id: Date.now(),
      text: query,
      type: 'user',
      timestamp: new Date().toISOString()
    };
    
    addMessageToConversation(userMessage);
    setIsProcessing(true);
    
    try {
      // Check enabled connections
      console.log('🔗 Checking connections status...');
      console.log('📊 All connections:', connections);
      
      const enabledConnections = Object.values(connections).filter(conn => conn.enabled);
      const connectedPlatforms = Object.values(connections).filter(conn => conn.connected);
      
      console.log(`✅ Enabled connections: ${enabledConnections.length}`);
      console.log(`🔌 Connected platforms: ${connectedPlatforms.length}`);
      console.log('🔌 Connected platforms details:', connectedPlatforms.map(c => ({
        platform: c.platform || 'unknown',
        enabled: c.enabled,
        connected: c.connected
      })));
      
      if (enabledConnections.length === 0) {
        console.log('❌ No enabled connections found');
        const response = {
          id: Date.now() + 1,
          text: 'Please enable at least one connection to search your files. Click the connections panel at the top right to get started.',
          type: 'assistant',
          timestamp: new Date().toISOString()
        };
        setTimeout(() => {
          addMessageToConversation(response);
          setIsProcessing(false);
        }, 500);
        return;
      }
    
    // Enhanced data extraction logic
    const lowerQuery = query.toLowerCase();
    let response = '';
    let sources = [];
    
    // Search using vector database first (semantic search)
    let searchResults = [];
    
    if (chromaService.isAvailable()) {
      try {
        console.log('Attempting vector search for query:', query);
        const vectorResults = await chromaService.searchDocuments(query, 10);
        console.log('Raw vector results:', vectorResults);
        searchResults = vectorResults.map(result => ({
          name: result.metadata?.fileName || 'Unknown file',
          content: result.content,
          platform: result.metadata?.platform || 'unknown',
          id: result.metadata?.fileId || 'unknown',
          relevanceScore: Math.round(result.similarity * 100),
          webViewLink: result.metadata?.webViewLink
        }));
        console.log(`Found ${searchResults.length} results via vector search:`, searchResults);
      } catch (error) {
        console.error('Vector search error:', error);
      }
    } else {
      console.log('Chroma service not available, skipping vector search');
    }
      
    // Fallback to traditional search if vector search fails or returns no results
    if (searchResults.length === 0) {
      console.log('🔍 Performing fallback search in uploaded files...');
      const uploadedFiles = await fileStorageService.getAllFiles();
      console.log(`📁 Found ${uploadedFiles.length} uploaded files to search`);
      
      // Also search Google Drive files if connected
      let driveFiles = [];
      if (connections.googleDrive?.connected) {
        try {
          console.log('🔍 Searching Google Drive files...');
          driveFiles = await driveService.searchFiles(query);
          console.log(`📁 Found ${driveFiles.length} Google Drive files`);
        } catch (driveError) {
          console.warn('❌ Google Drive search failed:', driveError);
          // If it's an authentication error, provide helpful guidance
          if (driveError.message.includes('authenticate') || driveError.message.includes('connect')) {
            response = `${driveError.message}\n\nTo connect Google Drive:\n1. Click the sidebar menu\n2. Go to "Connections"\n3. Click "Connect" next to Google Drive\n4. Sign in with your Google account`;
            return;
          }
        }
      } else {
        console.log('📝 Google Drive not connected - user should connect for file access');
      }
      
      const allFiles = [...uploadedFiles, ...driveFiles];
      console.log(`📊 Total files for fallback search: ${allFiles.length}`);
      
      if (allFiles.length === 0) {
        if (!connections.googleDrive?.connected) {
          response = "I don't have access to any files yet. To get started:\n\n1. **Connect Google Drive**: Click the sidebar menu → Connections → Connect Google Drive\n2. **Upload files**: Use the file upload feature in the chat\n\nOnce connected, I'll be able to search through your documents and provide intelligent responses based on your files.";
        } else {
          response = "I don't have access to any files yet. Please upload some files or make sure your Google Drive contains documents I can search through.";
        }
      } else {
        // Extract keywords from query for better matching
        const extractKeywords = (query) => {
          // Remove common words and extract meaningful keywords
          const commonWords = ['give', 'me', 'show', 'find', 'search', 'get', 'files', 'documents', 'docs', 'slides', 'sheets', 'related', 'to', 'about', 'containing', 'with', 'that', 'mentions', 'anything', 'google', 'drive', 'in', 'the'];
          const words = query.toLowerCase().split(/\s+/).filter(word => 
            word.length > 2 && !commonWords.includes(word)
          );
          return words;
        };
        
        const keywords = extractKeywords(query);
        console.log(`🔍 Extracted keywords: ${keywords.join(', ')}`);
        
        // Enhanced keyword matching
        const matchingFiles = allFiles.filter(file => {
          const fileName = file.name.toLowerCase();
          const fileContent = (file.content || '').toLowerCase();
          
          return keywords.some(keyword => 
            fileName.includes(keyword) || fileContent.includes(keyword)
          );
        });
        
        console.log(`🎯 Found ${matchingFiles.length} matching files for query: "${query}"`);
        
        if (matchingFiles.length > 0) {
          const fileList = matchingFiles.map(f => 
            `• [${f.name}](${f.webViewLink || '#'}) ${f.mimeType ? `(${f.mimeType})` : ''}`
          ).join('\n');
          
          const contentPreview = matchingFiles[0].content && matchingFiles[0].content.trim() 
            ? matchingFiles[0].content.substring(0, 300) + '...' 
            : 'Click the file link above to view the full content.';
            
          response = `I found ${matchingFiles.length} relevant file(s):\n\n${fileList}\n\n**Preview from "${matchingFiles[0].name}":**\n${contentPreview}`;
        } else {
          response = `I searched through ${allFiles.length} files but couldn't find anything directly related to "${query}". Try rephrasing your question or check if the files contain the information you're looking for.`;
        }
      }
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: response,
        type: 'assistant',
        timestamp: new Date().toISOString(),
        showFileUpload: true
      };
      setTimeout(() => {
        addMessageToConversation(assistantMessage);
        setIsProcessing(false);
      }, 500);
      return;
    }
      
    // Files found - check for specific data requests
    if (lowerQuery.includes('shares') || lowerQuery.includes('amount') || lowerQuery.includes('value') || lowerQuery.includes('completed') || lowerQuery.includes('reachouts')) {
      const relevantFiles = searchResults.slice(0, 3);
      sources = relevantFiles.map(file => ({
        name: file.name,
        platform: file.platform,
        id: file.id,
        relevance: file.relevanceScore,
        webViewLink: file.webViewLink
      }));
      
      // Try AI Agent Service first
      if (aiAgentService.isReady()) {
        console.log('Using AI Agent Service for query processing');
        
        const agentResponse = await aiAgentService.processQuery(query);
        
        if (agentResponse.answer && agentResponse.answer.length > 10) {
          response = agentResponse.answer;
          
          // Map source files to expected format
          sources = agentResponse.sourceFiles.map(filePath => ({
            name: filePath.split('/').pop() || filePath,
            platform: 'FetchIt AI',
            id: filePath,
            relevance: agentResponse.confidence || 0
          }));
          
          // Add confidence indicator if available
          if (agentResponse.confidence && agentResponse.confidence > 60) {
            response += `\n\n*AI Confidence: ${agentResponse.confidence}%*`;
          }
        } else {
          // Fallback to LLM service
          const fileContents = relevantFiles.map(file => file.content || file.summary || '');
          const fileNames = relevantFiles.map(file => file.name);
          response = await llmService.generateResponse(query, fileContents, fileNames);
        }
      } else {
        // Use LLM service for intelligent response generation
        const fileContents = relevantFiles.map(file => file.content || file.summary || '');
        const fileNames = relevantFiles.map(file => file.name);
        response = await llmService.generateResponse(query, fileContents, fileNames);
      }
    } else {
      // General query - use LLM for intelligent response
      const topFiles = searchResults.slice(0, 5);
      sources = topFiles.map(file => ({
        name: file.name,
        platform: file.platform || 'Local',
        id: file.id,
        relevance: file.relevanceScore,
        webViewLink: file.webViewLink
      }));
      
      const fileContents = topFiles.map(file => file.content || file.summary || '');
      const fileNames = topFiles.map(file => file.name);
      
      try {
        response = await llmService.generateResponse(query, fileContents, fileNames);
      } catch (error) {
        console.error('LLM service error:', error);
        response = `I found ${searchResults.length} relevant file(s). Here are the most relevant ones:\n\n${topFiles.map((file, index) => 
          `${index + 1}. **${file.name}** (${file.platform || 'Local'})\n   ${file.summary || 'No summary available'}`
        ).join('\n\n')}`;
      }
    }
      
    const assistantMessage = {
      id: Date.now() + 1,
      text: response,
      type: 'assistant',
      timestamp: new Date().toISOString(),
      sources: sources,
    };
    
    setTimeout(() => {
      addMessageToConversation(assistantMessage);
      setIsProcessing(false);
    }, 500);
      
  } catch (error) {
    console.error('Error processing query:', error);
    const errorMessage = {
      id: Date.now() + 1,
      text: 'I encountered an error while processing your request. Please try again or rephrase your question.',
      type: 'assistant',
      timestamp: new Date().toISOString()
    };
    setTimeout(() => {
      addMessageToConversation(errorMessage);
      setIsProcessing(false);
    }, 500);
  }
};


  return (
    <div className="app-container">
      <Sidebar 
        conversations={conversations}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
        createNewConversation={createNewConversation}
        deleteConversation={deleteConversation}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onViewChange={setCurrentView}
        user={user}
        onShowAuth={() => {
          setCurrentView('auth');
          window.location.hash = '#auth';
        }}
        onShowSettings={handleShowSettings}
        onShowAccountSettings={handleShowSettings}
      />
      
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        
        {currentView === 'chat' ? (
          <MainChat 
            conversation={activeConversation}
            processQuery={processQuery}
            isProcessing={isProcessing}
            showToolsPanel={showToolsPanel}
            setShowToolsPanel={setShowToolsPanel}
            voiceMode={voiceMode}
            setVoiceMode={setVoiceMode}
            connections={connections}
            toggleConnection={toggleConnection}
            connectPlatform={connectPlatform}
            setCurrentView={setCurrentView}
            onViewChange={setCurrentView}
          />
        ) : currentView === 'files' ? (
          <FileManager 
            onFileSelect={(file) => {
              // Switch to chat and reference the file
              setCurrentView('chat');
              // Could add file context here
            }}
            onViewChange={setCurrentView}
          />
        ) : currentView === 'auth' ? (
          <UserAuth 
            onClose={() => {
              setCurrentView('chat');
              window.location.hash = '';
            }}
            onAuthSuccess={handleAuthSuccess}
          />
        ) : currentView === 'settings' ? (
          <Settings 
            user={user}
            onClose={() => {
              setCurrentView('chat');
              window.location.hash = '';
            }}
            onUpdateUser={handleUserUpdate}
            onDeleteAccount={handleDeleteAccount}
            onSignOut={handleSignOut}
            onNavigate={handleSettingsNavigation}
          />
        ) : (
          <div>
            <ConnectionStatus 
              connections={connections}
              onRefresh={() => {
                // Refresh connections state - reload from localStorage
                const savedConnections = localStorage.getItem('connections');
                if (savedConnections) {
                  setConnections(JSON.parse(savedConnections));
                }
              }}
            />
            <ConnectionsManager 
              connections={connections}
              onBack={() => setCurrentView('chat')}
              onConnect={connectPlatform}
              onDisconnect={disconnectPlatform}
            />
          </div>
        )}
      </div>


      {showSettings && user && (
        <UserSettings 
          user={user}
          onClose={() => setShowSettings(false)}
          onUserUpdate={handleUserUpdate}
          onSignOut={handleSignOut}
          onNavigate={handleSettingsNavigation}
        />
      )}

    </div>
  );
}

export default App;
