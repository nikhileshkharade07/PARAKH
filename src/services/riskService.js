import { api } from "./api";

/**
 * @typedef {Object} RiskFlagResult
 * @property {string} flag_id
 * @property {boolean} detected
 * @property {string} severity
 * @property {number} score
 * @property {string} explanation
 */

/**
 * @typedef {Object} ContractRiskData
 * @property {number} crs - Composite Risk Score (0-100)
 * @property {number} rule_score - Heuristic rule component score
 * @property {number} anomaly_score - Isolation Forest ML anomaly score
 * @property {"high"|"medium"|"low"|"unknown"} risk_level
 * @property {RiskFlagResult[]} flags
 */

export const riskService = {
  /**
   * Retrieve risk assessment score and flags for a contract.
   * @param {number|string} contractId
   * @returns {Promise<ContractRiskData>}
   */
  async getRisk(contractId) {
    const response = await api.get(`/risk/${contractId}`);
    return response.data;
  },

  /**
   * Trigger on-demand risk analysis & red flag re-evaluation for a contract.
   * @param {number|string} contractId
   * @returns {Promise<Object>}
   */
  async analyzeContractRisk(contractId) {
    const response = await api.post("/risk/analyze", null, {
      params: { contract_id: contractId },
    });
    return response.data;
  },
};

export default riskService;
