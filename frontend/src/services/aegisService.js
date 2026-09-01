import { api } from "./api";

/**
 * Service for Aegis Zero-Human-Discretion Procurement Engine endpoints.
 */
export const aegisService = {
  /**
   * Get ecosystem stats and transparency KPIs.
   * @returns {Promise<Object>}
   */
  async getStats() {
    const response = await api.get("/aegis/stats");
    return response.data;
  },

  /**
   * List OCDS tenders.
   * @param {string} [pillar]
   * @returns {Promise<Array>}
   */
  async getTenders(pillar) {
    const response = await api.get("/aegis/tenders", { params: { pillar } });
    return response.data;
  },

  /**
   * Get tender details by OCID.
   * @param {string} ocid
   * @returns {Promise<Object>}
   */
  async getTender(ocid) {
    const response = await api.get(`/aegis/tenders/${ocid}`);
    return response.data;
  },

  /**
   * Export full OCDS 1.1 JSON release package.
   * @param {string} ocid
   * @returns {Promise<Object>}
   */
  async exportOcdsPackage(ocid) {
    const response = await api.get(`/aegis/ocds/${ocid}/export`);
    return response.data;
  },

  /**
   * Submit blind zk-SNARK commitment bid.
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async submitZkBid(payload) {
    const response = await api.post("/aegis/zk/commit", payload);
    return response.data;
  },

  /**
   * List cryptographic zk-bid commitments.
   * @param {string} [tenderOcid]
   * @returns {Promise<Array>}
   */
  async getZkCommitments(tenderOcid) {
    const response = await api.get("/aegis/zk/commitments", {
      params: { tender_ocid: tenderOcid },
    });
    return response.data;
  },

  /**
   * Run deterministic algorithmic technical evaluation.
   * @param {string} tenderOcid
   * @returns {Promise<Object>}
   */
  async runAlgorithmicEvaluation(tenderOcid) {
    const response = await api.post("/aegis/algorithmic/evaluate", null, {
      params: { tender_ocid: tenderOcid },
    });
    return response.data;
  },

  /**
   * Fetch UBO & shell company graph forensics.
   * @returns {Promise<Object>}
   */
  async getUboGraph() {
    const response = await api.get("/aegis/ubo/graph");
    return response.data;
  },

  /**
   * Trace beneficial owners for a target company.
   * @param {string} companyId
   * @returns {Promise<Object>}
   */
  async traceUbos(companyId) {
    const response = await api.post("/aegis/ubo/trace-beneficial-owners", null, {
      params: { company_id: companyId },
    });
    return response.data;
  },

  /**
   * Get tender milestone escrow schedule.
   * @param {string} ocid
   * @returns {Promise<Object>}
   */
  async getMilestones(ocid) {
    const response = await api.get(`/aegis/escrow/milestones/${ocid}`);
    return response.data;
  },

  /**
   * Ingest SAR satellite radar backscatter and LIDAR telemetry.
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async ingestSatelliteTelemetry(payload) {
    const response = await api.post("/aegis/escrow/ingest-satellite-telemetry", payload);
    return response.data;
  },

  /**
   * Ingest IoT weighbridge gross/tare sensor telemetry.
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async ingestIotTelemetry(payload) {
    const response = await api.post("/aegis/escrow/ingest-iot-telemetry", payload);
    return response.data;
  },

  /**
   * Trigger verified smart escrow payout.
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async triggerSmartEscrowRelease(payload) {
    const response = await api.post("/aegis/escrow/trigger-release", payload);
    return response.data;
  },

  /**
   * Get live simulated sensor stream (weighbridge & SAR satellite).
   * @returns {Promise<Object>}
   */
  async getLiveSensorStream() {
    const response = await api.get("/aegis/telemetry/live-sensor-stream");
    return response.data;
  },
};

export default aegisService;
