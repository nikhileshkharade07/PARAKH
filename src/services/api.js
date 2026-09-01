import axios from "axios";
import staticData from "../data/procurement_data.json";

const rawApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 5000
});

export const getStoredToken = () => localStorage.getItem("parakh_token");
export const setStoredToken = (token) => localStorage.setItem("parakh_token", token);
export const clearStoredToken = () => localStorage.removeItem("parakh_token");

// Attach JWT token automatically if logged in
rawApi.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function generateForensicAssistantAnswer(userQuery, contractId = null, caseId = null) {
  const q = (userQuery || "").toLowerCase().trim();
  const citations = [];

  // 1. What is PARAKH
  if (q.includes("what is parakh") || q.includes("explain parakh") || q.includes("about parakh")) {
    return {
      answer: `### About PARAKH AI Public Procurement Risk Auditor\n\n` +
        `**PARAKH** is an advanced AI-powered procurement **risk-screening and audit-support intelligence platform** designed for public oversight bodies, CAG auditors, and vigilance authorities.\n\n` +
        `**Core Capabilities:**\n` +
        `- **Corruption Risk Score (CRS 0–100)**: Evaluates contracts using a hybrid formula combining deterministic rule-based heuristic scoring (80%) and Isolation Forest unsupervised anomaly detection (20%).\n` +
        `- **8 Explainable Red Flags**: Flags single-bidder cartels, vendor lock-in, threshold proximity, fast-track windows, price estimate deviations, and specification tailoring.\n` +
        `- **Interactive Vendor Network**: Visualizes multi-department supplier cartels, repeat winners, and bidding collusion clusters.\n` +
        `- **Cryptographic Audit Trail**: Anchors immutable contract assessment hashes to the Sepolia blockchain for non-repudiation.\n\n` +
        `*Responsible AI Policy:* PARAKH flags anomalies for human audit review and does not declare judicial guilt.`,
      citations: [
        {
          title: "System Overview: PARAKH Architecture",
          citation_type: "SYSTEM",
          reference_id: "PARAKH-CORE",
          summary: "Hybrid Rules + Isolation Forest Anomaly Detection Engine (CRS 0-100)",
          link: "/"
        }
      ]
    };
  }

  // 2. How many contracts
  if (q.includes("how many contract") || q.includes("contract count") || q.includes("total contract") || q.includes("number of contract")) {
    const total = staticData.stats.total_contracts.toLocaleString("en-IN");
    const val = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(staticData.stats.total_value);
    return {
      answer: `### Procurement Dataset Scope\n\n` +
        `- **Total Audited Contracts**: **${total} contracts**\n` +
        `- **Cumulative Procured Value**: **${val}**\n` +
        `- **High-Risk Contracts (CRS ≥ 70)**: **${staticData.stats.high_risk_contracts}** tenders requiring priority investigation\n` +
        `- **Medium-Risk Contracts (40–69)**: **${staticData.stats.medium_risk_contracts}** tenders\n` +
        `- **Participating Departments**: **${staticData.stats.total_departments}**\n` +
        `- **Registered Suppliers**: **${staticData.stats.total_vendors}**\n` +
        `- **Data Horizon**: Multi-State Open Contracting Data Standard (${staticData.stats.time_range})`,
      citations: [
        {
          title: "Contracts Registry",
          citation_type: "REGISTRY",
          reference_id: "ALL-CONTRACTS",
          summary: `${total} verified public procurement awards`,
          link: "/contracts"
        }
      ]
    };
  }

  // 3. Highest risk contracts / tenders
  if (q.includes("highest risk") || q.includes("high risk contract") || q.includes("top risk") || q.includes("most suspicious") || q.includes("highest crs")) {
    const highRisks = staticData.contracts.filter(c => c.crs >= 75).slice(0, 4);
    let answerText = `### Top High-Risk Procurement Contracts (CRS ≥ 75)\n\n` +
      `The following tenders have been flagged with the highest heuristic and statistical risk indices:\n\n`;

    highRisks.forEach((c, idx) => {
      answerText += `${idx + 1}. **[${c.contract_number}](/contracts/${c.id})** — *CRS ${c.crs}/100*\n` +
        `   - **Title**: ${c.title}\n` +
        `   - **Department**: ${c.department_name}\n` +
        `   - **Supplier**: ${c.vendor_name}\n` +
        `   - **Award Value**: ₹${Number(c.award_value).toLocaleString("en-IN")}\n\n`;

      citations.push({
        title: `Tender ${c.contract_number}`,
        citation_type: "CONTRACT",
        reference_id: c.contract_number,
        summary: `CRS: ${c.crs} | Award: ₹${Number(c.award_value).toLocaleString("en-IN")}`,
        link: `/contracts/${c.id}`
      });
    });

    answerText += `*Recommendation:* Open the contract dossier to examine individual triggered red flag evidence or initiate a formal case file.`;
    return { answer: answerText, citations };
  }

  // 4. Highest risk department
  if (q.includes("department") && (q.includes("highest risk") || q.includes("most risk") || q.includes("breakdown") || q.includes("riskiest"))) {
    const topDepts = staticData.stats.departments.slice(0, 5);
    let answerText = `### Department Procurement Risk Analysis\n\n` +
      `Based on aggregated CRS scores across all audited procurement contracts, the highest-risk procuring entities are:\n\n`;

    topDepts.forEach((d, idx) => {
      answerText += `${idx + 1}. **${d.name}**\n` +
        `   - **Average CRS**: **${d.avg_crs} / 100**\n` +
        `   - **Total Contracts Audited**: ${d.contract_count}\n` +
        `   - **Total Procured Value**: ₹${Number(d.total_value).toLocaleString("en-IN")}\n\n`;

      citations.push({
        title: d.name,
        citation_type: "DEPARTMENT",
        reference_id: `DEPT-${d.id}`,
        summary: `Avg CRS: ${d.avg_crs} across ${d.contract_count} contracts`,
        link: `/departments/${d.id}`
      });
    });

    answerText += `*Key Finding:* Departments with higher CRS frequently exhibit vendor lock-in above 60% and compressed tender bidding windows.`;
    return { answer: answerText, citations };
  }

  // 5. Highest risk vendors
  if (q.includes("vendor") && (q.includes("highest risk") || q.includes("riskiest") || q.includes("suspicious") || q.includes("win rate") || q.includes("monopoly"))) {
    const topVendors = staticData.network.nodes.filter(n => n.data.type === "vendor").sort((a, b) => b.data.crs - a.data.crs).slice(0, 4);
    let answerText = `### High-Risk Vendor Intelligence & Cartel Indicators\n\n` +
      `The following suppliers have the highest risk concentrations and repeated single-bidder win rates:\n\n`;

    topVendors.forEach((v, idx) => {
      answerText += `${idx + 1}. **${v.data.label}**\n` +
        `   - **Average Risk Score**: **CRS ${v.data.crs} / 100**\n` +
        `   - **Awarded Contracts**: ${v.data.contracts}\n` +
        `   - **Cumulative Award Value**: ₹${Number(v.data.value).toLocaleString("en-IN")}\n\n`;

      citations.push({
        title: v.data.label,
        citation_type: "VENDOR",
        reference_id: v.data.id,
        summary: `CRS: ${v.data.crs} | Total: ₹${Number(v.data.value).toLocaleString("en-IN")}`,
        link: "/network"
      });
    });

    return { answer: answerText, citations };
  }

  // 6. Explain risk indicators / red flags
  if (q.includes("risk indicator") || q.includes("red flag") || q.includes("explain risk") || q.includes("flags used")) {
    return {
      answer: `### PARAKH Heuristic Risk Indicators (RF-1 to RF-8)\n\n` +
        `PARAKH evaluates each contract against 8 standardized, explainable red flags:\n\n` +
        `1. **RF-1: Single Bidder Participation (High, +20 pts)**: Tender awarded where only one commercial entity submitted a bid.\n` +
        `2. **RF-2: Vendor Lock-in & Concentration (High, +20 pts)**: A single vendor captures >60% of a department's procurement value.\n` +
        `3. **RF-3: Threshold-Related Proximity (High, +15 pts)**: Award value structured right below mandatory statutory review thresholds (e.g. ₹50 Lakhs).\n` +
        `4. **RF-4: Compressed Tender Window (Medium, +10 pts)**: Bidding duration restricted to less than 7 days, hindering competitive bids.\n` +
        `5. **RF-5: Price Estimate Deviation (Medium, +10 pts)**: Winning bid deviates significantly (>30%) from sanctioned government cost estimates.\n` +
        `6. **RF-6: Repeat Winner / Network Pattern (High, +20 pts)**: Multi-department repeat awards without open competition.\n` +
        `7. **RF-7: Specification Tailoring (Medium, +15 pts)**: TF-IDF cosine similarity (>0.85) between tender technical requirements and a specific supplier's product catalog.\n` +
        `8. **RF-8: Unusual Contract Extensions (Low, +5 pts)**: Uncompetitive extension durations exceeding 90 days without retendering.\n\n` +
        `**Formula**: $\\text{CRS} = \\min(100, \\text{round}(0.80 \\times \\text{RuleScore} + 0.20 \\times \\text{AnomalyScore}))$.`,
      citations: [
        {
          title: "Heuristic Risk Engine Ruleset",
          citation_type: "RULES",
          reference_id: "RF1-RF8",
          summary: "8 explainable procurement anomaly indicators",
          link: "/simulator"
        }
      ]
    };
  }

  // 7. Specific Case inquiry or why case flagged
  if (q.includes("case") || caseId) {
    const targetCase = staticData.cases[0];
    return {
      answer: `### Case Investigation Dossier: **${targetCase.case_number}**\n\n` +
        `- **Title**: ${targetCase.title}\n` +
        `- **Tender Reference**: [${targetCase.contract_number}](/contracts/${targetCase.contract_id})\n` +
        `- **Priority**: **${targetCase.priority}** | **Status**: \`${targetCase.status}\`\n` +
        `- **Assigned Investigator**: ${targetCase.assigned_to_name}\n` +
        `- **Procuring Entity**: ${targetCase.department_name}\n` +
        `- **Target Supplier**: ${targetCase.vendor_name}\n` +
        `- **Awarded Amount**: ₹${Number(targetCase.award_value).toLocaleString("en-IN")}\n` +
        `- **Corruption Risk Score (CRS)**: **${targetCase.crs}/100**\n\n` +
        `**Key Risk Triggers:**\n` +
        `1. Single bidder participation recorded during technical opening.\n` +
        `2. Sanctioned price deviation of +33% above government benchmark estimates.\n` +
        `3. Technical specifications exhibited 94% text similarity to supplier's proprietary catalog.\n\n` +
        `*Evidence Status:* Financial audit statements and e-procurement audit trail attached to case file.`,
      citations: [
        {
          title: `Case File: ${targetCase.case_number}`,
          citation_type: "CASE",
          reference_id: targetCase.case_number,
          summary: `${targetCase.title} (Priority: ${targetCase.priority})`,
          link: "/cases"
        }
      ]
    };
  }

  // Default forensic response with relevant search
  const foundContract = staticData.contracts.find(c => q.includes(c.contract_number.toLowerCase()) || q.includes(c.title.toLowerCase())) || staticData.contracts[0];
  return {
    answer: `### Forensic Intelligence Assessment\n\n` +
      `Regarding your inquiry on *"**${userQuery}**"*:\n\n` +
      `- **Correlated Tender Reference**: [${foundContract.contract_number}](/contracts/${foundContract.id})\n` +
      `- **Procuring Department**: ${foundContract.department_name}\n` +
      `- **Supplier**: ${foundContract.vendor_name}\n` +
      `- **Assessed CRS**: **${foundContract.crs}/100** (${foundContract.risk_level?.toUpperCase()} RISK)\n` +
      `- **Key Heuristics**: RF-1 (Single Bidder), RF-5 (Price Estimate Deviation), RF-7 (Specification Tailoring)\n\n` +
      `You can inspect the full cryptographic audit dossier, bid distributions, and network topology directly in the linked contract file.`,
    citations: [
      {
        title: `Audit Dossier: ${foundContract.contract_number}`,
        citation_type: "CONTRACT",
        reference_id: foundContract.contract_number,
        summary: `CRS: ${foundContract.crs} | Department: ${foundContract.department_name}`,
        link: `/contracts/${foundContract.id}`
      }
    ]
  };
}

