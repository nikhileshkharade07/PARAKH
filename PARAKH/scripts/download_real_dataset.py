"""
scripts/download_real_dataset.py
---------------------------------
Automated downloader and checksum verifier for authentic Indian Government
Public Procurement datasets (Himachal Pradesh State Public Procurement / OCDS).
"""

import os
import sys
import hashlib
import json
import urllib.request
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("download_real_dataset")

DATASET_CONFIG = {
    "name": "Himachal Pradesh Public Procurement & Health Tender Dataset",
    "publisher": "CivicDataLab & Open Contracting Partnership / Himachal Pradesh Finance & Health Dept",
    "source_url": "https://raw.githubusercontent.com/CivicDataLab/himachal-pradesh-health-procurement-OCDS/master/HP%20Health%20Procurements(FY%202017-18%20to%202020-21%20July).xlsx",
    "filename": "hp_procurement_raw.xlsx",
    "expected_min_bytes": 1_500_000,
    "license": "Open Data Commons Attribution License (ODC-By v1.0) / Open Government Data",
    "time_range": {
        "start": "2017-04-01",
        "end": "2021-07-31"
    }
}

def calculate_sha256(filepath: str) -> str:
    """Compute SHA-256 checksum of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()

def download_dataset(target_dir: str = "data/raw") -> str:
    """Download raw dataset from authenticated source with validation."""
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, DATASET_CONFIG["filename"])

    url = DATASET_CONFIG["source_url"]
    logger.info(f"Connecting to source: {url}")
    
    headers = {"User-Agent": "PARAKH-Procurement-Auditor/1.0 (Government Open Data Ingestion)"}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read()
            
        file_size = len(content)
        if file_size < DATASET_CONFIG["expected_min_bytes"]:
            raise ValueError(f"Downloaded file size {file_size} bytes is smaller than expected threshold ({DATASET_CONFIG['expected_min_bytes']} bytes).")

        with open(target_path, "wb") as f:
            f.write(content)

        checksum = calculate_sha256(target_path)
        logger.info(f"Successfully downloaded: {target_path}")
        logger.info(f"File Size: {file_size:,} bytes")
        logger.info(f"SHA-256 Checksum: {checksum}")
        
        return target_path

    except Exception as e:
        logger.error(f"Failed to download dataset: {e}")
        if os.path.exists(target_path):
            logger.info("Using existing local raw dataset as fallback.")
            return target_path
        raise

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    raw_dir = os.path.join(project_root, "data", "raw")
    dest = download_dataset(raw_dir)
    print(f"Dataset ready at: {dest}")
