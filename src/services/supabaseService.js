// Supabase Service - Handles user management, file metadata, and cloud sync
import { createClient } from '@supabase/supabase-js';

class SupabaseService {
  constructor() {
    this.supabase = null;
    this.isInitialized = false;
    this.initialize();
  }

  // Initialize Supabase client
  async initialize() {
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials missing. Cloud sync will be disabled.');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.isInitialized = true;
      console.log('Supabase service initialized');

    } catch (error) {
      console.error('Error initializing Supabase service:', error);
      this.isInitialized = false;
    }
  }

  // Check if service is available
  isAvailable() {
    return this.isInitialized && this.supabase;
  }

  // User Management
  async signUp(email, password) {
    if (!this.isAvailable()) return { error: 'Service not available' };
    
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: email,
        password: password
      });
      return { data, error };
    } catch (error) {
      return { error: error.message };
    }
  }

  async signIn(email, password) {
    if (!this.isAvailable()) return { error: 'Service not available' };
    
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      return { data, error };
    } catch (error) {
      return { error: error.message };
    }
  }

  async signOut() {
    if (!this.isAvailable()) return { error: 'Service not available' };
    
    try {
      const { error } = await this.supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error.message };
    }
  }

  // File Metadata Management
  async saveFileMetadata(fileId, metadata) {
    if (!this.isAvailable()) return false;
    
    try {
      const { error } = await this.supabase
        .from('file_metadata')
        .upsert({
          file_id: fileId,
          file_name: metadata.fileName,
          platform: metadata.platform,
          file_type: metadata.fileType,
          file_size: metadata.fileSize,
          upload_date: new Date().toISOString(),
          user_id: (await this.supabase.auth.getUser()).data.user?.id,
          web_view_link: metadata.webViewLink,
          tags: metadata.tags || []
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving file metadata:', error);
      return false;
    }
  }

  // Conversation History Management
  async saveConversation(conversation) {
    if (!this.isAvailable()) return false;
    
    try {
      const { error } = await this.supabase
        .from('conversations')
        .upsert({
          conversation_id: conversation.id,
          title: conversation.title,
          messages: conversation.messages,
          created_at: conversation.createdAt,
          updated_at: new Date().toISOString(),
          user_id: (await this.supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving conversation:', error);
      return false;
    }
  }

  async loadConversations() {
    if (!this.isAvailable()) return [];
    
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('user_id', (await this.supabase.auth.getUser()).data.user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  // Analytics and Usage Tracking
  async trackSearch(query, resultsCount, responseTime) {
    if (!this.isAvailable()) return false;
    
    try {
      const { error } = await this.supabase
        .from('search_analytics')
        .insert({
          query: query,
          results_count: resultsCount,
          response_time_ms: responseTime,
          timestamp: new Date().toISOString(),
          user_id: (await this.supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error tracking search:', error);
      return false;
    }
  }

  // User Preferences
  async saveUserPreferences(preferences) {
    if (!this.isAvailable()) return false;
    
    try {
      const { error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: (await this.supabase.auth.getUser()).data.user?.id,
          preferences: preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  }
}

// Create singleton instance
const supabaseService = new SupabaseService();
export default supabaseService;