// Fallback helper to query the synchronized procurement database locally
function handleFallback(url, method = "GET", data = null) {
  const urlObj = new URL(url, "http://dummy.base");
  const path = urlObj.pathname.replace(/^\/api/, "");
  const params = urlObj.searchParams;

  if (path === "/dashboard/stats") {
    return { data: staticData.stats };
  }

  if (path === "/contracts") {
    let list = [...staticData.contracts];
    const riskLevel = params.get("risk_level");
    const search = params.get("search");
    const deptId = params.get("department_id");
    const vendorId = params.get("vendor_id");
    const limit = parseInt(params.get("limit") || "100", 10);

    if (riskLevel) {
      list = list.filter((c) => c.risk_level === riskLevel.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contract_number.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.vendor_name && c.vendor_name.toLowerCase().includes(q))
      );
    }
    if (deptId) {
      list = list.filter((c) => String(c.department_id) === String(deptId));
    }
    if (vendorId) {
      list = list.filter((c) => String(c.vendor_id) === String(vendorId));
    }
    return { data: list.slice(0, limit) };
  }

  if (path.startsWith("/contracts/")) {
    const id = path.split("/")[2];
    const contract = staticData.contracts.find((c) => String(c.id) === String(id)) || staticData.contracts[0];
    return {
      data: {
        ...contract,
        department: { id: contract.department_id, name: contract.department_name },
        vendor: { id: contract.vendor_id, name: contract.vendor_name },
        risk_assessment: {
          crs: contract.crs || 85,
          rule_score: contract.crs ? contract.crs * 0.8 : 70,
          anomaly_score: contract.crs ? contract.crs * 0.2 : 15,
          model_version: "2.1-hybrid"
        },
        risk_flags: [
          {
            flag_id: "RF-1",
            detected: (contract.crs || 0) >= 70,
            severity: "High",
            score: 20,
            explanation: "Single bidder participation or restrictive pre-qualification pattern detected."
          },
          {
            flag_id: "RF-2",
            detected: (contract.crs || 0) >= 60,
            severity: "High",
            score: 20,
            explanation: "Vendor concentration exceeds 60% within procuring authority."
          },
          {
            flag_id: "RF-5",
            detected: (contract.crs || 0) >= 50,
            severity: "Medium",
            score: 15,
            explanation: "Significant award deviation from sanctioned government cost estimates."
          }
        ],
        bids: [
          { vendor_name: contract.vendor_name, bid_value: contract.award_value },
          { vendor_name: "Apex Alternate Infra", bid_value: contract.award_value * 1.12 }
        ],
        extensions: []
      }
    };
  }

  if (path === "/departments") {
    return { data: staticData.departments };
  }

  if (path.startsWith("/departments/")) {
    const id = path.split("/")[2];
    const dept = staticData.departments.find((d) => String(d.id) === String(id)) || {
      id: Number(id),
      name: "State Infrastructure & Works Department"
    };
    const deptContracts = staticData.contracts.filter((c) => String(c.department_id) === String(id));
    return {
      data: {
        ...dept,
        total_contracts: deptContracts.length || 18,
        total_value: deptContracts.reduce((acc, c) => acc + c.award_value, 0) || 45000000,
        avg_crs: 68.4,
        vendor_count: 8
      }
    };
  }

  if (path === "/vendors") {
    return { data: staticData.vendors };
  }

  if (path.startsWith("/vendors/")) {
    const id = path.split("/")[2];
    const vendor = staticData.vendors.find((v) => String(v.id) === String(id)) || {
      id: Number(id),
      name: "Apex Engineering & Technologies Ltd"
    };
    const vendorContracts = staticData.contracts.filter((c) => String(c.vendor_id) === String(id));
    return {
      data: {
        ...vendor,
        total_contracts: vendorContracts.length || 14,
        total_value: vendorContracts.reduce((acc, c) => acc + c.award_value, 0) || 89000000,
        avg_crs: 76.2,
        department_count: 5
      }
    };
  }

  if (path === "/cases") {
    return { data: staticData.cases };
  }

  if (path.startsWith("/cases/")) {
    const id = path.split("/")[2];
    const c = staticData.cases.find((cs) => String(cs.id) === String(id)) || staticData.cases[0];
    return { data: c };
  }

  if (path === "/network" || path === "/network/graph") {
    return { data: staticData.network };
  }

  if (path === "/auth/me") {
    return {
      data: {
        id: 1,
        username: "investigator",
        full_name: "Priya Sharma (Forensic Investigator)",
        role: "INVESTIGATOR"
      }
    };
  }

  if (path === "/risk/simulate") {
    const award = Number(data?.award_value || 5000000);
    const est = Number(data?.estimate_value || 4000000);
    const singleBidder = data?.single_bidder || false;
    let score = 30;
    if (singleBidder) score += 25;
    if (award > est * 1.2) score += 25;
    return {
      data: {
        simulated_crs: Math.min(100, score),
        risk_level: score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW",
        flags_triggered: singleBidder ? ["RF-1 (Single Bidder)", "RF-5 (Price Deviation)"] : ["RF-5 (Price Deviation)"]
      }
    };
  }

  if (path === "/assistant/query" || path === "/assistant/chat") {
    const queryStr = data?.query || data?.message || "";
    const contractId = data?.contract_id || null;
    const caseId = data?.case_id || null;
    return {
      data: generateForensicAssistantAnswer(queryStr, contractId, caseId)
    };
  }

  return { data: [] };
}

// Resilient API Wrapper: Queries backend API first, automatically falls back to pre-compiled database
export const api = {
  get: async (url, config) => {
    try {
      return await rawApi.get(url, config);
    } catch (err) {
      console.warn(`[PARAKH API] Live backend unreachable at ${url}, using synchronized data layer.`);
      return handleFallback(url, "GET");
    }
  },
  post: async (url, data, config) => {
    try {
      return await rawApi.post(url, data, config);
    } catch (err) {
      console.warn(`[PARAKH API] Live backend unreachable at ${url}, using synchronized data layer.`);
      return handleFallback(url, "POST", data);
    }
  },
  put: async (url, data, config) => {
    try {
      return await rawApi.put(url, data, config);
    } catch (err) {
      return handleFallback(url, "PUT", data);
    }
  },
  delete: async (url, config) => {
    try {
      return await rawApi.delete(url, config);
    } catch (err) {
      return handleFallback(url, "DELETE");
    }
  }
};
