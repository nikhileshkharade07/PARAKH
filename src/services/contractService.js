import { api } from "./api";

/**
 * @typedef {Object} ContractQueryParams
 * @property {number} [department_id] - Filter by procuring department ID
 * @property {number} [vendor_id] - Filter by awarded vendor ID
 * @property {"high"|"medium"|"low"} [risk_level] - Filter by risk severity band
 * @property {string} [search] - Full-text search by contract number or title
 * @property {number} [limit=50] - Number of records to return
 * @property {number} [offset=0] - Pagination offset
 */

/**
 * @typedef {Object} RiskFlag
 * @property {string} flag_id - Risk indicator code (e.g. RF-1)
 * @property {boolean} detected - Whether this flag was triggered
 * @property {string} severity - Severity level: "high", "medium", "low"
 * @property {number} score - Contribution score
 * @property {string} explanation - Plain-language explanation
 */

/**
 * @typedef {Object} PeerComparison
 * @property {number} department_total_contracts
 * @property {number} peer_median_award_value
 * @property {number} peer_mean_award_value
 * @property {number} value_deviation_percent
 * @property {number} peer_median_tender_days
 * @property {number} duration_deviation_percent
 * @property {number} peer_average_bidders
 * @property {boolean} is_value_outlier
 * @property {boolean} is_duration_outlier
 * @property {string} explanation
 */

/**
 * @typedef {Object} ContractSummary
 * @property {number} id
 * @property {string} contract_number
 * @property {string} title
 * @property {string} contract_date
 * @property {number} department_id
 * @property {string|null} department_name
 * @property {number} vendor_id
 * @property {string|null} vendor_name
 * @property {number} estimate_value
 * @property {number} award_value
 * @property {number|null} crs
 * @property {"high"|"medium"|"low"|null} risk_level
 */

/**
 * @typedef {Object} SimilarTender
 * @property {number} contract_id
 * @property {string} contract_number
 * @property {string} title
 * @property {string} department_name
 * @property {string} vendor_name
 * @property {number} award_value
 * @property {number} similarity_score
 * @property {string[]} matched_terms
 */

/**
 * @typedef {Object} RuleEvidence
 * @property {string} rule_id
 * @property {string} rule_name
 * @property {boolean} triggered
 * @property {string} severity
 * @property {number|null} contribution
 * @property {string} explanation
 * @property {Object|null} evidence
 */

/**
 * @typedef {Object} RiskEvidence
 * @property {number} contract_id
 * @property {number} risk_score
 * @property {string} risk_level
 * @property {number} rule_score
 * @property {number} anomaly_score
 * @property {RuleEvidence[]} triggered_rules
 * @property {string} generated_at
 */

export const contractService = {
  /**
   * List contracts with optional search, risk filter, and pagination.
   * @param {ContractQueryParams} [params={}]
   * @returns {Promise<ContractSummary[]>}
   */
  async getContracts(params = {}) {
    const response = await api.get("/contracts", { params });
    return response.data;
  },

  /**
   * Get complete contract dossier with bids, risk flags, extensions, and peer comparison.
   * @param {number|string} contractId
   * @returns {Promise<Object>}
   */
  async getContract(contractId) {
    const response = await api.get(`/contracts/${contractId}`);
    return response.data;
  },

  /**
   * Search for recycled or verbatim tender specifications using TF-IDF cosine similarity.
   * @param {number|string} contractId
   * @param {number} [limit=5]
   * @returns {Promise<SimilarTender[]>}
   */
  async getSimilarTenders(contractId, limit = 5) {
    const response = await api.get(`/contracts/${contractId}/similar-tenders`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Retrieve granular forensic risk evidence and red-flag explanations.
   * @param {number|string} contractId
   * @returns {Promise<RiskEvidence>}
   */
  async getRiskEvidence(contractId) {
    const response = await api.get(`/contracts/${contractId}/risk-evidence`);
    return response.data;
  },
};

export default contractService;
