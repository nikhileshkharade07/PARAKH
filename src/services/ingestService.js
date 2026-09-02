import { api } from "./api";

/**
 * @typedef {Object} IngestionResponse
 * @property {boolean} success - Whether ingestion completed
 * @property {string} filename - Processed file name
 * @property {number} total_uploaded - Total rows detected
 * @property {number} valid_records - Successfully validated and saved records
 * @property {number} invalid_records - Malformed or failed records
 * @property {number} duplicates - Skipped duplicate contracts
 * @property {number} analyzed - Contracts analyzed with ML anomaly scores
 * @property {string} message - Status summary
 * @property {Array} errors - Detailed validation errors
 */

export const ingestService = {
  /**
   * Upload and ingest procurement dataset file (CSV, XLSX, XLS, or JSON).
   * @param {File} file - Dataset file
   * @param {Function} [onUploadProgress] - Optional progress callback
   * @returns {Promise<IngestionResponse>}
   */
  async uploadDataset(file, onUploadProgress = null) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/ingest/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted, progressEvent);
        }
      },
    });
    return response.data;
  },

  /**
   * Download sample CSV ingestion template.
   * @returns {Promise<string>} Plain CSV template text
   */
  async getTemplate() {
    const response = await api.get("/ingest/template", {
      responseType: "text",
    });
    return response.data;
  },
};

export default ingestService;
