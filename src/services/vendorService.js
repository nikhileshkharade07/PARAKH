import { api } from "./api";

/**
 * @typedef {Object} VendorSimple
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {Object} VendorYearlyTrend
 * @property {number} year
 * @property {number} contracts
 * @property {number} value
 * @property {number} avg_crs
 * @property {number} high_risk_contracts
 */

/**
 * @typedef {Object} VendorDeptBreakdown
 * @property {number} department_id
 * @property {string} department_name
 * @property {number} contract_count
 * @property {number} total_value
 * @property {number} concentration_pct
 */

/**
 * @typedef {Object} VendorProfile
 * @property {number} id
 * @property {string} name
 * @property {string} product_description
 * @property {number} total_contracts
 * @property {number} total_bids_participated
 * @property {number} win_rate
 * @property {number} total_value
 * @property {number} average_contract_value
 * @property {string[]} departments
 * @property {VendorDeptBreakdown[]} department_breakdown
 * @property {VendorYearlyTrend[]} yearly_trends
 * @property {number} total_extensions
 * @property {number} average_crs
 * @property {number} high_risk_contracts
 * @property {number} medium_risk_contracts
 * @property {number} low_risk_contracts
 */

export const vendorService = {
  /**
   * List all registered vendors.
   * @returns {Promise<VendorSimple[]>}
   */
  async getVendors() {
    const response = await api.get("/vendors");
    return response.data;
  },

  /**
   * Get vendor forensic profile with temporal win-rates, department concentration, and risk trends.
   * @param {number|string} vendorId
   * @returns {Promise<VendorProfile>}
   */
  async getVendor(vendorId) {
    const response = await api.get(`/vendors/${vendorId}`);
    return response.data;
  },
};

export default vendorService;
