from ml.nlp.similarity import specification_similarity

def test_identical_spec_and_vendor_desc():
    text = "High density rack servers with redundant power supply and hardware RAID controller"
    res = specification_similarity(text, text, threshold=0.85)
    assert res["flagged"] is True
    assert res["similarity_score"] > 0.9

def test_different_spec_and_vendor_desc():
    spec = "Construction of reinforced concrete bridge deck and drainage channels"
    desc = "Enterprise software development, cloud hosting, and relational database management"
    res = specification_similarity(spec, desc, threshold=0.85)
    assert res["flagged"] is False
    assert res["similarity_score"] < 0.3

def test_empty_and_whitespace_nlp():
    res = specification_similarity("", "Enterprise software", threshold=0.85)
    assert res["flagged"] is False
    assert res["similarity_score"] == 0.0

    res2 = specification_similarity("   ", "   ", threshold=0.85)
    assert res2["flagged"] is False
    assert res2["similarity_score"] == 0.0

def test_none_safe_nlp():
    res = specification_similarity(None, None, threshold=0.85)
    assert res["flagged"] is False
    assert res["similarity_score"] == 0.0
