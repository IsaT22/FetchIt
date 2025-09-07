// Platform Registry - Database of available platforms for connection
export const platformRegistry = {
  // Available Connections
  notion: {
    id: 'notion',
    name: 'Notion',
    category: 'Available Connections',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/notion.svg',
    description: 'Access your Notion workspace',
    authType: 'api_key',
    features: ['notes', 'databases', 'collaboration'],
    tags: ['notion', 'notes', 'productivity', 'workspace']
  },
  github: {
    id: 'github',
    name: 'GitHub',
    category: 'Available Connections',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
    description: 'Access GitHub repositories and files',
    authType: 'oauth',
    features: ['code_repositories', 'version_control', 'collaboration'],
    tags: ['github', 'git', 'code', 'repositories', 'development']
  },
  canva: {
    id: 'canva',
    name: 'Canva',
    category: 'Available Connections',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/canva.svg',
    description: 'Connect to Canva designs',
    authType: 'oauth',
    features: ['graphic_design', 'templates', 'media'],
    tags: ['canva', 'design', 'graphics', 'templates']
  },
  
  // Cloud Storage Platforms
  googleDrive: {
    id: 'googleDrive',
    name: 'Google Drive',
    category: 'Cloud Storage',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/googledrive.svg',
    description: 'Access your Google Drive files and folders',
    authType: 'oauth',
    features: ['file_storage', 'document_sharing', 'collaboration'],
    tags: ['google', 'drive', 'cloud', 'storage', 'documents']
  },
  oneDrive: {
    id: 'oneDrive',
    name: 'Microsoft OneDrive',
    category: 'Cloud Storage',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg',
    description: 'Connect to Microsoft OneDrive',
    authType: 'oauth',
    features: ['file_storage', 'office_integration', 'collaboration'],
    tags: ['microsoft', 'onedrive', 'cloud', 'storage', 'office']
  },
  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'Cloud Storage',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Dropbox_logo_2017.svg',
    description: 'Sync files with Dropbox',
    authType: 'oauth',
    features: ['file_storage', 'sync', 'sharing'],
    tags: ['dropbox', 'cloud', 'storage', 'sync']
  },
  iCloudDrive: {
    id: 'iCloudDrive',
    name: 'iCloud Drive',
    category: 'Cloud Storage',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/icloud.svg',
    description: 'Access your iCloud Drive files',
    authType: 'oauth',
    features: ['file_storage', 'apple_ecosystem'],
    tags: ['apple', 'icloud', 'cloud', 'storage']
  },
  box: {
    id: 'box',
    name: 'Box',
    category: 'Cloud Storage',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Box%2C_Inc._logo.svg',
    description: 'Enterprise cloud storage and collaboration',
    authType: 'oauth',
    features: ['file_storage', 'enterprise', 'collaboration'],
    tags: ['box', 'enterprise', 'cloud', 'storage']
  },
  
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    category: 'Note-taking',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/obsidian.svg',
    description: 'Connect to Obsidian vaults',
    authType: 'local_path',
    features: ['notes', 'knowledge_graph', 'markdown'],
    tags: ['obsidian', 'notes', 'markdown', 'knowledge']
  },
  evernote: {
    id: 'evernote',
    name: 'Evernote',
    category: 'Note-taking',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/evernote.svg',
    description: 'Access your Evernote notebooks',
    authType: 'oauth',
    features: ['notes', 'web_clipper', 'organization'],
    tags: ['evernote', 'notes', 'notebooks']
  },
  onenote: {
    id: 'onenote',
    name: 'Microsoft OneNote',
    category: 'Note-taking',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/microsoftonenote.svg',
    description: 'Connect to OneNote notebooks',
    authType: 'oauth',
    features: ['notes', 'handwriting', 'organization'],
    tags: ['microsoft', 'onenote', 'notes', 'notebooks']
  },
  
  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    category: 'Development',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gitlab.svg',
    description: 'Connect to GitLab repositories',
    authType: 'oauth',
    features: ['code_repositories', 'ci_cd', 'project_management'],
    tags: ['gitlab', 'git', 'code', 'repositories', 'devops']
  },
  
  // Communication & Collaboration
  slack: {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg',
    description: 'Access Slack messages and files',
    authType: 'oauth',
    features: ['messaging', 'file_sharing', 'team_collaboration'],
    tags: ['slack', 'chat', 'communication', 'team']
  },
  
  // Email
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    category: 'Email',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg',
    description: 'Access Gmail messages and attachments',
    authType: 'oauth',
    features: ['email', 'attachments', 'search'],
    tags: ['gmail', 'google', 'email', 'messages']
  },
  outlook: {
    id: 'outlook',
    name: 'Microsoft Outlook',
    category: 'Email',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/microsoftoutlook.svg',
    description: 'Connect to Outlook email and calendar',
    authType: 'oauth',
    features: ['email', 'calendar', 'contacts'],
    tags: ['outlook', 'microsoft', 'email', 'calendar']
  },
  
  // Media & Design
  figma: {
    id: 'figma',
    name: 'Figma',
    category: 'Design',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/figma.svg',
    description: 'Access Figma design files',
    authType: 'oauth',
    features: ['design_files', 'collaboration', 'prototyping'],
    tags: ['figma', 'design', 'ui', 'prototyping']
  },
  
  // Project Management
  trello: {
    id: 'trello',
    name: 'Trello',
    category: 'Project Management',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/trello.svg',
    description: 'Access Trello boards and cards',
    authType: 'oauth',
    features: ['project_management', 'kanban', 'collaboration'],
    tags: ['trello', 'project', 'kanban', 'boards']
  },
  asana: {
    id: 'asana',
    name: 'Asana',
    category: 'Project Management',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/asana.svg',
    description: 'Connect to Asana projects and tasks',
    authType: 'oauth',
    features: ['project_management', 'task_tracking', 'team_collaboration'],
    tags: ['asana', 'project', 'tasks', 'productivity']
  },
  
  // Local File Systems
  localFiles: {
    id: 'localFiles',
    name: 'Local Files',
    category: 'Local Storage',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDRINEMzLjQ0NzcxIDQgMyA0LjQ0NzcxIDMgNVYxOUMzIDE5LjU1MjMgMy40NDc3MSAyMCA0IDIwSDIwQzIwLjU1MjMgMjAgMjEgMTkuNTUyMyAyMSAxOVY5QzIxIDguNDQ3NzEgMjAuNTUyMyA4IDIwIDhIMTJMMTAgNFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+',
    description: 'Access local file system',
    authType: 'local_path',
    features: ['local_files', 'directory_access'],
    tags: ['local', 'files', 'computer', 'filesystem']
  }
};

// Helper functions for platform registry
export const getPlatformById = (id) => platformRegistry[id];

export const getPlatformsByCategory = (category) => {
  return Object.values(platformRegistry).filter(platform => platform.category === category);
};

export const getAllCategories = () => {
  const categories = [...new Set(Object.values(platformRegistry).map(p => p.category))];
  // Put "Available Connections" first, then sort the rest
  const sorted = categories.filter(cat => cat !== 'Available Connections').sort();
  return categories.includes('Available Connections') ? ['Available Connections', ...sorted] : sorted;
};

export const searchPlatforms = (query) => {
  if (!query) return Object.values(platformRegistry);
  
  const lowerQuery = query.toLowerCase();
  return Object.values(platformRegistry).filter(platform => {
    return (
      platform.name.toLowerCase().includes(lowerQuery) ||
      platform.description.toLowerCase().includes(lowerQuery) ||
      platform.category.toLowerCase().includes(lowerQuery) ||
      platform.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  });
};

export const getPlatformCount = () => Object.keys(platformRegistry).length;
