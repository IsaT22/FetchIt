import CryptoJS from 'crypto-js';

class EncryptionService {
  constructor() {
    this.secretKey = this.generateOrGetSecretKey();
  }

  // Generate or retrieve a secret key for encryption
  generateOrGetSecretKey() {
    let key = localStorage.getItem('fetchit_secret_key');
    if (!key) {
      // Generate a new 256-bit key
      key = CryptoJS.lib.WordArray.random(256/8).toString();
      localStorage.setItem('fetchit_secret_key', key);
    }
    return key;
  }

  // Encrypt sensitive data
  encrypt(data) {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.secretKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData) {
    try {
      // Handle empty or invalid data
      if (!encryptedData || encryptedData.trim() === '') {
        throw new Error('No data to decrypt');
      }
      
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      // Check if decryption resulted in empty string
      if (!decrypted || decrypted.trim() === '') {
        throw new Error('Decryption resulted in empty data');
      }
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.warn('Decryption failed:', error.message);
      throw new Error('Failed to decrypt data');
    }
  }

  // Securely store credentials
  storeCredentials(platformId, credentials) {
    try {
      const encryptedCredentials = this.encrypt(credentials);
      const storageKey = `fetchit_creds_${platformId}`;
      localStorage.setItem(storageKey, encryptedCredentials);
      return true;
    } catch (error) {
      console.error('Failed to store credentials:', error);
      return false;
    }
  }

  // Retrieve and decrypt credentials
  getCredentials(platformId) {
    try {
      const storageKey = `fetchit_creds_${platformId}`;
      const encryptedCredentials = localStorage.getItem(storageKey);
      
      if (!encryptedCredentials) {
        return null;
      }

      return this.decrypt(encryptedCredentials);
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  // Remove stored credentials
  removeCredentials(platformId) {
    try {
      const storageKey = `fetchit_creds_${platformId}`;
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('Failed to remove credentials:', error);
      return false;
    }
  }

  // Clear all stored credentials (for logout/reset)
  clearAllCredentials() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('fetchit_creds_')) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      return false;
    }
  }

  // Add data expiration for security
  storeWithExpiration(key, data, expirationHours = 24) {
    try {
      const expirationTime = Date.now() + (expirationHours * 60 * 60 * 1000);
      const dataWithExpiration = {
        data: data,
        expiration: expirationTime
      };
      const encrypted = this.encrypt(dataWithExpiration);
      localStorage.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error('Failed to store data with expiration:', error);
      return false;
    }
  }

  // Retrieve data with expiration check
  getWithExpiration(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const dataWithExpiration = this.decrypt(encrypted);
      
      // Check if data has expired
      if (Date.now() > dataWithExpiration.expiration) {
        localStorage.removeItem(key);
        return null;
      }

      return dataWithExpiration.data;
    } catch (error) {
      console.error('Failed to retrieve data with expiration:', error);
      localStorage.removeItem(key); // Remove corrupted data
      return null;
    }
  }

  // Clean up expired data
  cleanupExpiredData() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('fetchit_')) {
          try {
            const encrypted = localStorage.getItem(key);
            if (encrypted && encrypted.length > 100) { // Likely encrypted data
              const data = this.decrypt(encrypted);
              if (data.expiration && Date.now() > data.expiration) {
                localStorage.removeItem(key);
                console.log(`Removed expired data: ${key}`);
              }
            }
          } catch (error) {
            // Skip non-encrypted or corrupted data
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  // Generate secure hash for password verification
  hashPassword(password) {
    return CryptoJS.SHA256(password).toString();
  }

  // Validate data integrity
  generateChecksum(data) {
    return CryptoJS.MD5(JSON.stringify(data)).toString();
  }

  // Verify data integrity
  verifyChecksum(data, expectedChecksum) {
    const actualChecksum = this.generateChecksum(data);
    return actualChecksum === expectedChecksum;
  }
}

// Export singleton instance
const encryptionService = new EncryptionService();
export default encryptionService;
