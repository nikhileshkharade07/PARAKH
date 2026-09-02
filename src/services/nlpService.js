import { api } from "./api";

/**
 * @typedef {Object} NLPSimilarityRequest
 * @property {string} specification - Tender specification text
 * @property {string} vendor_description - Vendor catalog or product description text
 * @property {number} [threshold=0.85] - Cosine similarity threshold for flagging
 */

/**
 * @typedef {Object} NLPSimilarityResponse
 * @property {number} similarity_score - Cosine similarity score between 0.0 and 1.0
 * @property {number} threshold - Configured flag threshold
 * @property {boolean} flagged - Whether similarity exceeded threshold
 * @property {string} explanation - Human-readable explanation
 */

export const nlpService = {
  /**
   * Perform TF-IDF specification similarity analysis against vendor catalog.
   * @param {NLPSimilarityRequest} payload
   * @returns {Promise<NLPSimilarityResponse>}
   */
  async analyzeSimilarity(payload) {
    const response = await api.post("/nlp/analyze", payload);
    return response.data;
  },
};

export default nlpService;
