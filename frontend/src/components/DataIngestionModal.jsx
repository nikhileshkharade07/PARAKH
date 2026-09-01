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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Ingest Procurement Dataset</h2>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Supports CSV, Microsoft Excel (.xlsx, .xls), and JSON procurement exports
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 18, padding: "4px 8px" }}>✕</button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--border-color)",
            borderRadius: 10,
            padding: "32px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: file ? "rgba(56, 189, 248, 0.05)" : "rgba(255, 255, 255, 0.02)",
            borderColor: file ? "var(--accent-cyan)" : "var(--border-color)",
            transition: "all 0.2s ease",
            marginBottom: 20
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv, .xlsx, .xls, .json"
            style={{ display: "none" }}
          />
          <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
          {file ? (
            <div>
              <strong style={{ color: "var(--accent-cyan)", fontSize: 15 }}>{file.name}</strong>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                {(file.size / 1024).toFixed(1)} KB — Click or drop another file to replace
              </div>
            </div>
          ) : (
            <div>
              <strong style={{ fontSize: 15, color: "var(--text-primary)" }}>Click to browse or drop procurement data file here</strong>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                Accepts GeM Portal CSVs, e-Procurement Excel tables, or JSON contract objects
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button type="button" className="btn-secondary" onClick={downloadTemplate} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span>📥</span> Download Schema Template (.csv)
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{ minWidth: 140 }}
            >
              {uploading ? "Ingesting & Analyzing..." : "Upload & Analyze"}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ padding: 12, background: "rgba(239, 68, 68, 0.15)", border: "1px solid var(--risk-high-border)", borderRadius: 8, color: "#fca5a5", fontSize: 13, marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Success / Result Breakdown */}
        {result && (
          <div style={{ padding: 16, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--risk-low)", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
              <span>✓</span> {result.message}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, textAlign: "center" }}>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total Rows</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{result.total_uploaded}</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Valid Ingested</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--risk-low)" }}>{result.valid_records}</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Duplicates</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--risk-medium)" }}>{result.duplicates}</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>AI Analyzed</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--accent-cyan)" }}>{result.analyzed}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
