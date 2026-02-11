
export interface SavePayload {
  prefix: string;
  year: string;
  userId: string;
  piId: string;
  activityId: string;
  monthIdx: number;
  value: number;
  activityName?: string;
  indicatorName?: string;
  piTitle?: string;
}

export const dbService = {
  /**
   * Fetches all activity data for a specific unit and year from the Hostinger MySQL database.
   * Ensures return value is always an array.
   */
  async fetchUnitData(prefix: string, year: string, userId: string) {
    try {
      const response = await fetch(`/api/get_data.php?prefix=${prefix}&year=${year}&userId=${userId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Database fetch failed, falling back to empty dataset:', error);
      return [];
    }
  },

  /**
   * Saves a single cell value and its associated labels to the permanent MySQL storage.
   */
  async saveActivityValue(payload: SavePayload) {
    try {
      const response = await fetch(`/api/save_cell.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (error) {
      console.error('Remote database save error:', error);
      return false;
    }
  },

  /**
   * Uploads physical files (Excel or MOV) to the Hostinger File Manager storage.
   */
  async uploadFileToServer(file: File, metadata: { userId: string; type: string }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', metadata.userId);
    formData.append('type', metadata.type);

    try {
      const response = await fetch(`/api/upload.php`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) return null;
      const result = await response.json();
      return result.fileUrl; // Public URL on the Hostinger server
    } catch (error) {
      console.error('Hostinger File Upload Error:', error);
      return null;
    }
  }
};
