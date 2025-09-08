// Multi-Platform Search Service - Searches across all connected platforms
import driveService from './driveService';
import githubService from './githubService';
import notionService from './notionService';
import canvaService from './canvaService';

class MultiPlatformSearchService {
  constructor() {
    this.platformServices = {
      googleDrive: driveService,
      github: githubService,
      notion: notionService,
      canva: canvaService
    };
  }

  // Get all connected and enabled platforms
  getConnectedPlatforms(connections) {
    const connectedPlatforms = Object.keys(connections).filter(platformId => 
      connections[platformId]?.connected && connections[platformId]?.enabled
    );
    console.log('🔍 Connected and enabled platforms:', connectedPlatforms);
    console.log('🔍 All connections status:', Object.keys(connections).map(id => ({
      platform: id,
      connected: connections[id]?.connected,
      enabled: connections[id]?.enabled
    })));
    return connectedPlatforms;
  }

  // Detect platform preference from query
  detectPlatformFromQuery(query) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('github') || queryLower.includes('repository') || queryLower.includes('repo')) {
      return 'github';
    }
    if (queryLower.includes('canva') || queryLower.includes('design')) {
      return 'canva';
    }
    if (queryLower.includes('notion') || queryLower.includes('page')) {
      return 'notion';
    }
    if (queryLower.includes('google drive') || queryLower.includes('drive')) {
      return 'googleDrive';
    }
    
    return null;
  }

  // Search across all connected platforms with smart prioritization
  async searchAllPlatforms(query, connections, setProcessingStatus) {
    const connectedPlatforms = this.getConnectedPlatforms(connections);
    console.log(`🔍 Searching across ${connectedPlatforms.length} connected platforms:`, connectedPlatforms);
    
    if (connectedPlatforms.length === 0) {
      console.log('❌ No platforms connected for search');
      return [];
    }

    // Detect preferred platform from query
    const preferredPlatform = this.detectPlatformFromQuery(query);
    console.log('🎯 Detected preferred platform from query:', preferredPlatform);

    const allResults = [];
    const searchPromises = [];

    // Search preferred platform first if detected and connected
    if (preferredPlatform && connectedPlatforms.includes(preferredPlatform)) {
      console.log(`🚀 Prioritizing ${preferredPlatform} search based on query context`);
      if (setProcessingStatus) setProcessingStatus(`Searching ${this.getPlatformName(preferredPlatform)} first...`);
      
      try {
        const priorityResults = await this.searchPlatform(preferredPlatform, this.platformServices[preferredPlatform], query, setProcessingStatus);
        const formattedResults = priorityResults.map(result => ({
          ...result,
          platform: preferredPlatform,
          platformName: this.getPlatformName(preferredPlatform),
          priority: true
        }));
        allResults.push(...formattedResults);
        console.log(`✅ Priority search on ${preferredPlatform}: ${formattedResults.length} results`);
      } catch (error) {
        console.warn(`❌ Priority search on ${preferredPlatform} failed:`, error);
      }
    }

    // Search remaining platforms in parallel
    const remainingPlatforms = connectedPlatforms.filter(p => p !== preferredPlatform);
    
    for (const platformId of remainingPlatforms) {
      const service = this.platformServices[platformId];
      if (service && this.hasSearchMethod(platformId, service)) {
        console.log(`🔍 Starting search on ${platformId}...`);
        
        const searchPromise = this.searchPlatform(platformId, service, query, setProcessingStatus)
          .then(results => {
            console.log(`✅ ${platformId} search completed: ${results.length} results`);
            return results.map(result => ({
              ...result,
              platform: platformId,
              platformName: this.getPlatformName(platformId)
            }));
          })
          .catch(error => {
            console.warn(`❌ ${platformId} search failed:`, error);
            return [];
          });
        
        searchPromises.push(searchPromise);
      } else {
        console.warn(`⚠️ No search service available for ${platformId}`);
      }
    }

    // Wait for remaining searches to complete
    if (searchPromises.length > 0) {
      try {
        const platformResults = await Promise.all(searchPromises);
        
        // Combine all results
        platformResults.forEach(results => {
          allResults.push(...results);
        });
      } catch (error) {
        console.error('Multi-platform search error:', error);
      }
    }

    console.log(`🎯 Multi-platform search completed: ${allResults.length} total results`);
    return allResults;
  }

  // Check if service has appropriate search method
  hasSearchMethod(platformId, service) {
    if (platformId === 'github') {
      return typeof service.searchRepositories === 'function';
    }
    if (platformId === 'notion') {
      return typeof service.searchPages === 'function';
    }
    if (platformId === 'canva') {
      return typeof service.searchDesigns === 'function';
    }
    return typeof service.searchFiles === 'function';
  }

  // Search a specific platform with error handling
  async searchPlatform(platformId, service, query, setProcessingStatus) {
    try {
      if (setProcessingStatus) {
        setProcessingStatus(`Searching ${this.getPlatformName(platformId)}...`);
      }

      // Handle different service method signatures
      if (platformId === 'github') {
        // GitHub service has searchRepositories and searchCode methods
        console.log('🔍 Searching GitHub repositories and code...');
        if (typeof service.searchRepositories === 'function') {
          const repoResults = await service.searchRepositories(query);
          const codeResults = typeof service.searchCode === 'function' ? await service.searchCode(query) : { items: [] };
          
          // Combine repository and code search results
          const combinedResults = [
            ...(repoResults.items || []).map(repo => ({
              id: repo.id,
              name: repo.name,
              content: repo.description || '',
              webViewLink: repo.html_url,
              type: 'repository',
              owner: repo.owner?.login,
              stars: repo.stargazers_count,
              language: repo.language
            })),
            ...(codeResults.items || []).map(code => ({
              id: code.sha,
              name: code.name,
              content: code.text_matches?.[0]?.fragment || '',
              webViewLink: code.html_url,
              type: 'code',
              repository: code.repository?.name,
              path: code.path
            }))
          ];
          
          return combinedResults;
        }
      } else if (platformId === 'notion') {
        // Notion service
        if (typeof service.searchPages === 'function') {
          return await service.searchPages(query);
        } else if (typeof service.searchFiles === 'function') {
          return await service.searchFiles(query);
        }
      } else if (platformId === 'canva') {
        // Canva service
        if (typeof service.searchDesigns === 'function') {
          return await service.searchDesigns(query);
        } else if (typeof service.searchFiles === 'function') {
          return await service.searchFiles(query);
        }
      } else {
        // Default to searchFiles for other platforms
        if (typeof service.searchFiles === 'function') {
          return await service.searchFiles(query);
        }
      }

      console.warn(`No search method available for ${platformId}`);
      return [];
    } catch (error) {
      console.error(`Error searching ${platformId}:`, error);
      throw error;
    }
  }

  // Get user-friendly platform name
  getPlatformName(platformId) {
    const names = {
      googleDrive: 'Google Drive',
      github: 'GitHub',
      notion: 'Notion',
      canva: 'Canva'
    };
    return names[platformId] || platformId;
  }

  // Search with priority (Google Drive first, then others)
  async searchWithPriority(query, connections, setProcessingStatus) {
    const connectedPlatforms = this.getConnectedPlatforms(connections);
    
    if (connectedPlatforms.length === 0) {
      return [];
    }

    const results = [];

    // Search Google Drive first if connected (legacy behavior)
    if (connectedPlatforms.includes('googleDrive')) {
      try {
        if (setProcessingStatus) setProcessingStatus('Searching Google Drive...');
        const driveResults = await driveService.searchFiles(query, setProcessingStatus);
        results.push(...driveResults.map(r => ({ ...r, platform: 'googleDrive', platformName: 'Google Drive' })));
      } catch (error) {
        console.warn('Google Drive search failed:', error);
      }
    }

    // Search other platforms
    const otherPlatforms = connectedPlatforms.filter(p => p !== 'googleDrive');
    if (otherPlatforms.length > 0) {
      const otherResults = await this.searchAllPlatforms(query, 
        Object.fromEntries(otherPlatforms.map(p => [p, connections[p]])), 
        setProcessingStatus
      );
      results.push(...otherResults);
    }

    return results;
  }
}

export default new MultiPlatformSearchService();
