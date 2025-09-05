// User Storage Service - Encrypted user account management
import encryptionService from './encryptionService';

class UserStorageService {
  constructor() {
    this.dbName = 'FetchItUserDB';
    this.dbVersion = 1;
    this.db = null;
    this.initialized = false;
  }

  // Initialize IndexedDB for user storage
  async initialize() {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('email', 'email', { unique: true });
          usersStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Create user sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'userId' });
          sessionsStore.createIndex('lastLogin', 'lastLogin', { unique: false });
        }
      };
    });
  }

  // Create a new user account
  async createUser(userData) {
    if (!this.initialized) await this.initialize();

    const userId = this.generateUserId();
    const hashedPassword = encryptionService.hashPassword(userData.password);
    
    const user = {
      id: userId,
      email: userData.email.toLowerCase(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      passwordHash: hashedPassword,
      plan: 'Free Plan',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      settings: {
        theme: 'dark',
        notifications: true,
        autoSync: true
      },
      connections: {},
      isActive: true
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      
      // Check if email already exists
      const emailIndex = store.index('email');
      const emailCheck = emailIndex.get(userData.email.toLowerCase());
      
      emailCheck.onsuccess = () => {
        if (emailCheck.result) {
          reject(new Error('An account with this email already exists'));
          return;
        }
        
        // Encrypt sensitive data
        const encryptedUser = this.encryptUserData(user);
        const addRequest = store.add(encryptedUser);
        
        addRequest.onsuccess = () => {
          // Create session
          this.createSession(userId);
          resolve(user);
        };
        addRequest.onerror = () => reject(addRequest.error);
      };
      
      emailCheck.onerror = () => reject(emailCheck.error);
    });
  }

  // Authenticate user login
  async authenticateUser(email, password) {
    if (!this.initialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const emailIndex = store.index('email');
      const request = emailIndex.get(email.toLowerCase());
      
      request.onsuccess = () => {
        const encryptedUser = request.result;
        if (!encryptedUser) {
          reject(new Error('No account found with this email'));
          return;
        }
        
        try {
          const user = this.decryptUserData(encryptedUser);
          const hashedPassword = encryptionService.hashPassword(password);
          
          if (user.passwordHash === hashedPassword && user.isActive) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            this.updateUser(user);
            this.createSession(user.id);
            
            // Remove sensitive data before returning
            const safeUser = { ...user };
            delete safeUser.passwordHash;
            resolve(safeUser);
          } else {
            reject(new Error('Invalid email or password'));
          }
        } catch (error) {
          reject(new Error('Failed to decrypt user data'));
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get user by ID
  async getUser(userId) {
    if (!this.initialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(userId);
      
      request.onsuccess = () => {
        const encryptedUser = request.result;
        if (!encryptedUser) {
          resolve(null);
          return;
        }
        
        try {
          const user = this.decryptUserData(encryptedUser);
          delete user.passwordHash; // Remove sensitive data
          resolve(user);
        } catch (error) {
          reject(new Error('Failed to decrypt user data'));
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Update user data
  async updateUser(userData) {
    if (!this.initialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      
      // Get current user data first
      const getRequest = store.get(userData.id);
      
      getRequest.onsuccess = () => {
        const currentEncryptedUser = getRequest.result;
        if (!currentEncryptedUser) {
          reject(new Error('User not found'));
          return;
        }
        
        try {
          const currentUser = this.decryptUserData(currentEncryptedUser);
          
          // Merge updates while preserving sensitive data
          const updatedUser = {
            ...currentUser,
            ...userData,
            id: currentUser.id, // Preserve ID
            passwordHash: currentUser.passwordHash, // Preserve password
            updatedAt: new Date().toISOString()
          };
          
          const encryptedUser = this.encryptUserData(updatedUser);
          const putRequest = store.put(encryptedUser);
          
          putRequest.onsuccess = () => {
            delete updatedUser.passwordHash;
            resolve(updatedUser);
          };
          putRequest.onerror = () => reject(putRequest.error);
          
        } catch (error) {
          reject(new Error('Failed to process user data'));
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Delete user account
  async deleteUser(userId) {
    if (!this.initialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users', 'sessions'], 'readwrite');
      const usersStore = transaction.objectStore('users');
      const sessionsStore = transaction.objectStore('sessions');
      
      // Delete user
      usersStore.delete(userId);
      
      // Delete session
      sessionsStore.delete(userId);
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Create user session
  async createSession(userId) {
    if (!this.initialized) await this.initialize();

    const session = {
      userId,
      lastLogin: new Date().toISOString(),
      sessionToken: this.generateSessionToken(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      
      const encryptedSession = encryptionService.encrypt(session);
      const request = store.put({ userId, data: encryptedSession });
      
      request.onsuccess = () => resolve(session);
      request.onerror = () => reject(request.error);
    });
  }

  // Get active session
  async getSession(userId) {
    if (!this.initialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.get(userId);
      
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        
        try {
          const session = encryptionService.decrypt(result.data);
          
          // Check if session is expired
          if (new Date() > new Date(session.expiresAt)) {
            this.deleteSession(userId);
            resolve(null);
            return;
          }
          
          resolve(session);
        } catch (error) {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Delete session (logout)
  async deleteSession(userId) {
    if (!this.initialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.delete(userId);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Encrypt user data
  encryptUserData(user) {
    const sensitiveFields = ['firstName', 'lastName', 'email', 'passwordHash', 'settings', 'connections'];
    const encryptedUser = { ...user };
    
    sensitiveFields.forEach(field => {
      if (user[field]) {
        encryptedUser[field] = encryptionService.encrypt(user[field]);
      }
    });
    
    return encryptedUser;
  }

  // Decrypt user data
  decryptUserData(encryptedUser) {
    const sensitiveFields = ['firstName', 'lastName', 'email', 'passwordHash', 'settings', 'connections'];
    const user = { ...encryptedUser };
    
    sensitiveFields.forEach(field => {
      if (encryptedUser[field] && typeof encryptedUser[field] === 'string') {
        try {
          user[field] = encryptionService.decrypt(encryptedUser[field]);
        } catch (error) {
          console.warn(`Failed to decrypt field ${field}:`, error);
        }
      }
    });
    
    return user;
  }

  // Generate unique user ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate session token
  generateSessionToken() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
  }

  // Get all users (admin function)
  async getAllUsers() {
    if (!this.initialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const encryptedUsers = request.result;
        const users = encryptedUsers.map(encryptedUser => {
          try {
            const user = this.decryptUserData(encryptedUser);
            delete user.passwordHash; // Remove sensitive data
            return user;
          } catch (error) {
            return null;
          }
        }).filter(user => user !== null);
        
        resolve(users);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Check if service is available
  isAvailable() {
    return this.initialized && this.db;
  }

  // Clear all data (for development/testing)
  async clearAllData() {
    if (!this.initialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users', 'sessions'], 'readwrite');
      
      transaction.objectStore('users').clear();
      transaction.objectStore('sessions').clear();
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Create singleton instance
const userStorageService = new UserStorageService();
export default userStorageService;
