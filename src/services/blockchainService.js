import { api } from "./api";

/**
 * @typedef {Object} BlockchainAnchorResult
 * @property {boolean} enabled - Whether live blockchain broadcasting is active
 * @property {string} mode - "PRODUCTION" or "DEMO_FALLBACK"
 * @property {boolean} recorded - Whether anchor was saved
 * @property {string} contract_id - Contract number
 * @property {number} crs - Anchored CRS score
 * @property {number} flags_count - Number of anchored risk flags
 * @property {string} canonical_hash - SHA-256 canonical contract dossier hash
 * @property {string} tx_hash - Blockchain transaction hash
 * @property {number} block_number - Block height
 * @property {string} contract_address - Smart contract address
 * @property {string} network - Network name (e.g. Ethereum Sepolia)
 * @property {string} timestamp - Anchor timestamp
 * @property {string} status - Anchor status
 * @property {string} message - Plain language confirmation
 */

/**
 * @typedef {Object} BlockchainVerificationResult
 * @property {boolean} verified - True if database record matches on-chain hash
 * @property {string} status - "INTEGRITY VERIFIED" or "INTEGRITY COMPROMISED"
 * @property {string} contract_number
 * @property {string} current_hash - Current recalculation of canonical SHA-256 hash
 * @property {string} anchored_hash - Hash stored during initial ledger anchoring
 * @property {string} tx_hash
 * @property {number} block_number
 * @property {string} network
 * @property {string} contract_address
 * @property {string} anchored_at
 * @property {string} verified_at
 * @property {string} mode
 * @property {string} message
 */

export const blockchainService = {
  /**
   * Cryptographically anchor a contract risk dossier to the immutable ledger.
   * @param {string|number} contractId
   * @param {Object} [payload={}]
   * @returns {Promise<BlockchainAnchorResult>}
   */
  async anchorContract(contractId, payload = {}) {
    const response = await api.post("/blockchain/record", {
      contract_id: String(contractId),
      ...payload,
    });
    return response.data;
  },

  /**
   * Verify database integrity by comparing live hash against ledger anchor.
   * @param {string|number} contractId
   * @returns {Promise<BlockchainVerificationResult>}
   */
  async verifyIntegrity(contractId) {
    const response = await api.post("/blockchain/verify", {
      contract_id: String(contractId),
    });
    return response.data;
  },
};

export default blockchainService;
