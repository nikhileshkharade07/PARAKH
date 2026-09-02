import { api } from "./api";

/**
 * @typedef {Object} AuditLog
 * @property {number} id
 * @property {string} timestamp
 * @property {number|null} user_id
 * @property {string} username
 * @property {string} role
 * @property {string} action
 * @property {string} resource_type
 * @property {string} resource_id
 * @property {string} details
 * @property {string} ip_address
 * @property {string} result
 */

/**
 * @typedef {Object} AuditQueryParams
 * @property {string} [action] - Filter by action (e.g. LOGIN, INGEST_DATA, CREATE_CASE)
 * @property {string} [username] - Search by username
 * @property {string} [resource_type] - Filter by resource type (e.g. CONTRACT, CASE)
 * @property {number} [limit=50]
 * @property {number} [offset=0]
 */

export const auditService = {
  /**
   * Retrieve immutable system audit log entries.
   * @param {AuditQueryParams} [params={}]
   * @returns {Promise<AuditLog[]>}
   */
  async getAuditLogs(params = {}) {
    const response = await api.get("/audit", { params });
    return response.data;
  },
};

export default auditService;
