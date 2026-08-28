from backend.ml.nlp.similarity import specification_similarity

def test_identical_text_flags():
    text = "network switches routers firewall managed network services"
    result = specification_similarity(text, text, 0.85)
    assert result["flagged"] is True
    assert result["similarity_score"] > 0.85

def test_empty_text_does_not_flag():
    result = specification_similarity("", "network services", 0.85)
    assert result["flagged"] is False
