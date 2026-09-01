from typing import Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def specification_similarity(specification: str, vendor_description: str, threshold: float = 0.85) -> Dict[str, Any]:
    """Calculate TF-IDF Cosine Similarity between tender specification and vendor profile."""
    spec_clean = (specification or "").strip()
    vendor_clean = (vendor_description or "").strip()

    if not spec_clean or not vendor_clean:
        return {
            "similarity_score": 0.0,
            "threshold": threshold,
            "flagged": False,
            "explanation": "Insufficient text was supplied for specification similarity analysis.",
        }

    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        matrix = vectorizer.fit_transform([spec_clean, vendor_clean])
        score = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
        score = round(max(0.0, min(1.0, score)), 4)
    except Exception:
        # Fallback for empty vocabulary or tokenization errors
        score = 0.0

    flagged = score > threshold
    return {
        "similarity_score": score,
        "threshold": threshold,
        "flagged": flagged,
        "explanation": (
            f"Tender specification has unusually high similarity ({score:.1%}) to the vendor's product description (threshold: {threshold:.1%})."
            if flagged else "No unusually high specification similarity detected."
        ),
    }
