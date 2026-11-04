def calculate_mock_score(has_website: bool, has_ssl: bool, is_mobile_friendly: bool, has_contact_form: bool) -> int:
    score = 0
    if not has_website:
        score += 30
    if not has_ssl and has_website:
        score += 15
    if not is_mobile_friendly and has_website:
        score += 15
    if not has_contact_form and has_website:
        score += 10
    return score

def test_opportunity_score_no_website():
    # A business with no website gets at least 30 pts
    score = calculate_mock_score(has_website=False, has_ssl=False, is_mobile_friendly=False, has_contact_form=False)
    assert score == 30

def test_opportunity_score_broken_existing_website():
    # Website with no SSL, bad mobile layout, and no contact form
    score = calculate_mock_score(has_website=True, has_ssl=False, is_mobile_friendly=False, has_contact_form=False)
    assert score == 40

