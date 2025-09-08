import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
// import Sidebar from './components/Sidebar';
import MainChat from './components/MainChat';
// import PlatformSetup from './components/PlatformSetup';
// import GuestModeModal from './components/GuestModeModal';
// import UserAuth from './components/UserAuth';
// import Settings from './components/Settings';
// import UserSettings from './components/UserSettings';
// import ConnectionStatus from './components/ConnectionStatus';
import ConnectionsManager from './components/ConnectionsManager';
import ConnectionsPanel from './components/ConnectionsPanel';
import TermsOfUse from './components/TermsOfUse';
import PrivacyPolicy from './components/PrivacyPolicy';
import driveService from './services/driveService';
import chromaService from './services/chromaService';
import llmService from './services/llmService';
import embeddingService from './services/embeddingService';
import encryptionService from './services/encryptionService';
import oauthService from './services/oauthService';
import tokenValidationService from './services/tokenValidationService';
import supabaseService from './services/supabaseService';
import feedbackService from './services/feedbackService';
import storageService from './services/storageService';
import multiPlatformSearchService from './services/multiPlatformSearchService';
import aiAgentService from './services/aiAgentService';
import userStorageService from './services/userStorageService';
// import canvaService from './services/canvaService';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  // Simplified state - no authentication needed
  
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
    notion: { enabled: false, connected: false, name: 'Notion', icon: '📝', description: 'Access your Notion workspace' },
    gmail: { enabled: false, connected: false, name: 'Gmail', icon: '📧', description: 'Access Gmail messages and attachments' },
    slack: { enabled: false, connected: false, name: 'Slack', icon: '💬', description: 'Connect to Slack channels and messages' }
  });
  
  // UI state
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'files', 'connections', 'auth', 'settings', 'terms', or 'privacy'
  
  // Handle navigation with URL routing
  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === 'terms') {
      navigate('/terms');
    } else if (view === 'privacy') {
      navigate('/privacy');
    } else if (view === 'chat') {
      navigate('/');
    } else if (view === 'connections') {
      navigate('/connections');
    }
  };
  
  // Update currentView based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/terms') {
      setCurrentView('terms');
    } else if (path === '/privacy') {
      setCurrentView('privacy');
    } else if (path === '/connections') {
      setCurrentView('connections');
    } else {
      setCurrentView('chat');
    }
  }, [location.pathname]);
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get active conversation
  const activeConversation = conversations.find(conv => conv.id === activeConversationId) || conversations[0];
  
  // Conversation management functions
  // const createNewConversation = () => {
  //   const newConversation = {
  //     id: Date.now(),
  //     title: 'New Chat',
  //     messages: [],
  //     createdAt: new Date().toISOString()
  //   };
  //   setConversations(prev => [newConversation, ...prev]);
  //   setActiveConversationId(newConversation.id);
  //   
  //   // Reset any processing state when creating new conversation
  //   setIsProcessing(false);
  // };
  
  // const deleteConversation = (id) => {
  //   if (conversations.length <= 1) return;
  //   setConversations(prev => prev.filter(conv => conv.id !== id));
  //   if (activeConversationId === id) {
  //     setActiveConversationId(conversations.find(conv => conv.id !== id).id);
  //   }
  // };
  
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
      
      // Save updated connections to storage
      saveConnections();
      
      console.log(`✅ Platform ${connectionId} disconnected successfully`);
    } catch (error) {
      console.error(`❌ Error disconnecting ${connectionId}:`, error);
    }
  };

  // Load saved user data and connections on app start
  useEffect(() => {
    const loadUserData = async () => {
      const encryptionService = (await import('./services/encryptionService')).default;
      
      // No user authentication needed - direct access to chat
      
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
  }, [connections]);

  // Removed guest mode handlers - direct access to chat

  // Load user data from storage
  const loadUserData = () => {
    const savedConversations = storageService.getItem('fetchit_conversations');
    if (savedConversations) {
      try {
        const conversations = JSON.parse(savedConversations);
        setConversations(conversations);
        
        const savedActiveId = storageService.getItem('fetchit_active_conversation');
        if (savedActiveId) {
          setActiveConversationId(parseInt(savedActiveId));
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }
  };

  // Load connections from storage
  const loadConnections = () => {
    const savedConnections = storageService.getItem('fetchit_connections');
    if (savedConnections) {
      try {
        const connectionsData = JSON.parse(savedConnections);
        setConnections(prev => ({
          ...prev,
          ...connectionsData
        }));
      } catch (error) {
        console.error('Error loading connections:', error);
      }
    }
  };

  // Save conversations to storage
  const saveConversations = useCallback(() => {
    storageService.setItem('fetchit_conversations', JSON.stringify(conversations));
    storageService.setItem('fetchit_active_conversation', activeConversationId.toString());
  }, [conversations, activeConversationId]);

  // Save connections to storage
  const saveConnections = useCallback(() => {
    storageService.setItem('fetchit_connections', JSON.stringify(connections));
  }, [connections]);

  // Auto-save conversations when they change
  useEffect(() => {
    saveConversations();
  }, [saveConversations]);

  // Auto-save connections when they change
  useEffect(() => {
    saveConnections();
  }, [saveConnections]);

  // Initialize services and load user data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load user data and connections first (fast)
        loadUserData();
        loadConnections();
        
        // Initialize services in background (slower)
        setTimeout(async () => {
          try {
            await chromaService.initialize();
            await aiAgentService.initialize();
            await embeddingService.initialize();
            console.log('All services initialized successfully');
          } catch (error) {
            console.error('Error initializing services:', error);
          }
        }, 100);
        
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  // Removed sign out functionality - no authentication needed


  // Initialize user storage only (lightweight)
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await userStorageService.initialize();
      } catch (error) {
        console.error('Error initializing storage:', error);
      }
    };

    initializeStorage();
  }, []);

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

  // Enhanced query analysis
  const analyzeQuery = (query) => {
    const lowerQuery = query.toLowerCase();
    return {
      isFilterRequest: /top \d+|first \d+|limit|filter|most relevant/.test(lowerQuery),
      isSpecificQuestion: /who|what|when|where|how|why|names?|dates?/.test(lowerQuery),
      isSummaryRequest: /summary|summarize|overview|highlights|key points/.test(lowerQuery),
      requestedCount: lowerQuery.match(/top (\d+)|first (\d+)|limit (\d+)/)?.[1] || null,
      keywords: query.split(/\s+/).filter(word => word.length > 2)
    };
  };

  // Process user query and get AI response
  const processQuery = async (query, setProcessingStatus) => {
    if (!query.trim()) return;

    setIsProcessing(true);
    if (setProcessingStatus) setProcessingStatus('Analyzing your request...');
    
    const userMessage = {
      id: Date.now(),
      text: query,
      type: 'user',
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversationId 
        ? { ...conv, messages: [...conv.messages, userMessage] }
        : conv
    ));

    let response = '';
    let searchResults = [];
    
    // Enhanced query understanding
    const queryAnalysis = analyzeQuery(query);
    console.log('🧠 Query analysis:', queryAnalysis);

    try {
      // Get previous feedback for learning
      const previousFeedback = JSON.parse(localStorage.getItem('fetchit_file_feedback') || '[]');
      console.log('📚 Learning from', previousFeedback.length, 'previous feedback entries');

      // Get conversation context for memory
      const activeConversation = conversations.find(conv => conv.id === activeConversationId);
      const conversationContext = activeConversation.messages.slice(-5).map(msg => ({
        type: msg.type,
        text: msg.text.substring(0, 200),
        timestamp: msg.timestamp
      }));
      console.log('🧠 Using conversation context:', conversationContext);

      if (setProcessingStatus) setProcessingStatus('Searching files...');
    let sources = [];
    
    // Add timeout handling for file processing
    const SEARCH_TIMEOUT = 30000; // 30 seconds
    const searchPromise = new Promise(async (resolve, reject) => {
      try {
        // Search using vector database first (semantic search)
        if (setProcessingStatus) setProcessingStatus('Performing semantic search...');
        const vectorResults = await chromaService.searchSimilar(query, 10);
        console.log('🔍 Vector search results:', vectorResults);
        
        if (vectorResults && vectorResults.length > 0) {
          searchResults = vectorResults;
          console.log(`✅ Found ${searchResults.length} files via vector search`);
          resolve(searchResults);
        } else {
          resolve([]);
        }
      } catch (vectorError) {
        console.warn('Vector search failed, falling back to platform search:', vectorError);
        resolve([]);
      }
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Search timeout')), SEARCH_TIMEOUT);
    });
    
    try {
      searchResults = await Promise.race([searchPromise, timeoutPromise]);
    } catch (timeoutError) {
      console.warn('Search timed out, using fallback:', timeoutError);
      searchResults = [];
    }
      
    // Always search connected platforms first, then fallback to uploaded files
    console.log('🔍 Starting multi-platform search...');
    let platformFiles = [];
    try {
      if (setProcessingStatus) setProcessingStatus('Searching connected platforms...');
      platformFiles = await multiPlatformSearchService.searchAllPlatforms(query, connections, setProcessingStatus);
      console.log(`📁 Found ${platformFiles.length} files across all platforms`);
    } catch (platformError) {
      console.warn('Multi-platform search failed:', platformError);
      // Provide helpful guidance for connection issues
      if (platformError.message && platformError.message.includes('authentication')) {
        platformFiles = [{
          name: 'Platform Connection Issue',
          content: `Unable to search platforms: ${platformError.message}. Please check your connections in the Connections panel.`,
          type: 'error',
          source: 'Multi-Platform'
        }];
      }
    }

    // Fallback to traditional search if vector search fails or returns no results
    if (searchResults.length === 0) {
      console.log('🔍 Performing fallback search in uploaded files...');
      const uploadedFiles = await chromaService.getAllFiles();
      console.log(`📁 Found ${uploadedFiles.length} uploaded files to search`);
      
      const allFiles = [...platformFiles, ...uploadedFiles];
      console.log(`📊 Total files for fallback search: ${allFiles.length}`);
      
      if (allFiles.length === 0) {
        const connectedPlatforms = Object.keys(connections).filter(p => connections[p]?.connected);
        if (connectedPlatforms.length === 0) {
          response = "I don't have access to any files yet. To get started:\n\n1. **Connect platforms**: Click the sidebar menu → Connections → Connect your platforms (Google Drive, GitHub, Notion, Canva)\n2. **Upload files**: Use the file upload feature in the chat\n\nOnce connected, I'll be able to search through your documents and provide intelligent responses based on your files.";
        } else {
          response = `I don't have access to any files yet from your connected platforms (${connectedPlatforms.join(', ')}). Please make sure your platforms contain documents I can search through, or upload files directly.`;
        }
      } else {
        // Extract keywords from query for better matching
        const extractKeywords = (query) => {
          // First, check for bracket-specified keywords [keyword]
          const bracketMatches = query.match(/\[([^\]]+)\]/g);
          if (bracketMatches) {
            const bracketKeywords = bracketMatches.map(match => 
              match.slice(1, -1).toLowerCase().trim() // Remove brackets and clean
            ).filter(keyword => keyword.length > 0);
            
            if (bracketKeywords.length > 0) {
              console.log(`🎯 Using bracket-specified keywords: ${bracketKeywords.join(', ')}`);
              return bracketKeywords;
            }
          }
          
          // Fallback to automatic keyword extraction
          const commonWords = ['give', 'me', 'show', 'find', 'search', 'get', 'files', 'documents', 'docs', 'slides', 'sheets', 'related', 'to', 'about', 'containing', 'with', 'that', 'mentions', 'anything', 'google', 'drive', 'in', 'the', 'overview', 'for', 'and', 'or', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
          
          // Remove bracket content from query for automatic extraction
          const cleanQuery = query.replace(/\[([^\]]+)\]/g, '');
          const words = cleanQuery.toLowerCase().split(/\s+/).filter(word => 
            word.length > 2 && !commonWords.includes(word)
          );
          return words;
        };
        
        const keywords = extractKeywords(query);
        console.log(`🔍 Extracted keywords: ${keywords && keywords.length > 0 ? keywords.join(', ') : 'none'}`);
        
        // Enhanced keyword matching with relevance scoring
        const matchingFiles = allFiles.filter(file => {
          const fileName = file.name ? file.name.toLowerCase() : '';
          const fileContent = (file.content || '').toLowerCase();
          
          if (!keywords || keywords.length === 0) return false;
          
          // Calculate relevance score
          let relevanceScore = 0;
          let keywordMatches = 0;
          
          keywords.forEach(keyword => {
            if (keyword) {
              if (fileName.includes(keyword)) {
                relevanceScore += 3; // Higher weight for filename matches
                keywordMatches++;
              }
              if (fileContent.includes(keyword)) {
                relevanceScore += 1; // Lower weight for content matches
                keywordMatches++;
              }
            }
          });
          
          // Require at least 50% of keywords to match for relevance
          const relevanceThreshold = Math.max(1, Math.ceil(keywords.length * 0.5));
          file.relevanceScore = relevanceScore;
          file.keywordMatches = keywordMatches;
          
          return keywordMatches >= relevanceThreshold;
        }).sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance
        
        console.log(`🎯 Found ${matchingFiles.length} matching files for query: "${query}"`);
        
        if (matchingFiles.length > 0) {
          // Apply filtering based on query analysis
          let finalFiles = matchingFiles;
          if (queryAnalysis.requestedCount) {
            finalFiles = matchingFiles.slice(0, parseInt(queryAnalysis.requestedCount));
          }
          
          // Check if files are actually relevant to the query
          const queryLower = query.toLowerCase();
          const isClotGuardQuery = queryLower.includes('clotguard') || queryLower.includes('clot guard');
          const isTestimonialQuery = queryLower.includes('testimonial') || queryLower.includes('testimony') || queryLower.includes('opinion');
          
          if (isClotGuardQuery && isTestimonialQuery) {
            // Filter out clearly irrelevant files for ClotGuard testimonial queries
            finalFiles = finalFiles.filter(f => {
              const fileName = f.name ? f.name.toLowerCase() : '';
              const fileContent = (f.content || '').toLowerCase();
              
              // Exclude files that are clearly not testimonials
              const isRelevant = (
                (fileName.includes('clotguard') && (fileName.includes('testimonial') || fileName.includes('testimony'))) ||
                (fileContent.includes('clotguard') && (fileContent.includes('testimonial') || fileContent.includes('testimony') || fileContent.includes('opinion'))) ||
                (fileName.includes('testimonial') && fileContent.includes('clotguard'))
              );
              
              // Exclude obviously irrelevant files
              const isIrrelevant = (
                fileName.includes('resume') || 
                fileName.includes('fetchit') || 
                fileName.includes('deck') ||
                fileName.includes('survey') ||
                (fileName.includes('copy') && fileName.includes('summary') && !fileContent.includes('clotguard'))
              );
              
              return isRelevant && !isIrrelevant;
            });
          }
          
          // If no relevant files found after filtering, provide helpful message
          if (finalFiles.length === 0) {
            response = `**Question:** ${query}\n\n**Answer:** I couldn't find any files specifically about ClotGuard testimonials or outside opinions in your Google Drive. The search returned some files, but they appear to be unrelated (resumes, presentations about other topics, etc.).\n\n**Relevant Files:** None found\n\nTo help me find the right information, please:\n1. Check if you have a "ClotGuard" folder in your Google Drive\n2. Ensure testimonial files contain "ClotGuard" and "testimonial" in the filename or content\n3. Try uploading the specific testimonial files if they're not in Google Drive`;
            return;
          }
          
          // Enhanced file metadata with detailed information
          const fileList = finalFiles.map(f => {
            const metadata = [];
            if (f.modifiedTime) metadata.push(`Modified: ${new Date(f.modifiedTime).toLocaleDateString()}`);
            if (f.createdTime) metadata.push(`Created: ${new Date(f.createdTime).toLocaleDateString()}`);
            if (f.size) metadata.push(`Size: ${f.size}`);
            if (f.owners && f.owners.length > 0) metadata.push(`Owner: ${f.owners[0].displayName || f.owners[0].emailAddress}`);
            if (f.shared) metadata.push(`Shared: Yes`);
            const metaStr = metadata.length > 0 ? ` • ${metadata.join(' • ')}` : '';
            return `• [${f.name}](${f.webViewLink || '#'}) ${f.mimeType ? `(${f.mimeType})` : ''}${metaStr}`;
          }).join('\n');
          
          // Enhanced response based on query type and conversation context
          if (queryAnalysis.isSpecificQuestion) {
            // Enhanced content extraction with LLM integration
            const relevantContent = finalFiles.map(f => f.content || '').filter(content => content.trim().length > 0).join('\n\n');
            console.log('📄 Relevant content length:', relevantContent.length);
            console.log('📄 Content preview:', relevantContent.substring(0, 100));
            console.log('📄 Final files with content:', finalFiles.map(f => ({ name: f.name, hasContent: !!(f.content && f.content.trim().length > 0), contentLength: f.content ? f.content.length : 0 })));
            
            // Use advanced LLM for better content analysis when available
            let directAnswer = '';
            
            // Try using the configured LLM service for enhanced analysis
            try {
              const llmService = (await import('./services/llmService')).default;
              if (llmService.isAvailable() && relevantContent.length > 0) {
                console.log('🤖 Using advanced LLM for content analysis');
                const fileNames = finalFiles.map(f => f.name);
                const fileContents = finalFiles.map(f => f.content || '').filter(c => c.trim().length > 0);
                
                if (fileContents.length > 0) {
                  const llmResponse = await llmService.generateResponse(query, fileContents, fileNames);
                  if (llmResponse && llmResponse.length > 50) {
                    directAnswer = llmResponse;
                    console.log('✅ LLM provided enhanced response');
                  }
                }
              }
            } catch (llmError) {
              console.warn('LLM service unavailable, using fallback analysis:', llmError);
            }
            
            // Fallback to manual analysis if LLM didn't provide a response
            if (!directAnswer || directAnswer.length < 50) {
              // Check for vague follow-up requests that need context
              const queryLower = query.toLowerCase();
              const isVagueFollowUp = queryLower.includes('try') && queryLower.includes('again') && queryLower.length < 50;
            
              if (isVagueFollowUp && conversationContext.length > 1) {
              // Find the most recent specific question in conversation history
              const recentQuestions = conversationContext.filter(msg => 
                msg.type === 'user' && 
                (msg.text.toLowerCase().includes('clotguard') || 
                 msg.text.toLowerCase().includes('testimonial') ||
                 msg.text.toLowerCase().includes('who') ||
                 msg.text.toLowerCase().includes('names'))
              );
              
              if (recentQuestions.length > 0) {
                const lastQuestion = recentQuestions[recentQuestions.length - 1];
                console.log('🔄 Detected vague follow-up, using context:', lastQuestion.text);
                
                // Re-analyze based on the previous question
                if (lastQuestion.text.toLowerCase().includes('clotguard') && 
                    (lastQuestion.text.toLowerCase().includes('testimonial') || lastQuestion.text.toLowerCase().includes('who'))) {
                  
                  // Filter files specifically for ClotGuard testimonials
                  const clotGuardFiles = finalFiles.filter(f => 
                    (f.name && f.name.toLowerCase().includes('clotguard')) || 
                    (f.name && f.name.toLowerCase().includes('testimonial')) ||
                    (f.content && f.content.toLowerCase().includes('clotguard'))
                  );
                  
                  if (clotGuardFiles.length === 0) {
                    directAnswer = 'I still cannot find specific ClotGuard testimonial files. The files found appear to be about interviews and writing drafts, not ClotGuard testimonials. You may need to check if the testimonials are in a specific "ClotGuard" folder in your Google Drive.';
                  } else {
                    const testimonyContent = clotGuardFiles.map(f => f.content || '').join('\n');
                    const nameMatches = testimonyContent.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g) || [];
                    const uniqueNames = [...new Set(nameMatches)].slice(0, 10);
                    directAnswer = uniqueNames.length > 0 ? 
                      `Based on your previous question about ClotGuard testimonials, I found these names: ${uniqueNames.join(', ')}.` : 
                      `I found ${clotGuardFiles.length} ClotGuard-related file(s), but could not extract specific names from the testimonials.`;
                  }
                } else {
                  directAnswer = `Based on your previous question "${lastQuestion.text.substring(0, 100)}...", I'm searching for relevant information.`;
                }
              } else {
                directAnswer = 'Could you please be more specific about what you\'d like me to try again?';
              }
            } else if (queryLower.includes('names') || queryLower.includes('who') || queryLower.includes('overview') || queryLower.includes('summary')) {
              // Enhanced content analysis for complex questions
              if (queryLower.includes('clotguard') || queryLower.includes('clot guard') || keywords.includes('clotguard')) {
                // More comprehensive name extraction patterns with debug logging
                const namePatterns = [
                  /([A-Z][a-z]+ [A-Z][a-z]+)/g, // Standard names
                  /([A-Z][a-z]+\s+[A-Z]\.\s+[A-Z][a-z]+)/g, // Names with middle initial
                  /Dr\.\s+([A-Z][a-z]+ [A-Z][a-z]+)/g, // Doctor titles
                  /([A-Z][a-z]+),\s+([A-Z][a-z]+)/g, // Last, First format
                  /([A-Z][A-Z\s]+)/g, // All caps names
                  /\b([A-Z][a-z]*)\s+([A-Z][a-z]*)\b/g, // Flexible name pattern
                ];
                
                console.log('🔍 Analyzing content for names:', relevantContent.substring(0, 200));
                
                let allNames = [];
                namePatterns.forEach((pattern, index) => {
                  const matches = relevantContent.match(pattern) || [];
                  console.log(`Pattern ${index + 1} found:`, matches);
                  allNames = allNames.concat(matches);
                });
                
                // Also try extracting any capitalized words that might be names
                const words = relevantContent.split(/\s+/);
                const potentialNames = [];
                for (let i = 0; i < words.length - 1; i++) {
                  const word1 = words[i].replace(/[^\w]/g, '');
                  const word2 = words[i + 1].replace(/[^\w]/g, '');
                  if (word1.length > 1 && word2.length > 1 && 
                      /^[A-Z][a-z]/.test(word1) && /^[A-Z][a-z]/.test(word2)) {
                    potentialNames.push(`${word1} ${word2}`);
                  }
                }
                allNames = allNames.concat(potentialNames);
                
                // Also extract sentiment and key phrases
                const positiveWords = ['excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'outstanding', 'impressive', 'effective', 'helpful', 'beneficial', 'positive', 'good', 'satisfied', 'happy', 'pleased', 'recommend'];
                const negativeWords = ['terrible', 'awful', 'bad', 'poor', 'disappointing', 'ineffective', 'useless', 'negative', 'dissatisfied', 'unhappy', 'problems', 'issues', 'concerns'];
                
                const contentLower = relevantContent.toLowerCase();
                const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
                const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
                
                const sentiment = positiveCount > negativeCount ? 'generally positive' : 
                                negativeCount > positiveCount ? 'generally negative' : 'mixed';
                
                const uniqueNames = [...new Set(allNames)].slice(0, 15);
                
                if (queryLower.includes('overview') || queryLower.includes('summary')) {
                  // Always provide comprehensive overview, even if names aren't perfectly extracted
                  const nameSection = uniqueNames.length > 0 ? 
                    `**Authors:** ${uniqueNames.join(', ')}` : 
                    `**Authors:** Unable to extract specific names from testimonial content`;
                  
                  // Extract any text that might contain author information
                  const authorHints = relevantContent.match(/written by|by |from |- |signed|testimonial from|review by/gi) || [];
                  const hasAuthorHints = authorHints.length > 0;
                  
                  const contentPreview = relevantContent && relevantContent.trim().length > 0 ? 
                    relevantContent.substring(0, 300) : 
                    'No content preview available - file may be empty or in unsupported format';
                  
                  directAnswer = `**ClotGuard Testimonials Overview:**\n\n${nameSection}\n\n**Sentiment:** The testimonials appear to be ${sentiment} based on the language used.\n\n**Summary:** Found testimonial content with ${hasAuthorHints ? 'author attribution indicators' : 'various perspectives'} on ClotGuard's effectiveness and user experience.\n\n**Content Preview:** ${contentPreview}${relevantContent && relevantContent.length > 300 ? '...' : ''}`;
                } else {
                  directAnswer = uniqueNames.length > 0 ? 
                    `The people who provided testimonials for ClotGuard are: ${uniqueNames.join(', ')}.` : 
                    'I found ClotGuard testimonial content but could not extract specific author names. The content may use different name formats or be anonymized.';
                }
              } else {
                // General name extraction for non-ClotGuard queries
                const nameMatches = relevantContent.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g) || [];
                const uniqueNames = [...new Set(nameMatches)].slice(0, 10);
                directAnswer = uniqueNames.length > 0 ? 
                  `The names found are: ${uniqueNames.join(', ')}.` : 
                  'No specific names were found in the content.';
              }
            } else if (queryLower.includes('testimonies') || queryLower.includes('testimony')) {
              // Look for testimony-related content with ClotGuard context
              if (queryLower.includes('clotguard') || queryLower.includes('clot guard')) {
                // STRICT: Only files that contain BOTH ClotGuard AND testimonial references
                const clotGuardTestimonialFiles = finalFiles.filter(f => {
                  const hasClotGuard = (f.name && (f.name.toLowerCase().includes('clotguard') || f.name.toLowerCase().includes('clot guard'))) ||
                                      (f.content && (f.content.toLowerCase().includes('clotguard') || f.content.toLowerCase().includes('clot guard')));
                  const hasTestimonial = (f.name && (f.name.toLowerCase().includes('testimonial') || f.name.toLowerCase().includes('testimony'))) ||
                                         (f.content && (f.content.toLowerCase().includes('testimonial') || f.content.toLowerCase().includes('testimony')));
                  return hasClotGuard && hasTestimonial;
                });
                
                if (clotGuardTestimonialFiles.length === 0) {
                  directAnswer = 'No files found that contain both ClotGuard references and testimonial content. Please check if your ClotGuard testimonials are stored in a specific folder in your Google Drive.';
                } else {
                  const testimonyContent = clotGuardTestimonialFiles.map(f => f.content || '').join('\n');
                  const nameMatches = testimonyContent.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g) || [];
                  const uniqueNames = [...new Set(nameMatches)].slice(0, 10);
                  directAnswer = uniqueNames.length > 0 ? 
                    `Found ClotGuard testimonials from: ${uniqueNames.join(', ')}.` : 
                    'Found ClotGuard testimonial files but could not extract specific names.';
                }
              } else {
                directAnswer = 'Found testimony-related content. Please specify if you\'re looking for ClotGuard testimonials specifically.';
              }
            } else {
              // Enhanced general question answering with more flexibility
              if (relevantContent && relevantContent.length > 0) {
                // Check for bracket keywords to provide more targeted analysis
                const bracketMatches = query.match(/\[([^\]]+)\]/g);
                if (bracketMatches && bracketMatches.length > 0) {
                  // For bracket queries, provide comprehensive analysis
                  const keywordContext = bracketMatches.map(match => match.slice(1, -1)).join(' and ');
                  
                  // Extract key information based on content
                  const sentences = relevantContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
                  const relevantSentences = sentences.filter(sentence => 
                    keywords.some(keyword => sentence.toLowerCase().includes(keyword))
                  ).slice(0, 5);
                  
                  if (relevantSentences.length > 0) {
                    directAnswer = `**Analysis of ${keywordContext}:**\n\n${relevantSentences.join('. ')}.`;
                  } else {
                    directAnswer = `Found content related to ${keywordContext}, but need more specific information to provide a detailed analysis. The files contain relevant information but may require a more targeted question.`;
                  }
                } else {
                  // For regular queries, provide flexible content analysis
                  const contentPreview = relevantContent.substring(0, 500);
                  directAnswer = `**Based on the available content:**\n\n${contentPreview}${relevantContent.length > 500 ? '...' : ''}`;
                }
              } else {
                directAnswer = 'I found files matching your search criteria, but the content may be in a format that requires more specific analysis. Try asking about specific aspects or using bracket keywords like [topic] for better results.';
              }
            }
            }
            
            // Filter files to only show those that actually contributed to the answer
            let contributingFiles = [];
            
            // ENHANCED BRACKET-BASED KEYWORD FILTERING: Prioritize [bracket] keywords
            // Use the same keywords extracted earlier (which now supports brackets)
            if (keywords && keywords.length > 0) {
              console.log(`🎯 Filtering files using keywords: ${keywords.join(', ')}`);
              
              // Files MUST contain ALL specified keywords (stricter for bracket queries)
              contributingFiles = finalFiles.filter(f => {
                const fileName = f.name ? f.name.toLowerCase() : '';
                const fileContent = f.content ? f.content.toLowerCase() : '';
                
                // For bracket-specified keywords, require ALL keywords to be present
                const bracketMatches = query.match(/\[([^\]]+)\]/g);
                if (bracketMatches && bracketMatches.length > 0) {
                  return keywords.every(keyword => 
                    fileName.includes(keyword) || fileContent.includes(keyword)
                  );
                } else {
                  // For auto-extracted keywords, require at least one match
                  return keywords.some(keyword => 
                    fileName.includes(keyword) || fileContent.includes(keyword)
                  );
                }
              });
              
              // Additional filtering for specific query types
              const queryLower = query.toLowerCase();
              if (queryLower.includes('names') || queryLower.includes('who')) {
                const nameMatches = relevantContent.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g) || [];
                if (nameMatches.length > 0) {
                  contributingFiles = contributingFiles.filter(f => {
                    return nameMatches.some(name => f.content && f.content.includes(name));
                  });
                }
              }
              
              if (contributingFiles.length === 0) {
                console.log(`❌ No files found containing required keywords: ${keywords.join(', ')}`);
              }
            } else {
              contributingFiles = [];
              console.log('❌ No meaningful keywords found in query');
            }
            
            // If no contributing files found, show the most relevant one
            if (contributingFiles.length === 0 && finalFiles.length > 0) {
              contributingFiles = [finalFiles[0]];
            }
            
            // Create file list for only contributing files
            const contributingFileList = contributingFiles.map(f => {
              const metadata = [];
              if (f.modifiedTime) metadata.push(`Modified: ${new Date(f.modifiedTime).toLocaleDateString()}`);
              if (f.createdTime) metadata.push(`Created: ${new Date(f.createdTime).toLocaleDateString()}`);
              if (f.size) metadata.push(`Size: ${f.size}`);
              if (f.owners && f.owners.length > 0) metadata.push(`Owner: ${f.owners[0].displayName || f.owners[0].emailAddress}`);
              if (f.shared) metadata.push(`Shared: Yes`);
              const metaStr = metadata.length > 0 ? ` • ${metadata.join(' • ')}` : '';
              return `• [${f.name}](${f.webViewLink || '#'}) ${f.mimeType ? `(${f.mimeType})` : ''}${metaStr}`;
            }).join('\n');
            
            // Check if this relates to previous conversation
            const contextualInfo = conversationContext.length > 1 ? 
              `\n\n*Note: Building on our previous discussion about ${conversationContext[conversationContext.length - 2]?.text?.substring(0, 50)}...*` : '';
            
            response = `**Answer:** ${directAnswer}\n\n**Source Files:**\n${contributingFileList}${contextualInfo}`;
          } else if (queryAnalysis.isSummaryRequest) {
            // Provide summary and highlights
            const highlights = finalFiles.map(f => `• **${f.name}**: ${f.content ? f.content.substring(0, 100) + '...' : 'Document available for review'}`).join('\n');
            response = `I found ${finalFiles.length} relevant file(s):\n\n${fileList}\n\n**Key Highlights:**\n${highlights}`;
          } else {
            // Standard file listing - but check if this should have been a ClotGuard testimonial search
            const queryLower = query.toLowerCase();
            if (queryLower.includes('clotguard') || queryLower.includes('testimonial')) {
              // Filter out irrelevant files for ClotGuard queries
              const clotGuardFiles = finalFiles.filter(f => 
                (f.name && f.name.toLowerCase().includes('clotguard')) || 
                (f.name && f.name.toLowerCase().includes('testimonial')) ||
                (f.content && f.content.toLowerCase().includes('clotguard'))
              );
              
              if (clotGuardFiles.length === 0) {
                response = `**Answer:** No ClotGuard testimonial files found in the search results.\n\nThe files found (${finalFiles.length}) appear to be about interviews, writing drafts, and other topics, but not ClotGuard testimonials. Please check if your ClotGuard testimonials are stored in a specific folder in your Google Drive.\n\n**Files Found:**\n${fileList}`;
              } else {
                const clotGuardFileList = clotGuardFiles.map(f => {
                  const metadata = [];
                  if (f.modifiedTime) metadata.push(`Modified: ${new Date(f.modifiedTime).toLocaleDateString()}`);
                  if (f.createdTime) metadata.push(`Created: ${new Date(f.createdTime).toLocaleDateString()}`);
                  if (f.size) metadata.push(`Size: ${f.size}`);
                  if (f.owners && f.owners.length > 0) metadata.push(`Owner: ${f.owners[0].displayName || f.owners[0].emailAddress}`);
                  if (f.shared) metadata.push(`Shared: Yes`);
                  const metaStr = metadata.length > 0 ? ` • ${metadata.join(' • ')}` : '';
                  return `• [${f.name}](${f.webViewLink || '#'}) ${f.mimeType ? `(${f.mimeType})` : ''}${metaStr}`;
                }).join('\n');
                
                response = `**Answer:** Found ${clotGuardFiles.length} ClotGuard-related file(s):\n\n${clotGuardFileList}`;
              }
            } else {
              // Standard file listing with preview
              const contentPreview = finalFiles[0].content && finalFiles[0].content.trim() 
                ? finalFiles[0].content.substring(0, 300) + '...' 
                : 'Click the file link above to view the full content.';
              response = `I found ${finalFiles.length} relevant file(s):\n\n${fileList}\n\n**Preview from "${finalFiles[0].name}":**\n${contentPreview}`;
            }
          }
        } else {
          // Check if user is referencing previous conversation
          const previousMentions = conversationContext.filter(msg => 
            msg.type === 'assistant' && msg.text.includes('found')
          );
          
          const contextualSuggestion = previousMentions.length > 0 ? 
            `\n\nBased on our previous conversation, you might want to try searching for terms from the files I found earlier.` : '';
          
          response = `I searched through ${allFiles.length} files but couldn't find anything directly related to "${query}". Try rephrasing your question or check if the files contain the information you're looking for.${contextualSuggestion}`;
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
      
    // Files found - combine all search results (vector + platform)
    const allSearchResults = [...searchResults, ...platformFiles];
    console.log(`📊 Combined search results: ${allSearchResults.length} files`);
    
    // Check for specific data requests
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('shares') || lowerQuery.includes('amount') || lowerQuery.includes('value') || lowerQuery.includes('completed') || lowerQuery.includes('reachouts')) {
      const relevantFiles = allSearchResults.slice(0, 3);
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
      query: query // Store original query for feedback context
    };
    
    setTimeout(() => {
      addMessageToConversation(assistantMessage);
      setIsProcessing(false);
      if (setProcessingStatus) setProcessingStatus('');
    }, 500);
      
    } catch (error) {
      console.error('Error in processQuery:', error);
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: `I encountered an error while processing your request: ${error.message}. Please try again or contact support if the issue persists.`,
        type: 'assistant',
        timestamp: new Date().toISOString(),
        sources: [],
        showFileUpload: false
      };
      
      addMessageToConversation(assistantMessage);
      setIsProcessing(false);
    }
  };


  return (
    <div className="app-container">

      {/* Main Content - Full Width */}
      <div className="main-content-fullwidth">
        {/* Header Bar */}
        <div className="header-bar">
          <div className="logo-section">
            <h1 className="app-title">FetchIt</h1>
            <p className="app-subtitle">AI Assistant</p>
          </div>
          <div className="header-actions">
            <button 
              className={`nav-button ${currentView === 'chat' ? 'active' : ''}`}
              onClick={() => handleViewChange('chat')}
              title="Chat"
            >
              💬 Chat
            </button>
            <ConnectionsPanel 
              connections={connections}
              onConnect={connectPlatform}
              onDisconnect={toggleConnection}
              onViewChange={handleViewChange}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          <Routes>
            <Route path="/" element={
              <MainChat 
                conversation={conversations.find(conv => conv.id === activeConversationId)}
                conversations={conversations}
                activeConversationId={activeConversationId}
                processQuery={processQuery}
                isProcessing={isProcessing}
                showToolsPanel={showToolsPanel}
                setShowToolsPanel={setShowToolsPanel}
                voiceMode={voiceMode}
                setVoiceMode={setVoiceMode}
                connections={connections}
                toggleConnection={toggleConnection}
                connectPlatform={connectPlatform}
                disconnectPlatform={disconnectPlatform}
                setCurrentView={handleViewChange}
                onViewChange={handleViewChange}
                updateConversation={(updatedConversations) => {
                  setConversations(updatedConversations);
                }}
              />
            } />
            <Route path="/connections" element={
              <ConnectionsManager 
                connections={connections}
                onConnect={connectPlatform}
                onDisconnect={disconnectPlatform}
                onViewChange={handleViewChange}
              />
            } />
            <Route path="/terms" element={
              <TermsOfUse onBack={() => handleViewChange('chat')} />
            } />
            <Route path="/privacy" element={
              <PrivacyPolicy onBack={() => handleViewChange('chat')} />
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
