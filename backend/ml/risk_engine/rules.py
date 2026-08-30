def tender_duration_days(contract):
    return (contract.tender_end - contract.tender_start).total_seconds() / 86400

def price_deviation(contract):
    if not contract.estimate_value:
        return 0.0
    return (float(contract.award_value) - float(contract.estimate_value)) / float(contract.estimate_value)

def evaluate_rules(contract, department_contracts, settings):
    bidder_count = len(contract.bids)
    duration = tender_duration_days(contract)
    deviation = price_deviation(contract)
    peers = department_contracts or []
    vendor_wins = sum(c.vendor_id == contract.vendor_id for c in peers)
    ratio = vendor_wins / len(peers) if peers else 0
    long_extensions = sum(
        e.extension_days >= settings.unusual_extension_days for e in (contract.extensions or [])
    )
    return [
        {"flag_id":"RF-1","detected":bidder_count == 1,"severity":"high","score":20,
         "explanation":"Only one bidder participated in this tender."},
        {"flag_id":"RF-2","detected":ratio > settings.vendor_lockin_threshold,"severity":"high","score":20,
         "explanation":f"Vendor won {ratio:.0%} of contracts observed for this department."},
        {"flag_id":"RF-3",
         "detected":float(contract.award_value) <= settings.approval_threshold and float(contract.award_value) >= settings.approval_threshold*0.90,
         "severity":"high","score":15,
         "explanation":"Contract value is unusually close to the configured approval threshold."},
        {"flag_id":"RF-4","detected":duration < settings.tender_duration_threshold_days,"severity":"medium","score":10,
         "explanation":f"Tender was open for {duration:.1f} days, below the configured threshold."},
        {"flag_id":"RF-5","detected":deviation > settings.price_deviation_threshold,"severity":"medium","score":10,
         "explanation":f"Award price was {deviation:.0%} above the estimate."},
        {"flag_id":"RF-6","detected":vendor_wins >= 3,"severity":"high","score":20,
         "explanation":f"Vendor has repeatedly won contracts from this department ({vendor_wins} observed wins)."},
        {"flag_id":"RF-7","detected":False,"severity":"medium","score":15,
         "explanation":"No unusually high specification similarity detected."},
        {"flag_id":"RF-8","detected":long_extensions >= 2,"severity":"low","score":5,
         "explanation":f"{long_extensions} unusually long contract extensions were observed."},
    ]
