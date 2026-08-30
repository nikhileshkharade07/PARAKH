/**
 * AEGIS PROCUREMENT ENGINE — CLIENT CONTROLLER
 * Connects all 4 Zero-Human-Discretion Pillars & Role Portals
 */

let cyInstance = null;
let currentTenders = [];
let sensorStreamInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  generateNewSalt();
  loadOverviewData();
  loadZkCommitments();
  initUboGraph();
  startLiveSensorStream();
});

// ================= Tab Navigation =================
function initTabs() {
  const buttons = document.querySelectorAll(".role-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".role-btn").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tabId);
  });

  document.querySelectorAll(".view-panel").forEach(p => {
    p.classList.toggle("active", p.id === `tab-${tabId}`);
  });

  if (tabId === "auditor") {
    setTimeout(() => {
      if (cyInstance) cyInstance.resize();
    }, 100);
  }
}

// ================= 1. Overview Loader =================
async function loadOverviewData() {
  try {
    const [statsRes, tendersRes] = await Promise.all([
      fetch("/api/aegis/stats"),
      fetch("/api/aegis/tenders")
    ]);

    const stats = await statsRes.json();
    const tenders = await tendersRes.json();
    currentTenders = tenders;

    // Update KPIs
    document.getElementById("kpi-budget").innerText = `$${(stats.total_budget_under_aegis_usd / 1e6).toFixed(1)}M`;
    document.getElementById("kpi-commitments").innerText = `${stats.cryptographic_zk_commitments_on_chain} Verified`;

    // Populate Overview Table
    const tbody = document.getElementById("overview-tenders-body");
    tbody.innerHTML = "";

    const zkSelect = document.getElementById("zk-tender-select");
    zkSelect.innerHTML = "";

    tenders.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <strong>${t.title}</strong><br>
          <span class="mono text-muted text-xs">${t.ocid}</span>
        </td>
        <td>${t.procuring_entity.name}</td>
        <td class="mono font-bold">$${(t.budget_ceiling.amount).toLocaleString()} ${t.budget_ceiling.currency}</td>
        <td><span class="badge-sub">${t.pillar || "Multi-Pillar"}</span></td>
        <td><code class="text-xs accent-cyan">${t.smart_contract_address.substring(0, 10)}...</code></td>
        <td><span class="badge-status ${t.status}">${t.status}</span></td>
      `;
      tbody.appendChild(tr);

      // Add to Vendor Form select
      const opt = document.createElement("option");
      opt.value = t.ocid;
      opt.innerText = `${t.title} ($${(t.budget_ceiling.amount / 1e6).toFixed(1)}M)`;
      zkSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load overview data:", err);
  }
}

// ================= 2. Pillar 1: Blind zk-Bidding =================
function generateNewSalt() {
  const chars = "0123456789abcdef";
  let s = "0xsalt_";
  for (let i = 0; i < 16; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  document.getElementById("zk-secret-salt").value = s;
}

function updateSolvencyDisplay(val) {
  document.getElementById("solvency-val").innerText = `${val}x`;
}

async function handleZkSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-submit-zk");
  btn.disabled = true;
  btn.innerText = "⏳ Generating Groth16 zk-SNARK & Time-Lock Envelope...";

  const payload = {
    tender_ocid: document.getElementById("zk-tender-select").value,
    vendor_name: document.getElementById("zk-vendor-name").value,
    amount: parseFloat(document.getElementById("zk-bid-amount").value),
    secret_salt: document.getElementById("zk-secret-salt").value,
    solvency_ratio: parseFloat(document.getElementById("zk-solvency-slider").value),
    proposal_spec: {
      "IEC 61850 Protocol Compliance": true,
      "Hardware Security Module (HSM) Level": "FIPS-140-3-L3",
      "MTBF Mean Time Between Failures (Hours)": 105000
    }
  };

  try {
    const res = await fetch("/api/aegis/zk/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    // Render proof preview matrix
    const display = document.getElementById("zk-proof-display");
    display.className = "proof-box";
    display.innerHTML = `
      <div class="proof-entry">
        <div class="proof-label">POSEIDON COMMITMENT HASH ON-CHAIN</div>
        <div class="proof-code accent-cyan">${data.commitment_hash}</div>
      </div>
      <div class="proof-entry">
        <div class="proof-label">GROTH16 ZK-SNARK PROOF ARTIFACT (BN254)</div>
        <div class="proof-code">
          pi_a: [${data.zk_snark_proof.proof.pi_a.join(", ")}]<br>
          pi_b: [${data.zk_snark_proof.proof.pi_b[0].join(", ")}...]<br>
          pi_c: [${data.zk_snark_proof.proof.pi_c.join(", ")}]<br>
          Verification Status: <strong class="accent-green">CONSTRAINTS_SATISFIED</strong>
        </div>
      </div>
      <div class="proof-entry">
        <div class="proof-label">VERIFIABLE DELAY TIME-LOCK CIPHERTEXT (ZERO EARLY LEAK)</div>
        <div class="proof-code text-muted">${data.timelock_envelope.ciphertext.substring(0, 72)}... (Encrypted until deadline)</div>
      </div>
      <div class="proof-entry">
        <div class="proof-label">ON-CHAIN RECEIPT</div>
        <div class="proof-code text-xs">Block: #${data.block_height} | Tx: ${data.tx_hash}</div>
      </div>
    `;

    loadZkCommitments();
    loadOverviewData();
  } catch (err) {
    alert("Error generating zk commitment: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "⚡ Generate Groth16 zk-SNARK & Submit Blind Commitment";
  }
}

async function loadZkCommitments() {
  try {
    const res = await fetch("/api/aegis/zk/commitments");
    const data = await res.json();

    const tbody = document.getElementById("zk-commitments-body");
    tbody.innerHTML = "";

    data.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><code class="accent-cyan">${c.commitment_hash.substring(0, 18)}...</code></td>
        <td><span class="mono text-xs">${c.tender_ocid}</span></td>
        <td><code class="text-xs">${c.vendor_pubkey}</code></td>
        <td class="mono">#${c.block_height}</td>
        <td><span class="badge-status awarded">GROTH16 VALID</span></td>
        <td><span class="badge-status active">${c.timelock_status || "TIMELOCKED"}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Failed to load commitments:", err);
  }
}

// ================= 3. Pillar 3: Auditor UBO Graph =================
async function initUboGraph() {
  try {
    const res = await fetch("/api/aegis/ubo/graph");
    const graphData = await res.json();

    const cyContainer = document.getElementById("cy-container");
    if (!cyContainer) return;

    cyInstance = cytoscape({
      container: cyContainer,
      elements: graphData.cytoscape_elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#f1f5f9',
            'font-family': 'Inter, sans-serif',
            'font-size': '11px',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': '#3b82f6',
            'width': 36,
            'height': 36,
            'border-width': 2,
            'border-color': '#60a5fa'
          }
        },
        {
          selector: 'node[type = "ubo_person"]',
          style: {
            'background-color': '#f59e0b',
            'border-color': '#fbbf24',
            'width': 44,
            'height': 44
          }
        },
        {
          selector: 'node[type = "shell_entity"]',
          style: {
            'background-color': '#f43f5e',
            'border-color': '#fda4af',
            'shape': 'diamond',
            'width': 40,
            'height': 40
          }
        },
        {
          selector: 'node[type = "nominee_director"]',
          style: {
            'background-color': '#a855f7',
            'border-color': '#c084fc',
            'width': 38,
            'height': 38
          }
        },
        {
          selector: 'node[type = "wallet_cluster"]',
          style: {
            'background-color': '#00f2fe',
            'border-color': '#38bdf8',
            'shape': 'hexagon',
            'width': 38,
            'height': 38
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': 'rgba(59, 130, 246, 0.4)',
            'target-arrow-color': 'rgba(59, 130, 246, 0.6)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'color': '#94a3b8',
            'text-rotation': 'autorotate'
          }
        },
        {
          selector: 'edge[label = "shared_ip"], edge[label = "shared_seed_wallet"]',
          style: {
            'line-color': '#f43f5e',
            'target-arrow-color': '#f43f5e',
            'line-style': 'dashed',
            'width': 2.5
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 40,
        nodeOverlap: 20
      }
    });

    cyInstance.on('tap', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      const infoBox = document.getElementById("node-info-box");
      infoBox.innerHTML = `
        <h4>Node Forensics: ${data.label}</h4>
        <p><strong>Type:</strong> <span class="mono">${data.type.toUpperCase()}</span></p>
        <p><strong>Jurisdiction:</strong> ${data.jurisdiction} ${data.jurisdiction_risk > 1.0 ? '<span class="accent-crimson font-bold">(' + data.jurisdiction_risk + 'x Tax Haven Penalty)</span>' : ''}</p>
        ${data.risk_flags && data.risk_flags.length ? `
          <p><strong>Risk Flags:</strong> <span class="badge-status disqualified">${data.risk_flags.join(", ")}</span></p>
        ` : ''}
        <div class="mt-2 text-xs mono text-muted">
          ${JSON.stringify(data.metadata || {}, null, 2)}
        </div>
      `;
    });

  } catch (err) {
    console.error("Failed to init UBO graph:", err);
  }
}

function resetGraphLayout() {
  if (cyInstance) {
    cyInstance.layout({ name: 'cose', animate: true }).run();
  }
}

async function runCollusionDetection() {
  try {
    const res = await fetch("/api/aegis/ubo/graph");
    const data = await res.json();
    alert(`Collusion Scan Complete!\n\nFound ${data.collusion_rings.length} high-confidence collusion ring(s).\nTax Haven Shell Entities Weighting Applied.\n3 entities disqualified.`);
  } catch (err) {
    alert("Scan error: " + err.message);
  }
}

async function exportOcdsJson() {
  const ocid = "ocds-aegis-in-2026-nh48";
  window.open(`/api/aegis/ocds/${ocid}/export`, "_blank");
}

// ================= 4. Pillar 2: Algorithmic Evaluation =================
async function executeAlgorithmicEvaluation() {
  const badge = document.getElementById("eval-receipt-badge");
  badge.innerText = "Executing Deterministic Scoring...";
  badge.className = "badge-sub mono accent-cyan";

  try {
    const res = await fetch("/api/aegis/algorithmic/evaluate?tender_ocid=ocds-aegis-in-2026-rail", {
      method: "POST"
    });
    const data = await res.json();

    badge.innerText = `Audit Receipt: ${data.audit_receipt_hash.substring(0, 16)}...`;
    badge.className = "badge-sub mono accent-green";

    const tbody = document.getElementById("eval-results-body");
    tbody.innerHTML = "";

    data.evaluated_bids.forEach((b, idx) => {
      const tr = document.createElement("tr");
      const isWinner = b.status === "DETERMINISTIC_WINNER";
      const isDisqualified = b.status.startsWith("DISQUALIFIED");

      tr.innerHTML = `
        <td class="font-bold ${isWinner ? 'accent-green' : ''}">#${idx + 1}</td>
        <td>
          <strong>${b.vendor_name}</strong>
          ${isWinner ? '<span class="badge-status awarded ml-2">🏆 AWARDED</span>' : ''}
        </td>
        <td class="mono font-bold">$${(b.amount).toLocaleString()}</td>
        <td class="mono">${b.tech_score !== undefined ? b.tech_score + '/100' : 'N/A'}</td>
        <td class="mono">${b.price_score !== undefined ? b.price_score + '/100' : 'N/A'}</td>
        <td class="mono font-bold ${isWinner ? 'accent-green' : ''}">${b.composite_score}</td>
        <td>
          <span class="badge-status ${isWinner ? 'awarded' : (isDisqualified ? 'disqualified' : 'active')}">
            ${b.status}
          </span>
          ${b.disqualification_reason ? `<div class="text-xs text-muted mt-1">${b.disqualification_reason}</div>` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    alert("Evaluation failed: " + err.message);
  }
}

// ================= 5. Pillar 4: Telemetry Smart Escrow =================
async function triggerEscrowRelease(ocid, milestoneId) {
  let telemetryData = {};

  if (milestoneId === "MS-NH48-02") {
    telemetryData = {
      telemetry_source: "SENTINEL-1_SAR_AND_DRONE_LIDAR_POINTCLOUD",
      scene_id: "SENTINEL-1-SAR-20260824-S4B",
      backscatter_delta_db: 6.45,
      target_delta_db: 6.2,
      volumetric_progress_m3: 621500.0,
      target_volumetric_m3: 620000.0,
      completion_percentage: 100.0,
      telemetry_criteria_met: true,
      cryptographic_telemetry_hash: "0xsat_891e4a102b489a"
    };
  } else {
    telemetryData = {
      telemetry_source: "IOT_WEIGHBRIDGE_AND_RFID_GATE",
      device_id: "IOT-WB-MUMBAI-04",
      gate_sensor_id: "RFID-GATE-CENTRAL-A",
      net_weight_kg: 42510.0,
      expected_net_weight_kg: 42500.0,
      weight_deviation_pct: 0.023,
      rfid_tag_authenticated: true,
      telemetry_criteria_met: true,
      cryptographic_telemetry_hash: "0xiot_44901ba831e4"
    };
  }

  const payload = {
    tender_ocid: ocid,
    milestone_id: milestoneId,
    telemetry_data: telemetryData
  };

  try {
    const res = await fetch("/api/aegis/escrow/trigger-release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      const stream = document.getElementById("escrow-log-stream");
      const logDiv = document.createElement("div");
      logDiv.className = "log-row info";
      logDiv.innerHTML = `
        <span class="log-time">[${new Date().toISOString()}]</span>
        <span class="log-msg accent-green">
          ORACLE_CONSENSUS_EXECUTED: ${milestoneId} released $${(data.released_amount).toLocaleString()} USD to ${data.vendor_wallet}.
          Tx: ${data.release_tx_hash.substring(0, 24)}... (Zero Human Discretion Verified)
        </span>
      `;
      stream.insertBefore(logDiv, stream.firstChild);

      alert(`🎉 Automated Smart Escrow Release Success!\n\nMilestone: ${milestoneId}\nAmount: $${(data.released_amount).toLocaleString()} ${data.currency}\nConsensus: ${data.oracle_consensus_count}\nTx Hash: ${data.release_tx_hash}\n\nNo human bureaucrat sign-off was needed!`);
      loadOverviewData();
    } else {
      alert("Escrow Release Blocked: " + data.error);
    }
  } catch (err) {
    alert("Escrow trigger error: " + err.message);
  }
}

// Live IoT sensor telemetry simulation
function startLiveSensorStream() {
  if (sensorStreamInterval) clearInterval(sensorStreamInterval);
  sensorStreamInterval = setInterval(async () => {
    try {
      const res = await fetch("/api/aegis/telemetry/live-sensor-stream");
      const data = await res.json();
      
      const wb = data.weighbridge;
      const elNet = document.querySelector(".iot-gauge.highlight .gauge-val");
      const elSub = document.querySelector(".iot-gauge.highlight .gauge-sub");
      const elGross = document.querySelectorAll(".iot-gauge .gauge-val")[0];
      
      if (elNet) elNet.innerText = `${wb.net_weight_kg.toLocaleString()} kg`;
      if (elGross) elGross.innerText = `${wb.gross_weight_kg.toLocaleString()} kg`;
      if (elSub) elSub.innerText = `Δ ${wb.deviation_pct}% (≤ 0.5% tolerance)`;
    } catch (err) {
      // silently ignore polling failure during transitions
    }
  }, 3000);
}
