# FetchIt - Advanced AI File Management System

A comprehensive React web application for AI-powered file management with semantic search, real-time LLM integration, cloud storage, and OCR capabilities.

## 🚀 Features

### Core File Management
- **Real File Upload & Storage**: Drag-drop interface with IndexedDB and cloud storage
- **Multi-Format Support**: PDF, DOCX, CSV, TXT, and image files with OCR
- **Advanced Search**: Semantic embeddings + traditional text search
- **Cloud Integration**: Firebase storage with local fallback
- **File Operations**: Upload, search, filter, delete with metadata extraction

### AI-Powered Intelligence
- **Semantic Search**: OpenAI/Cohere embeddings for contextual file discovery
- **Real LLM Integration**: GPT-4o-mini and Cohere for intelligent Q&A
- **OCR Support**: Tesseract.js for text extraction from images
- **Content Analysis**: Automatic summarization and key point extraction
- **Smart Responses**: Context-aware answers based on actual file content

### Platform Integrations
- **Multi-platform Support**: Google Drive and OneDrive (mock + real)
- **Conversational AI**: Natural language file interaction
- **Session Memory**: Maintains context throughout conversations
- **Voice Input**: Ready for voice search integration

## 📁 Project Structure

```
src/
├── components/
│   ├── MainChat.js           # Main chat interface with tools panel
│   ├── Conversation.js       # Chat message handling
│   ├── ConnectionsPanel.js   # Platform connection management
│   ├── FileManager.js        # File management UI
│   ├── FileUpload.js         # Drag-drop file upload
│   ├── Sidebar.js            # Navigation sidebar
│   └── ToolsPanel.js         # Chat tools and utilities
├── services/
│   ├── fileStorageService.js # Local file storage with IndexedDB
│   ├── embeddingService.js   # OpenAI/Cohere semantic embeddings
│   ├── llmService.js         # Real LLM API integration
│   ├── cloudStorageService.js# Firebase cloud storage
│   ├── ocrService.js         # Tesseract OCR for images
│   ├── driveService.js       # Google Drive integration (mock)
│   └── cloudStorageService.js# OneDrive integration (mock)
├── App.js                    # Main app with state management
├── index.js                  # React entry point
└── index.css                 # Global styles with dark theme
```

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Add your API keys to `.env`:


3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open in browser**:
   The app will automatically open at `http://localhost:3000`

### Running in Rocket Preview Mode

1. Open the project in your IDE
2. Run `npm start` in the terminal
3. The app will be available at `http://localhost:3000`
4. Use the browser preview feature to view the application

## 💡 Usage

### File Management
1. **Upload Files**: 
   - Click the 📁 button in the tools panel to access File Manager
   - Drag and drop files into the upload zone
   - Supports PDF, DOCX, CSV, TXT, and image files
   - Automatic content extraction and metadata generation

2. **Search & Filter**:
   - Use the search bar for text-based search
   - Apply filters by file type, date range, or tags
   - Semantic search automatically activates with API keys

### Conversational AI
1. **Natural Language Queries**:
   - "What's in my marketing documents?"
   - "Summarize the quarterly report"
   - "Find files about budget planning"
   - "Compare the sales data from last month"

2. **Smart Responses**:
   - AI searches both uploaded files and connected platforms
   - Provides context-aware answers based on actual file content
   - Shows file upload option when no relevant files are found

3. **Platform Connections**:
   - Click the ⚙️ button to manage Google Drive/OneDrive connections
   - Toggle platforms on/off as needed

## Conversational Capabilities

### Natural Language Processing
- **File Recognition**: Understands references like "marketing doc", "sales report", "budget file"
- **Action Detection**: Recognizes commands like "open", "summarize", "analyze", "compare"
- **Context Awareness**: Maintains file context with pronouns ("it", "this file", "that document")
- **Clarification**: Asks for clarification when multiple files match

### Session Memory
- **Current File Context**: Remembers the currently opened file
- **Conversation History**: Maintains full conversation thread
- **Action Tracking**: Tracks last performed actions
- **File Stack**: Keeps track of recently accessed files

### File Operations
- **Smart Search**: Content-based search with relevance scoring
- **AI Summarization**: Extracts key points and provides reading time estimates
- **Content Analysis**: Analyzes document themes and business insights
- **File Comparison**: Intelligent comparison between documents
- **Metadata Display**: Shows file size, modification date, and platform

## 🔧 API Configuration

### OpenAI Integration
- **Embeddings**: `text-embedding-3-small` for semantic search
- **LLM**: `gpt-4o-mini` for intelligent responses
- **Cost-effective**: Optimized for production use

### Cohere Integration (Alternative)
- **Embeddings**: `embed-english-light-v3.0`
- **LLM**: `command-light` for text generation
- **Fallback**: Automatic fallback if OpenAI unavailable

### Firebase Cloud Storage
- **File Storage**: Automatic cloud backup of uploaded files
- **Metadata**: Firestore for searchable file metadata
- **Sync**: Seamless sync between local and cloud storage

### OCR Capabilities
- **Engine**: Tesseract.js for client-side OCR
- **Formats**: JPEG, PNG, GIF, BMP, WebP support
- **Languages**: English (extensible to other languages)

## 🚀 Advanced Features

### Semantic Search
- Automatically generates embeddings for uploaded files
- Chunks large documents for better search accuracy
- Cosine similarity matching for relevant results
- Minimum similarity threshold filtering

### Intelligent Responses
- Context-aware Q&A based on actual file content
- Automatic summarization with key points extraction
- File comparison and analysis capabilities
- Fallback responses when APIs unavailable

### Performance Optimizations
- IndexedDB for fast local storage
- Chunked file processing for large documents
- Batch embedding generation with rate limiting
- Efficient similarity search algorithms

## 🛠️ Development

### Technology Stack
- **Frontend**: React 18 with hooks
- **Storage**: IndexedDB for local files, Firebase for cloud
- **AI**: OpenAI GPT-4o-mini, Cohere, Tesseract.js
- **File Processing**: PDF.js, Mammoth, PapaParse
- **Styling**: CSS with dark theme and green accents

### Key Services
- **fileStorageService**: Core file management with embeddings
- **embeddingService**: Semantic search capabilities
- **llmService**: Real AI response generation
- **cloudStorageService**: Firebase integration
- **ocrService**: Image text extraction

### Architecture Highlights
- **Modular Services**: Each service is independent and swappable
- **Graceful Degradation**: Works without API keys (limited functionality)
- **Error Handling**: Comprehensive error handling and fallbacks
- **Performance**: Optimized for large file processing
- **Security**: API keys in environment variables only

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 📦 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
Ensure these are set in your production environment:
```env
REACT_APP_OPENAI_API_KEY=sk-your-production-openai-key
REACT_APP_FIREBASE_API_KEY=your-production-firebase-key
# ... other Firebase config
```

### Security Notes
- API keys are exposed in the client (use backend proxy in production)
- Firebase security rules should be configured properly
- Consider rate limiting for API calls

## 🔮 Future Enhancements

- **Backend API**: Move AI processing to secure backend
- **Real OAuth**: Implement actual Google Drive/OneDrive OAuth
- **Advanced OCR**: PDF OCR support with pdf2pic
- **Multi-language**: Support for multiple languages in OCR
- **Collaborative Features**: Shared file spaces and comments
- **Advanced Analytics**: File usage analytics and insights
- **Mobile App**: React Native mobile version

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**FetchIt** - Intelligent file management powered by AI 🚀
