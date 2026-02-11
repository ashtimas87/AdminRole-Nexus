
export interface SyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
  data?: any;
}

/**
 * DatabaseService handles communication with a remote backend (e.g., hosted on Hostinger).
 * Since browser JS cannot connect to MySQL directly, this service communicates with a 
 * PHP or Node.js bridge that you upload to your Hostinger server.
 */
export const DatabaseService = {
  getSettings: () => {
    const saved = localStorage.getItem('db_connection_settings');
    return saved ? JSON.parse(saved) : { endpoint: '', token: '', autoSync: false };
  },

  saveSettings: (settings: { endpoint: string; token: string; autoSync: boolean }) => {
    localStorage.setItem('db_connection_settings', JSON.stringify(settings));
  },

  /**
   * Pushes the entire local storage state to the remote database
   */
  async pushToRemote(): Promise<SyncResult> {
    const { endpoint, token } = this.getSettings();
    if (!endpoint) return { success: false, message: 'No API endpoint configured.' };

    try {
      // Gather all application data from localStorage
      const payload: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('accomplishment_') || key.includes('target_') || key.includes('superadmin_'))) {
          payload[key] = localStorage.getItem(key) || '';
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'sync_push', data: payload })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const timestamp = new Date().toLocaleString();
      localStorage.setItem('db_last_sync_out', timestamp);
      return { success: true, message: 'Successfully synced to Hostinger database.', timestamp };
    } catch (error: any) {
      console.error('Push Error:', error);
      return { success: false, message: error.message || 'Connection failed.' };
    }
  },

  /**
   * Pulls data from the remote database and merges it into local storage
   */
  async pullFromRemote(): Promise<SyncResult> {
    const { endpoint, token } = this.getSettings();
    if (!endpoint) return { success: false, message: 'No API endpoint configured.' };

    try {
      const response = await fetch(`${endpoint}?action=sync_pull`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();

      if (result.data) {
        Object.entries(result.data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
        const timestamp = new Date().toLocaleString();
        localStorage.setItem('db_last_sync_in', timestamp);
        return { success: true, message: 'Data restored from Hostinger.', timestamp };
      }
      
      return { success: false, message: 'No remote data found.' };
    } catch (error: any) {
      console.error('Pull Error:', error);
      return { success: false, message: error.message || 'Connection failed.' };
    }
  },

  async checkConnection(): Promise<boolean> {
    const { endpoint, token } = this.getSettings();
    if (!endpoint) return false;
    try {
      const response = await fetch(`${endpoint}?action=ping`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};
