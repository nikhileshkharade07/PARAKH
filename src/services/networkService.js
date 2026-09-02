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
   * Fetch vendor-department bipartite network graph with risk metrics.
   * @returns {Promise<NetworkGraphData>}
   */
  async getNetworkGraph() {
    const response = await api.get("/network");
    return response.data;
  },
};

export default networkService;
