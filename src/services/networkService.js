import { api } from "./api";

/**
 * @typedef {Object} NetworkNodeData
 * @property {string} id - Unique node identifier (e.g. vendor-1, department-2)
 * @property {string} label - Node display label
 * @property {"vendor"|"department"} type - Entity type
 * @property {number} contract_count - Total contracts
 * @property {number} total_value - Total aggregate contract value
 * @property {number} average_crs - Average risk score
 */

/**
 * @typedef {Object} NetworkNode
 * @property {NetworkNodeData} data
 */

/**
 * @typedef {Object} NetworkEdgeData
 * @property {string} id - Edge identifier (e.g. edge-1-2)
 * @property {string} source - Source vendor node ID
 * @property {string} target - Target department node ID
 * @property {number} contract_count - Number of contracts between pair
 * @property {number} total_value - Total value of transactions
 * @property {number} average_crs - Average CRS of contracts
 */

/**
 * @typedef {Object} NetworkEdge
 * @property {NetworkEdgeData} data
 */

/**
 * @typedef {Object} NetworkGraphData
 * @property {NetworkNode[]} nodes
 * @property {NetworkEdge[]} edges
 */

export const networkService = {
  /**
   * Fetch multi-mode network graph with risk metrics.
   * @param {Object} [options]
   * @param {string} [options.graph_type]
   * @param {number} [options.contract_id]
   * @param {boolean} [options.high_risk_only]
   * @param {number} [options.limit]
   * @returns {Promise<NetworkGraphData>}
   */
  async getNetworkGraph(options = {}) {
    const params = new URLSearchParams();
    if (options.graph_type) params.append("graph_type", options.graph_type);
    if (options.contract_id) params.append("contract_id", options.contract_id);
    if (options.high_risk_only) params.append("high_risk_only", "true");
    if (options.limit) params.append("limit", String(options.limit));

    const qs = params.toString();
    const url = qs ? `/network?${qs}` : "/network";
    const response = await api.get(url);
    return response.data;
  },
  async getNetwork(options = {}) {
    return this.getNetworkGraph(options);
  }
};

export default networkService;
