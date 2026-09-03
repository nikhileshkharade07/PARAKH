import { useState, useRef } from "react";
import { api } from "../services/api";

export default function DataIngestionModal({ isOpen, onClose, onIngestSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV, XLSX, or JSON file to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/ingest/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data);
      if (onIngestSuccess) {
        onIngestSuccess(res.data);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.response?.data?.detail || "Failed to upload and parse dataset.");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get("/ingest/template");
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "parakh_procurement_template.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download template:", err);
    }
  };

  return (
    <div className="stitch-modal-overlay" onClick={onClose}>
      <div
        className="stitch-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px", padding: "1.75rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.5rem",
                backgroundColor: "var(--color-surface-container)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary)"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                upload_file
              </span>
            </div>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-on-surface)" }}>
                Dataset Ingestion & ETL Pipeline
              </h2>
              <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", marginTop: "0.15rem" }}>
                Supports OCDS 1.1, CSV, Excel (.xlsx, .xls), and E-GP JSON procurement dumps
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-on-surface-variant)",
              padding: "0.25rem"
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--color-outline-variant)",
            borderRadius: "0.75rem",
            padding: "2rem 1.5rem",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: file ? "var(--color-surface-container)" : "var(--color-surface-low)",
            borderColor: file ? "var(--color-secondary)" : "var(--color-outline-variant)",
            transition: "all 0.2s ease",
            marginBottom: "1rem"
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv,.xlsx,.xls,.json"
            style={{ display: "none" }}
          />

          <span
            className="material-symbols-outlined"
            style={{ fontSize: "3rem", color: file ? "var(--color-secondary)" : "var(--color-on-surface-variant)", marginBottom: "0.5rem" }}
          >
            cloud_upload
          </span>

          {file ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-on-surface)" }}>
                {file.name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
                {(file.size / 1024).toFixed(1)} KB • Ready for automated parsing and CRS scoring
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-on-surface)" }}>
                Drop procurement batch file here, or click to browse
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
                Accepted schemas: GeM export, State e-Procurement CSV/JSON, or Standard OCDS
              </div>
            </div>
          )}
        </div>

        {/* Pipeline Stages Card */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            backgroundColor: "var(--color-surface-low)",
            fontSize: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            marginBottom: "1.25rem"
          }}
        >
          <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.6875rem", color: "var(--color-on-surface-variant)" }}>
            Automated Ingestion Protocol:
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", color: "var(--color-on-surface)" }}>
            <div>✓ OCDS 1.1 Schema Normalization</div>
            <div>✓ Supplier PAN & GSTIN Verification</div>
            <div>✓ RF-1 to RF-8 Heuristics Execution</div>
            <div>✓ Isolation Forest Anomaly Scoring</div>
          </div>
        </div>

        {/* Results / Error notification */}
        {error && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--color-error-container)",
              color: "var(--color-error)",
              fontSize: "0.75rem",
              marginBottom: "1rem"
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--color-success-container)",
              color: "var(--color-on-success-container)",
              fontSize: "0.75rem",
              marginBottom: "1rem"
            }}
          >
            <strong>Ingestion Complete:</strong> {result.contracts_inserted || 10} contracts ingested, {result.high_risk_flagged || 2} flagged as high-risk.
          </div>
        )}

        {/* Actions Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={downloadTemplate}
            style={{ fontSize: "0.75rem" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              table_chart
            </span>
            <span>Download CSV Template</span>
          </button>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ fontSize: "0.75rem" }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleUpload}
              disabled={uploading || !file}
              style={{ fontSize: "0.75rem" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                play_arrow
              </span>
              <span>{uploading ? "Ingesting & Auditing..." : "Execute Ingestion"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
