import encryptionService from './encryptionService';

class SecureStorageService {
  constructor() {
    this.storagePrefix = 'fetchit_secure_';
  }

  // Store data with encryption and integrity check
  store(key, data) {
    try {
      const timestamp = Date.now();
      const dataWithMeta = {
        data,
        timestamp,
        version: '1.0'
      };

      const encrypted = encryptionService.encrypt(dataWithMeta);
      const checksum = encryptionService.generateChecksum(dataWithMeta);
      
      const storageData = {
        encrypted,
        checksum
      };

      localStorage.setItem(`${this.storagePrefix}${key}`, JSON.stringify(storageData));
      return true;
    } catch (error) {
      console.error('Secure storage failed:', error);
      return false;
    }
  }

  // Retrieve and decrypt data with integrity verification
  retrieve(key) {
    try {
      const storageData = localStorage.getItem(`${this.storagePrefix}${key}`);
      if (!storageData) return null;

      const { encrypted, checksum } = JSON.parse(storageData);
      const decrypted = encryptionService.decrypt(encrypted);

      // Verify data integrity
      if (!encryptionService.verifyChecksum(decrypted, checksum)) {
        console.warn('Data integrity check failed for key:', key);
        this.remove(key); // Remove corrupted data
        return null;
      }

      return decrypted.data;
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      return null;
    }
  }

  // Remove stored data
  remove(key) {
    try {
      localStorage.removeItem(`${this.storagePrefix}${key}`);
      return true;
    } catch (error) {
      console.error('Secure removal failed:', error);
      return false;
    }
  }

  // List all secure storage keys
  listKeys() {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.storagePrefix))
        .map(key => key.replace(this.storagePrefix, ''));
    } catch (error) {
      console.error('Failed to list keys:', error);
      return [];
    }
  }

  // Clear all secure storage
  clearAll() {
    try {
      const keys = this.listKeys();
      keys.forEach(key => this.remove(key));
      return true;
    } catch (error) {
      console.error('Failed to clear all secure storage:', error);
      return false;
    }
  }

  // Check if data exists
  exists(key) {
    return localStorage.getItem(`${this.storagePrefix}${key}`) !== null;
  }

  // Get storage size for a key
  getSize(key) {
    try {
      const data = localStorage.getItem(`${this.storagePrefix}${key}`);
      return data ? new Blob([data]).size : 0;
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return 0;
    }
  }

  // Get total secure storage size
  getTotalSize() {
    try {
      const keys = this.listKeys();
      return keys.reduce((total, key) => total + this.getSize(key), 0);
    } catch (error) {
      console.error('Failed to get total storage size:', error);
      return 0;
    }
  }
}

// Export singleton instance
const secureStorageService = new SecureStorageService();
export default secureStorageService;
