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

  // Get all connected platforms
  getConnectedPlatforms(connections) {
    return Object.keys(connections).filter(platformId => 
      connections[platformId]?.connected && connections[platformId]?.enabled
    );
  }

  // Search across all connected platforms
  async searchAllPlatforms(query, connections, setProcessingStatus) {
    const connectedPlatforms = this.getConnectedPlatforms(connections);
    console.log(`🔍 Searching across ${connectedPlatforms.length} connected platforms:`, connectedPlatforms);
    
    if (connectedPlatforms.length === 0) {
      console.log('❌ No platforms connected for search');
      return [];
    }

    const allResults = [];
    const searchPromises = [];

    // Search each connected platform
    for (const platformId of connectedPlatforms) {
      const service = this.platformServices[platformId];
      if (service && typeof service.searchFiles === 'function') {
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

    // Wait for all searches to complete
    try {
      const platformResults = await Promise.all(searchPromises);
      
      // Combine all results
      platformResults.forEach(results => {
        allResults.push(...results);
      });

      console.log(`🎯 Multi-platform search completed: ${allResults.length} total results`);
      return allResults;
    } catch (error) {
      console.error('Multi-platform search error:', error);
      return allResults; // Return partial results if some searches failed
    }
  }

  // Search a specific platform with error handling
  async searchPlatform(platformId, service, query, setProcessingStatus) {
    try {
      if (setProcessingStatus) {
        setProcessingStatus(`Searching ${this.getPlatformName(platformId)}...`);
      }

      // Handle different service method signatures
      if (platformId === 'googleDrive') {
        return await service.searchFiles(query, setProcessingStatus);
      } else if (platformId === 'github') {
        return await service.searchRepositories(query);
      } else if (platformId === 'notion') {
        return await service.searchPages(query);
      } else if (platformId === 'canva') {
        return await service.searchDesigns(query);
      } else {
        return await service.searchFiles(query);
      }
    } catch (error) {
      console.error(`Error searching ${platformId}:`, error);
      throw error;
    }
  }

  // Get human-readable platform name
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
