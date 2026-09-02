import { api } from "./api";

export const searchService = {
  /**
   * Omni-search across contracts, vendors, departments, and cases.
   * @param {string} query - Search term
   * @param {number} [limit=10] - Max items per category
   * @returns {Promise<{ query: string, total: number, results: { contracts: Array, vendors: Array, departments: Array, cases: Array } }>}
   */
  async search(query, limit = 10) {
    if (!query || !query.trim()) {
      return { query: "", total: 0, results: { contracts: [], vendors: [], departments: [], cases: [] } };
    }
    const response = await api.get(`/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`);
    return response.data;
  }
};

export default searchService;
