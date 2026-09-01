import { api } from "./api";

/**
 * @typedef {Object} UserProfile
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} full_name
 * @property {string} role - "ADMIN"|"AUDITOR"|"INVESTIGATOR"|"DEPARTMENT_OFFICER"
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} access_token - JWT Bearer Token
 * @property {string} token_type - "bearer"
 * @property {UserProfile} user - Authenticated user profile
 */

export const authService = {
  /**
   * Authenticate user with username and password.
   * Automatically saves token to localStorage on success.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<LoginResponse>}
   */
  async login(username, password) {
    const response = await api.post("/auth/login", { username, password });
    if (response.data?.access_token) {
      localStorage.setItem("parakh_token", response.data.access_token);
      localStorage.setItem("parakh_user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Fetch current authenticated user profile.
   * @returns {Promise<UserProfile>}
   */
  async getMe() {
    const response = await api.get("/auth/me");
    return response.data;
  },

  /**
   * Log out user and clear stored token.
   */
  logout() {
    localStorage.removeItem("parakh_token");
    localStorage.removeItem("parakh_user");
    localStorage.removeItem("token");
  },

  /**
   * Get cached user profile from localStorage.
   * @returns {UserProfile|null}
   */
  getCachedUser() {
    try {
      const stored = localStorage.getItem("parakh_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if an active authentication token exists.
   * @returns {boolean}
   */
  isAuthenticated() {
    return Boolean(localStorage.getItem("parakh_token") || localStorage.getItem("token"));
  },

  /**
   * List system users.
   * @returns {Promise<UserProfile[]>}
   */
  async getUsers() {
    const response = await api.get("/auth/users");
    return response.data;
  },

  /**
   * Seed standard demo accounts (admin, auditor, investigator, officer).
   * @returns {Promise<Object>}
   */
  async seedUsers() {
    const response = await api.post("/auth/seed-users");
    return response.data;
  },
};

export default authService;
