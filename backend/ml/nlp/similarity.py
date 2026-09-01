from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def specification_similarity(specification: str, vendor_description: str, threshold: float = 0.85):
    """Analyze semantic specification tailoring using TF-IDF + Cosine Similarity."""
    if not specification or not vendor_description:
        return {
            "similarity_score": 0.0,
            "threshold": threshold,
            "flagged": False,
            "explanation": "Insufficient text was supplied for specification similarity analysis.",
        }
    spec_str = specification.strip().lower()
    ven_str = vendor_description.strip().lower()
    if not spec_str or not ven_str:
        return {
            "similarity_score": 0.0,
            "threshold": threshold,
            "flagged": False,
            "explanation": "Insufficient text was supplied for specification similarity analysis.",
        }
    if spec_str == ven_str:
        return {
            "similarity_score": 1.0,
            "threshold": threshold,
            "flagged": True,
            "explanation": "Tender specification has 100% exact match to the vendor's product description.",
        }

    # Fast token intersection check: if zero common tokens, skip vectorizer computation
    spec_tokens = set(spec_str.split())
    ven_tokens = set(ven_str.split())
    if not (spec_tokens & ven_tokens):
        return {
            "similarity_score": 0.0,
            "threshold": threshold,
            "flagged": False,
            "explanation": "No unusually high specification similarity detected.",
        }

    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        matrix = vectorizer.fit_transform([specification, vendor_description])
        score = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
    except Exception:
        score = float(len(spec_tokens & ven_tokens) / max(len(spec_tokens), len(ven_tokens), 1))

    flagged = score > threshold
    return {
        "similarity_score": round(score, 4),
        "threshold": threshold,
        "flagged": flagged,
        "explanation": (
            f"Tender specification has unusually high ({score:.0%}) similarity to the vendor's product catalog (Threshold: {threshold:.0%})."
            if flagged else "No unusually high specification similarity detected."
        ),
    }
