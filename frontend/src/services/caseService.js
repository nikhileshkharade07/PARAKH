import { api } from "./api";

/**
 * @typedef {Object} CaseQueryParams
 * @property {string} [status] - Filter by status (NEW, UNDER_REVIEW, EVIDENCE_COLLECTION, ESCALATED, CLEARED, CONFIRMED_SUSPICIOUS, CLOSED)
 * @property {string} [priority] - Filter by priority (LOW, MEDIUM, HIGH, CRITICAL)
 * @property {number} [assigned_to_id] - Filter by investigator ID
 * @property {number} [limit=50] - Number of records
 * @property {number} [offset=0] - Offset
 */

/**
 * @typedef {Object} CaseSummary
 * @property {number} id
 * @property {string} case_number
 * @property {number} contract_id
 * @property {string} contract_number
 * @property {string} title
 * @property {string} status
 * @property {string} priority
 * @property {string} assigned_to_name
 * @property {number} crs
 * @property {string} vendor_name
 * @property {string} department_name
 * @property {number} award_value
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} CaseNote
 * @property {number} id
 * @property {number} case_id
 * @property {string} author_name
 * @property {string} content
 * @property {string} created_at
 */

/**
 * @typedef {Object} CaseEvidence
 * @property {number} id
 * @property {number} case_id
 * @property {string} title
 * @property {string} evidence_type
 * @property {string} description
 * @property {string} data_payload
 * @property {string} created_by
 * @property {string} created_at
 */

/**
 * @typedef {Object} CaseDetail
 * @property {number} id
 * @property {string} case_number
 * @property {number} contract_id
 * @property {string} contract_number
 * @property {string} title
 * @property {string} status
 * @property {string} priority
 * @property {string} assigned_to_name
 * @property {number} crs
 * @property {string} vendor_name
 * @property {string} department_name
 * @property {number} award_value
 * @property {string} notes_summary
 * @property {string} resolution_notes
 * @property {string} created_at
 * @property {string} updated_at
 * @property {CaseNote[]} notes
 * @property {CaseEvidence[]} evidence
 * @property {Array} risk_flags
 */

export const caseService = {
  /**
   * List investigation cases with filters and pagination.
   * @param {CaseQueryParams} [params={}]
   * @returns {Promise<CaseSummary[]>}
   */
  async getCases(params = {}) {
    const response = await api.get("/cases", { params });
    return response.data;
  },

  /**
   * Get full case dossier with evidence timeline and investigator notes.
   * @param {number|string} caseId
   * @returns {Promise<CaseDetail>}
   */
  async getCase(caseId) {
    const response = await api.get(`/cases/${caseId}`);
    return response.data;
  },

  /**
   * Open a new investigation case for a flagged contract.
   * @param {Object} payload
   * @param {number} payload.contract_id
   * @param {string} [payload.title]
   * @param {"LOW"|"MEDIUM"|"HIGH"|"CRITICAL"} [payload.priority="HIGH"]
   * @param {string} [payload.notes_summary]
   * @param {number} [payload.assigned_to_id]
   * @returns {Promise<CaseDetail>}
   */
  async createCase(payload) {
    const response = await api.post("/cases", payload);
    return response.data;
  },

  /**
   * Update investigation case status, priority, or resolution.
   * @param {number|string} caseId
   * @param {Object} payload
   * @param {string} [payload.status]
   * @param {string} [payload.priority]
   * @param {string} [payload.notes_summary]
   * @param {string} [payload.resolution_notes]
   * @param {number} [payload.assigned_to_id]
   * @returns {Promise<CaseDetail>}
   */
  async updateCase(caseId, payload) {
    const response = await api.patch(`/cases/${caseId}`, payload);
    return response.data;
  },

  /**
   * Add a forensic investigator note to case timeline.
   * @param {number|string} caseId
   * @param {Object} payload
   * @param {string} payload.content
   * @param {string} [payload.author_name]
   * @returns {Promise<CaseNote>}
   */
  async addNote(caseId, payload) {
    const response = await api.post(`/cases/${caseId}/notes`, payload);
    return response.data;
  },

  /**
   * Attach an evidence artifact (document, diff, network cluster) to case.
   * @param {number|string} caseId
   * @param {Object} payload
   * @param {string} payload.title
   * @param {string} [payload.evidence_type="DOCUMENT"]
   * @param {string} [payload.description]
   * @param {string} [payload.data_payload]
   * @returns {Promise<CaseEvidence>}
   */
  async addEvidence(caseId, payload) {
    const response = await api.post(`/cases/${caseId}/evidence`, payload);
    return response.data;
  },
};

export default caseService;
