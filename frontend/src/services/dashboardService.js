import { api } from "./api";

/**
 * @typedef {Object} DepartmentStat
 * @property {string} name - Department name
 * @property {number} contract_count - Total number of awarded contracts
 * @property {number} total_value - Aggregate procurement value
 * @property {number} avg_crs - Average Composite Risk Score
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} total_contracts - Total contracts in the registry
 * @property {number} total_value - Total value across all contracts
 * @property {number} high_risk_contracts - Contracts with CRS >= 70
 * @property {number} medium_risk_contracts - Contracts with 40 <= CRS < 70
 * @property {number} low_risk_contracts - Contracts with CRS < 40
 * @property {number} average_crs - Mean Composite Risk Score
 * @property {number} active_cases - Ongoing investigation cases
 * @property {number} total_vendors - Unique registered vendors
 * @property {number} total_departments - Unique procuring departments
 * @property {DepartmentStat[]} departments - Breakdown by department
 */

export const dashboardService = {
  /**
   * Fetch aggregated system overview statistics.
   * @returns {Promise<DashboardStats>}
   */
  async getStats() {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },
};

export default dashboardService;
