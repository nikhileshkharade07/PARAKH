from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def specification_similarity(specification: str, vendor_description: str, threshold: float = 0.85):
    if not specification.strip() or not vendor_description.strip():
        return {
            "similarity_score": 0.0,
            "threshold": threshold,
            "flagged": False,
            "explanation": "Insufficient text was supplied for specification similarity analysis.",
        }
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform([specification, vendor_description])
    score = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
    flagged = score > threshold
    return {
        "similarity_score": round(score, 4),
        "threshold": threshold,
        "flagged": flagged,
        "explanation": (
            "Tender specification has unusually high similarity to the vendor's product description."
            if flagged else "No unusually high specification similarity detected."
        ),
    }
