export interface SavePayload {
  prefix: string;
  year: string;
  userId: string;
  piId: string;
  activityId: string;
  monthIdx: number;
  value: number;
  filesJson?: string;
  activityName?: string;
  indicatorName?: string;
  piTitle?: string;
}

const API_BASE = 'https://odtd.site/api';

/**
 * Optimized fetch utility designed to bypass LiteSpeed/Hostinger CORS blocks.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 2, backoff = 500): Promise<Response> {
  const fetchOptions: RequestInit = {
    ...options,
    mode: 'cors',
    credentials: 'omit', 
    headers: {
      ...options.headers,
    }
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    if (response.status === 500) {
      throw new Error('SERVER_LOGIC_CRASH_500');
    }

    if ((response.status === 502 || response.status === 504) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
    }
    
    return response;
  } catch (error: any) {
    if (error.name === 'TypeError') {
      const isOnline = await dbService.ping();
      console.error("CRITICAL: CORS Handshake Refused.");
      if (isOnline) {
        console.warn("DIAGNOSTIC: Server is reachable but the browser blocked the handshake.");
      } else {
        console.warn("DIAGNOSTIC: Server is unreachable.");
      }
      throw new Error('FETCH_BLOCKED_BY_BROWSER');
    }
    throw error;
  }
}

export const dbService = {
  getApiBaseUrl() {
    return API_BASE;
  },

  async ping(): Promise<boolean> {
    try {
      const url = `${API_BASE}/get_data.php?ping=1&t=${Date.now()}`;
      await fetch(url, { mode: 'no-cors', cache: 'no-store' });
      return true;
    } catch (e) {
      return false;
    }
  },

  async setupDatabase() {
    try {
      const url = `${API_BASE}/setup_db.php?cb=${Date.now()}`;
      const response = await fetchWithRetry(url, { method: 'GET' });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      return await response.json();
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  },

  async fetchUnitData(prefix: string, year: string, userId: string) {
    try {
      const url = `${API_BASE}/get_data.php?prefix=${prefix}&year=${year}&userId=${userId}&v=${Date.now()}`;
      const response = await fetchWithRetry(url, { method: 'GET', cache: 'no-store' });
      
      if (!response.ok) {
        if (response.status === 500) throw new Error('SERVER_LOGIC_CRASH_500');
        throw new Error(`HTTP_${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      throw error;
    }
  },

  async saveActivityValue(payload: SavePayload) {
    try {
      const response = await fetchWithRetry(`${API_BASE}/save_cell.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
         if (response.status === 500) throw new Error('SERVER_LOGIC_CRASH_500');
         return false;
      }
      return true;
    } catch (error: any) {
      return false;
    }
  },

  /**
   * Concurrently stores files on Hostinger and synchronizes with Google Drive storage.
   */
  async uploadFileToServer(file: File, metadata: { userId: string; type: string }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', metadata.userId);
    formData.append('type', metadata.type);

    try {
      const hostingerPromise = fetchWithRetry(`${API_BASE}/upload.php`, {
        method: 'POST',
        body: formData,
      });

      const gDrivePromise = fetchWithRetry(`${API_BASE}/upload_gdrive.php`, {
        method: 'POST',
        body: formData,
      });

      const [hResult, gResult] = await Promise.allSettled([hostingerPromise, gDrivePromise]);

      if (hResult.status === 'fulfilled' && hResult.value.ok) {
        const result = await hResult.value.json();
        
        if (gResult.status === 'fulfilled' && gResult.value.ok) {
          console.debug('Multi-Cloud Storage: Sync completed.');
        } else {
          console.warn('Multi-Cloud Storage: Google Drive sync failed.');
        }

        return result.fileUrl; 
      }
      return null;
    } catch (error: any) {
      console.error('Unified Storage Fault:', error);
      return null;
    }
  }
};