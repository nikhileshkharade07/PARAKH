/**
 * Centralized API Service Layer for PARAKH Intelligence Platform.
 * All frontend requests route through these typed, modular service clients.
 */

export { api, formatApiError } from "./api";
export { dashboardService } from "./dashboardService";
export { contractService } from "./contractService";
export { vendorService } from "./vendorService";
export { departmentService } from "./departmentService";
export { riskService } from "./riskService";
export { nlpService } from "./nlpService";
export { networkService } from "./networkService";
export { caseService } from "./caseService";
export { ingestService } from "./ingestService";
export { blockchainService } from "./blockchainService";
export { auditService } from "./auditService";
export { assistantService } from "./assistantService";
export { authService } from "./authService";
export { aegisService } from "./aegisService";
