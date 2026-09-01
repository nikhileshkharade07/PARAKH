import { api } from "./api";

/**
 * @typedef {Object} DepartmentSimple
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {Object} DepartmentProfile
 * @property {number} id
 * @property {string} name
 * @property {number} total_contracts
 * @property {number} total_value
 * @property {number} average_crs
 * @property {number} high_risk_contracts
 * @property {number} medium_risk_contracts
 * @property {number} low_risk_contracts
 * @property {Array} [contracts]
 * @property {Array} [vendors]
 */

export const departmentService = {
  /**
   * List all procuring departments.
   * @returns {Promise<DepartmentSimple[]>}
   */
  async getDepartments() {
    const response = await api.get("/departments");
    return response.data;
  },

  /**
   * Get detailed department profile and procurement analytics.
   * @param {number|string} departmentId
   * @returns {Promise<DepartmentProfile>}
   */
  async getDepartment(departmentId) {
    const response = await api.get(`/departments/${departmentId}`);
    return response.data;
  },
};

export default departmentService;
