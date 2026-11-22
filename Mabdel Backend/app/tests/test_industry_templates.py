from __future__ import annotations

import asyncio

from app.services.smartflow.industry_templates import (
    INDUSTRY_TEMPLATES,
    get_industry_preset,
    get_industry_template,
)
from app.tests.test_realtime_receptionist import FakeOpenAI, _business, _receptionist


def test_a_dental_clinic_gets_dentist_vocabulary_in_its_prompt(client, mock_db, monkeypatch):
    owner_id = _business(client, mock_db, monkeypatch, "industry-dental@example.com", business_type="Dental Clinic")
    agent = _receptionist(mock_db, owner_id, FakeOpenAI())

    instructions = asyncio.run(agent.build_instructions())

    assert "TOOTH_PAIN" in instructions and "DENTAL_EMERGENCY" in instructions
    # Master spec: REFERRAL_REQUEST removed from Dental Clinic
    dental_template = get_industry_template("Dental Clinic")
    assert "REFERRAL_REQUEST" not in dental_template["supported_intents"]


def test_home_services_gets_fire_and_gas_in_its_emergency_set_on_top_of_the_owners_own(client, mock_db, monkeypatch):
    owner_id = _business(
        client, mock_db, monkeypatch, "industry-home-services@example.com",
        business_type="Home Services (Plumbing, Electrical, HVAC)", emergency_keywords=["burst pipe"],
    )
    agent = _receptionist(mock_db, owner_id, FakeOpenAI())

    industry_only = asyncio.run(agent._matched_emergency_keyword("there's a serious electrical hazard in the panel"))
    owners_own = asyncio.run(agent._matched_emergency_keyword("we have a burst pipe"))
    medical_default = asyncio.run(agent._matched_emergency_keyword("someone is having a heart attack"))

    assert industry_only == "electrical hazard"  # not in the universal default list - only the Home Services template has it
    assert owners_own == "burst pipe"
    assert medical_default == "heart attack"


def test_a_law_firm_prompt_includes_the_no_legal_advice_restriction(client, mock_db, monkeypatch):
    owner_id = _business(client, mock_db, monkeypatch, "industry-law@example.com", business_type="Law Firm")
    agent = _receptionist(mock_db, owner_id, FakeOpenAI())

    instructions = asyncio.run(agent.build_instructions())

    assert "give legal advice" in instructions
    # Master spec: Adoption, insurance dispute, debt collection removed
    law_template = get_industry_template("Law Firm")
    assert "ADOPTION" not in law_template["supported_intents"]
    assert "INSURANCE_DISPUTE" not in law_template["supported_intents"]


def test_wellness_center_gets_wellness_vocabulary_in_its_prompt(client, mock_db, monkeypatch):
    owner_id = _business(client, mock_db, monkeypatch, "industry-wellness@example.com", business_type="Wellness Center")
    agent = _receptionist(mock_db, owner_id, FakeOpenAI())

    instructions = asyncio.run(agent.build_instructions())

    assert "IV_HYDRATION" in instructions or "CRYOTHERAPY" in instructions
    template = get_industry_template("Wellness Center")
    assert "CONTRAINDICATION_SCREENING" in template["supported_intents"]


def test_car_dealership_gets_inventory_and_test_drive_in_its_prompt(client, mock_db, monkeypatch):
    owner_id = _business(client, mock_db, monkeypatch, "industry-dealer@example.com", business_type="Car Dealership")
    agent = _receptionist(mock_db, owner_id, FakeOpenAI())

    instructions = asyncio.run(agent.build_instructions())

    assert "TEST_DRIVE_SCHEDULE" in instructions or "NEW_INVENTORY" in instructions
    template = get_industry_template("Car Dealership")
    assert "TRADE_IN_VALUATION" in template["supported_intents"]


def test_deprecated_industries_are_removed():
    # Master Spec: Restaurant and Auto Repair Shop removed as dedicated templates
    assert "Restaurant" not in INDUSTRY_TEMPLATES
    assert "Auto Repair Shop" not in INDUSTRY_TEMPLATES
    assert "Salon / Spa" not in INDUSTRY_TEMPLATES
    assert "Fitness Studio / Gym" not in INDUSTRY_TEMPLATES
    assert "Retail Store" not in INDUSTRY_TEMPLATES
    assert "Photography Studio" not in INDUSTRY_TEMPLATES
    assert "Insurance Agency" not in INDUSTRY_TEMPLATES


def test_an_unrecognized_business_type_still_builds_a_valid_prompt(client, mock_db, monkeypatch):
    owner_id = _business(client, mock_db, monkeypatch, "industry-custom@example.com", business_type="A totally made-up thing")
    agent = _receptionist(mock_db, owner_id, FakeOpenAI())

    instructions = asyncio.run(agent.build_instructions())

    assert "GENERAL_INQUIRY" in instructions


def test_a_blank_business_type_still_builds_a_valid_prompt(client, mock_db, monkeypatch):
    owner_id = _business(client, mock_db, monkeypatch, "industry-blank@example.com")
    agent = _receptionist(mock_db, owner_id, FakeOpenAI())

    instructions = asyncio.run(agent.build_instructions())

    assert "GENERAL_INQUIRY" in instructions


def test_a_veterinary_clinic_prompt_never_leaks_dental_vocabulary(client, mock_db, monkeypatch):
    owner_id = _business(client, mock_db, monkeypatch, "industry-vet@example.com", business_type="Veterinary Clinic")
    agent = _receptionist(mock_db, owner_id, FakeOpenAI())

    instructions = asyncio.run(agent.build_instructions())

    assert "SICK_PET" in instructions
    assert "TOOTH_PAIN" not in instructions


def test_get_industry_template_is_case_and_whitespace_sensitive_by_design_and_falls_back_safely():
    # Exact-match only (matches the owner's own picklist); anything else is the
    # generic fallback rather than a fuzzy guess.
    assert get_industry_template("dental clinic")["supported_intents"] == get_industry_template(None)["supported_intents"]
    assert get_industry_template("Dental Clinic")["supported_intents"] != get_industry_template(None)["supported_intents"]
