// Storage Service - Handles persistent vs session storage based on user mode
class StorageService {
  constructor() {
    this.isGuestMode = false;
    this.sessionData = new Map();
  }

  // Set guest mode - affects all storage operations
  setGuestMode(enabled) {
    this.isGuestMode = enabled;
    console.log(`Storage mode: ${enabled ? 'Guest (session only)' : 'Persistent'}`);
    
    if (enabled) {
      // Clear any existing persistent data when entering guest mode
      this.clearPersistentData();
    }
  }

  // Get item from appropriate storage
  getItem(key) {
    if (this.isGuestMode) {
      return this.sessionData.get(key) || null;
    }
    return localStorage.getItem(key);
  }

  // Set item in appropriate storage
  setItem(key, value) {
    if (this.isGuestMode) {
      this.sessionData.set(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  }

  // Remove item from appropriate storage
  removeItem(key) {
    if (this.isGuestMode) {
      this.sessionData.delete(key);
    } else {
      localStorage.removeItem(key);
    }
  }

  // Clear all data from appropriate storage
  clear() {
    if (this.isGuestMode) {
      this.sessionData.clear();
    } else {
      localStorage.clear();
    }
  }

  // Get all keys from appropriate storage
  getAllKeys() {
    if (this.isGuestMode) {
      return Array.from(this.sessionData.keys());
    }
    return Object.keys(localStorage);
  }

  // Check if key exists in appropriate storage
  hasItem(key) {
    if (this.isGuestMode) {
      return this.sessionData.has(key);
    }
    return localStorage.getItem(key) !== null;
  }

  // Clear persistent data (used when switching to guest mode)
  clearPersistentData() {
    const keysToPreserve = [
      // Preserve API keys and app configuration
      'fetchit_app_config',
      'fetchit_api_keys'
    ];
    
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Cleared persistent data for guest mode');
  }

  // Get storage info for debugging
  getStorageInfo() {
    return {
      mode: this.isGuestMode ? 'guest' : 'persistent',
      sessionItems: this.sessionData.size,
      localStorageItems: Object.keys(localStorage).length,
      isGuestMode: this.isGuestMode
    };
  }

  // Migrate from session to persistent (when user creates account)
  migrateToPersistent() {
    if (!this.isGuestMode) return;

    console.log('Migrating session data to persistent storage...');
    
    // Copy session data to localStorage
    for (const [key, value] of this.sessionData) {
      localStorage.setItem(key, value);
    }
    
    // Switch to persistent mode
    this.isGuestMode = false;
    this.sessionData.clear();
    
    console.log('Migration to persistent storage complete');
  }

  // Export session data (for account creation)
  exportSessionData() {
    if (!this.isGuestMode) return {};
    
    const data = {};
    for (const [key, value] of this.sessionData) {
      data[key] = value;
    }
    return data;
  }

  // Import data into session (for guest mode initialization)
  importSessionData(data) {
    if (!this.isGuestMode) return;
    
    Object.entries(data).forEach(([key, value]) => {
      this.sessionData.set(key, value);
    });
  }
}

// Create singleton instance
const storageService = new StorageService();
export default storageService;
