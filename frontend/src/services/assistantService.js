import { api } from "./api";

/**
 * @typedef {Object} AssistantQueryResponse
 * @property {string} response - Grounded forensic answer
 * @property {Array} evidence_sources - Data sources used
 * @property {string} confidence - Confidence level
 */

export const assistantService = {
  /**
   * Query the AI investigative assistant grounded on actual database records.
   * @param {string} query - User question or query prompt
   * @param {number} [contractId] - Optional focused contract ID
   * @returns {Promise<AssistantQueryResponse>}
   */
  async queryAssistant(query, contractId = null) {
    const response = await api.post("/assistant/query", {
      query,
      contract_id: contractId,
    });
    return response.data;
  },
};

export default assistantService;
