"""Per-industry vocabulary/safety data for the AI receptionist, seeded directly from
the client's "GoCustify AI Receptionist - FINAL VERIFIED MASTER DEVELOPER TASK" spec.

Active Verticals (Retained per Master Spec):
- Dentist (Dental Clinic)
- Medical Clinic
- Chiropractor
- Wellness Center
- Law Firm
- Real Estate Agency
- Home Services (Plumbing, Electrical, HVAC, Roofing, Cleaning, Pest Control)
- Car Dealership
- Accounting / Bookkeeping Firm
- Veterinary Clinic (legacy compatibility)
- Other / General Business (Universal fallback)

Removed / Deprecated Verticals per Master Spec (Pages 217-220):
- Restaurant (REMOVED)
- Auto Repair Shop (REMOVED - Car Dealership retained)
- Fitness Studio / Gym (REMOVED)
- Retail Store (REMOVED)
- Salon / Spa (REMOVED)
- Photography Studio (REMOVED)
- Insurance Agency (REMOVED)
- Home Services subcategories: Appliance Repair & Handyman (REMOVED)
- Law Firm practice areas: Adoption, Insurance Dispute, Creditor Debt Collection (REMOVED)
- Clinic intents: Referral Request (REMOVED)
"""

from __future__ import annotations

UNRECOGNIZED_BUSINESS_TYPE_FALLBACK = "Other"

INDUSTRY_TEMPLATES: dict[str, dict] = {
    "Dental Clinic": {
        "supported_intents": [
            "NEW_PATIENT", "EXISTING_PATIENT", "APPOINTMENT_SCHEDULE", "APPOINTMENT_RESCHEDULE",
            "APPOINTMENT_CANCEL", "APPOINTMENT_CONFIRM", "CLEANING", "DENTAL_EXAM", "TOOTH_PAIN",
            "DENTAL_EMERGENCY", "COSMETIC_DENTISTRY", "IMPLANT_CONSULTATION", "ORTHODONTICS",
            "INSURANCE_QUESTION", "INSURANCE_ACCEPTED", "INSURANCE_IN_NETWORK", "INSURANCE_BENEFITS",
            "INSURANCE_VERIFICATION", "BILLING", "PRICING", "PRESCRIPTION_REQUEST", "RECORDS_REQUEST",
        ],
        "emergency_keywords": [
            "trouble breathing", "severe bleeding", "serious swelling", "serious trauma",
            "uncontrolled bleeding", "facial swelling", "knocked out tooth",
        ],
        "safety_restrictions": [
            "diagnose a dental or medical condition", "prescribe or change medication",
            "guarantee insurance coverage", "interpret clinical or imaging results independently",
            "promise a specific treatment outcome",
        ],
    },
    "Medical Clinic": {
        "supported_intents": [
            "NEW_PATIENT", "EXISTING_PATIENT", "APPOINTMENT_SCHEDULE", "APPOINTMENT_RESCHEDULE",
            "APPOINTMENT_CANCEL", "APPOINTMENT_CONFIRM", "FOLLOW_UP_VISIT", "ANNUAL_EXAM",
            "PRESCRIPTION_REQUEST", "MEDICAL_RECORDS", "LAB_QUESTION",
            "INSURANCE_QUESTION", "INSURANCE_ACCEPTED", "INSURANCE_IN_NETWORK", "INSURANCE_BENEFITS",
            "INSURANCE_VERIFICATION", "MEDICARE_QUESTION", "MEDICAID_QUESTION", "BILLING",
            "MEDICAL_CONCERN", "MEDICAL_EMERGENCY",
        ],
        "emergency_keywords": [
            "chest pain", "shortness of breath", "stroke symptoms", "trouble breathing",
            "severe bleeding", "serious trauma", "loss of consciousness", "anaphylaxis",
        ],
        "safety_restrictions": [
            "diagnose a medical condition", "prescribe or change medication", "guarantee insurance coverage",
            "interpret clinical or lab results independently", "promise a specific treatment outcome",
        ],
    },
    "Chiropractor": {
        "supported_intents": [
            "NEW_PATIENT", "EXISTING_PATIENT", "CONSULTATION_REQUEST", "APPOINTMENT_SCHEDULE",
            "APPOINTMENT_RESCHEDULE", "APPOINTMENT_CANCEL", "APPOINTMENT_CONFIRM", "ADJUSTMENT_APPOINTMENT",
            "FOLLOW_UP_VISIT", "NEW_PATIENT_EXAM", "PAIN_OR_SYMPTOM_CONCERN", "AUTO_ACCIDENT_INTAKE",
            "PERSONAL_INJURY_INTAKE", "DECOMPRESSION_THERAPY", "MAINTENANCE_ADJUSTMENT",
            "INSURANCE_QUESTION", "INSURANCE_ACCEPTED", "INSURANCE_IN_NETWORK", "INSURANCE_BENEFITS",
            "INSURANCE_VERIFICATION", "PRICING", "BILLING", "RECORDS_REQUEST",
        ],
        "emergency_keywords": [
            "trouble breathing", "severe bleeding", "serious swelling", "serious trauma",
            "loss of bowel control", "sudden limb numbness",
        ],
        "safety_restrictions": [
            "diagnose a condition or tell a caller what condition they have",
            "promise that chiropractic treatment will cure or resolve a condition",
            "recommend unsafe self-treatment", "guarantee that insurance covers treatment",
            "interpret imaging or clinical results independently",
        ],
    },
    "Wellness Center": {
        "supported_intents": [
            "NEW_CLIENT", "EXISTING_CLIENT", "APPOINTMENT_SCHEDULE", "APPOINTMENT_RESCHEDULE",
            "APPOINTMENT_CANCEL", "APPOINTMENT_CONFIRM", "IV_HYDRATION", "CRYOTHERAPY",
            "INFRARED_SAUNA", "BODY_CONTOURING", "MASSAGE_THERAPY", "VITAMIN_INJECTION",
            "MEMBERSHIP_QUESTION", "PRICING", "CONTRAINDICATION_SCREENING", "PACKAGE_DEAL",
            "GIFT_CARD", "SERVICE_INQUIRY", "LOCATION_HOURS",
        ],
        "emergency_keywords": [
            "chest pain", "severe dizziness", "fainting", "allergic reaction",
            "anaphylaxis", "trouble breathing", "severe burn",
        ],
        "safety_restrictions": [
            "diagnose any medical disease or health condition",
            "claim wellness treatments cure medical diseases",
            "proceed with contra-indicated treatments for pregnant clients or clients with pacemakers without clearance",
        ],
    },
    "Law Firm": {
        "supported_intents": [
            "NEW_POTENTIAL_CLIENT", "EXISTING_CLIENT", "CONSULTATION_REQUEST", "CONSULTATION_RESCHEDULE",
            "CONSULTATION_CANCEL", "CASE_STATUS_REQUEST", "ATTORNEY_CALLBACK", "DOCUMENT_REQUEST",
            "BILLING", "PERSONAL_INJURY", "FAMILY_LAW", "CRIMINAL_DEFENSE", "IMMIGRATION", "BUSINESS_LAW",
            "ESTATE_PLANNING", "REAL_ESTATE_LAW", "EMPLOYMENT_LAW", "BANKRUPTCY", "CONFLICT_CHECK",
        ],
        "emergency_keywords": ["arrested", "in police custody", "jail", "imminent court deadline", "warrant"],
        "safety_restrictions": [
            "give legal advice", "predict a case outcome", "claim an attorney-client relationship exists",
            "guarantee settlement values or damages",
        ],
    },
    "Real Estate Agency": {
        "supported_intents": [
            "BUYER_LEAD", "SELLER_LEAD", "RENTER_LEAD", "PROPERTY_INQUIRY", "SHOWING_REQUEST",
            "SHOWING_RESCHEDULE", "SHOWING_CANCEL", "LISTING_CONSULTATION", "PROPERTY_VALUE_REQUEST",
            "OPEN_HOUSE", "AGENT_CALLBACK", "MORTGAGE_PREAPPROVAL_STATUS",
        ],
        "emergency_keywords": [],
        "safety_restrictions": ["provide discriminatory housing answers or violate fair housing regulations"],
    },
    "Home Services (Plumbing, Electrical, HVAC)": {
        "supported_intents": [
            "NEW_SERVICE_REQUEST", "SERVICE_APPOINTMENT", "RESCHEDULE_SERVICE", "CANCEL_SERVICE",
            "ESTIMATE_REQUEST", "ESTIMATE_FOLLOW_UP", "TECHNICIAN_STATUS", "EXISTING_JOB", "WARRANTY",
            "MAINTENANCE", "EMERGENCY_SERVICE", "BILLING", "SERVICE_AREA", "PRICING",
            "AC_NOT_COOLING", "HEATING_NOT_WORKING", "LEAK", "CLOGGED_DRAIN", "WATER_HEATER",
            "POWER_ISSUE", "OUTLET_ISSUE", "PANEL_UPGRADE", "ROOF_LEAK", "PEST_CONTROL",
            "LANDSCAPING", "CLEANING_SERVICE",
        ],
        "emergency_keywords": [
            "fire", "smoke", "gas smell", "carbon monoxide", "electrical hazard",
            "flooding", "burst pipe", "sewage backup",
        ],
        "safety_restrictions": ["give dangerous electrical, gas, fire, or other hazardous repair instructions"],
    },
    "Car Dealership": {
        "supported_intents": [
            "SALES_INQUIRY", "NEW_INVENTORY", "USED_INVENTORY", "TEST_DRIVE_SCHEDULE",
            "TEST_DRIVE_RESCHEDULE", "TEST_DRIVE_CANCEL", "TRADE_IN_VALUATION",
            "SERVICE_APPOINTMENT", "SERVICE_STATUS", "FINANCING_INQUIRY", "LEASE_RETURN",
            "DEALERSHIP_HOURS", "DEALERSHIP_LOCATION", "SALES_REP_CALLBACK",
        ],
        "emergency_keywords": ["accident on test drive", "tow needed", "stolen vehicle"],
        "safety_restrictions": [
            "guarantee credit approval or specific interest rates without formal application",
            "promise binding vehicle pricing or trade-in value before physical inspection",
        ],
    },
    "Accounting / Bookkeeping Firm": {
        "supported_intents": [
            "NEW_CLIENT", "EXISTING_CLIENT", "CONSULTATION_REQUEST", "CONSULTATION_RESCHEDULE",
            "CONSULTATION_CANCEL", "TAX_PREPARATION", "BOOKKEEPING", "PAYROLL", "BUSINESS_TAX",
            "PERSONAL_TAX", "IRS_NOTICE", "DOCUMENT_REQUEST", "INVOICE_QUESTION", "PAYMENT_QUESTION",
            "ACCOUNTANT_CALLBACK", "DOCUMENT_UPLOAD_LINK",
        ],
        "emergency_keywords": ["irs audit tomorrow", "levy", "bank freeze", "lien deadline"],
        "safety_restrictions": [
            "provide unsupported tax or legal conclusions",
            "guarantee specific tax refund amounts",
        ],
    },
    "Veterinary Clinic": {
        "supported_intents": [
            "NEW_CLIENT", "APPOINTMENT_SCHEDULE", "APPOINTMENT_RESCHEDULE", "APPOINTMENT_CANCEL",
            "WELLNESS_EXAM", "VACCINATION", "SICK_PET", "URGENT_PET_CONCERN", "EMERGENCY",
            "PRESCRIPTION_REQUEST", "RECORDS_REQUEST", "BOARDING", "GROOMING", "BILLING",
        ],
        "emergency_keywords": ["trouble breathing", "severe bleeding", "seizure", "serious trauma", "poisoning"],
        "safety_restrictions": ["diagnose a veterinary condition", "prescribe or change medication"],
    },
    UNRECOGNIZED_BUSINESS_TYPE_FALLBACK: {
        "supported_intents": [
            "GENERAL_INQUIRY", "NEW_CUSTOMER", "EXISTING_CUSTOMER", "APPOINTMENT_SCHEDULE",
            "APPOINTMENT_RESCHEDULE", "APPOINTMENT_CANCEL", "SERVICE_REQUEST", "QUOTE_REQUEST",
            "ORDER_STATUS", "BILLING", "PRICING", "PRODUCT_INFORMATION", "SERVICE_INFORMATION",
            "BUSINESS_HOURS", "LOCATION", "CALLBACK_REQUEST",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [],
    },
}


def get_industry_template(business_type: str | None) -> dict:
    """Named types match exactly; unlisted types fall back to generic template."""
    return INDUSTRY_TEMPLATES.get((business_type or "").strip()) or INDUSTRY_TEMPLATES[UNRECOGNIZED_BUSINESS_TYPE_FALLBACK]


INSURANCE_ELIGIBLE_BUSINESS_TYPES = {"Dental Clinic", "Medical Clinic", "Chiropractor", "Wellness Center"}

INSURANCE_RECOGNITION_DICTIONARY: dict[str, list[str]] = {
    "Dental Clinic": [
        "Delta Dental", "Cigna Dental", "Aetna Dental", "MetLife Dental", "Guardian",
        "UnitedHealthcare Dental", "Blue Cross Blue Shield Dental", "Humana Dental", "Ameritas",
        "Principal", "Sun Life", "United Concordia", "DentaQuest", "GEHA",
    ],
    "Medical Clinic": [
        "Blue Cross Blue Shield", "Anthem", "Aetna", "Cigna", "UnitedHealthcare", "Humana",
        "Medicare", "Medicaid", "Molina", "Ambetter", "Oscar", "TRICARE", "WellCare",
    ],
    "Chiropractor": [
        "Blue Cross Blue Shield", "Anthem", "Aetna", "Cigna", "UnitedHealthcare", "Humana",
        "Medicare", "Medicaid",
    ],
    "Wellness Center": [
        "HSA / FSA", "Blue Cross Blue Shield (Reimbursement)", "Aetna (Reimbursement)",
    ],
}


def is_insurance_eligible_business_type(business_type: str | None) -> bool:
    return (business_type or "").strip() in INSURANCE_ELIGIBLE_BUSINESS_TYPES


def get_insurance_recognition_dictionary(business_type: str | None) -> list[str]:
    return INSURANCE_RECOGNITION_DICTIONARY.get((business_type or "").strip(), [])


INDUSTRY_PRESETS: dict[str, dict] = {
    "Dental Clinic": {
        "display_name": "Dentist (Dental Clinic)",
        "icon": "tooth",
        "summary": "Preloaded: dental intents, cleaning/exam, toothache triage, insurance verification.",
        "conditional_kind": "insurance",
        "inbound_greeting": "Thank you for calling BrightSmile Dental Care. This is our virtual receptionist. How can I help you today?",
        "outbound_greeting": "Hi {first_name}, this is BrightSmile Dental Care with a quick reminder about your appointment on {date} at {time}. Please let us know if you need to reschedule.",
        "services": [
            {"id": "serv_cleaning", "name": "Routine Cleaning", "duration_minutes": 30, "provider_role": "Hygienist (Any)", "active": True},
            {"id": "serv_exam", "name": "Dental Exam", "duration_minutes": 30, "provider_role": "Dentist (Any)", "active": True},
            {"id": "serv_implant", "name": "Implant Consultation", "duration_minutes": 45, "provider_role": "Dr. Carter", "active": True},
            {"id": "serv_ortho", "name": "Orthodontics", "duration_minutes": 60, "provider_role": "Dr. Lee", "active": True},
        ],
        "staff": [
            {"id": "staff_smith", "name": "Dr. Smith", "role": "General Dentist", "working_days": [0, 1, 2, 3, 4], "working_hours": {"start_hour": 9, "end_hour": 17}, "active": True},
            {"id": "staff_jones", "name": "Dr. Jones", "role": "Implant Specialist", "working_days": [1, 3], "working_hours": {"start_hour": 9, "end_hour": 16}, "active": True},
            {"id": "staff_lisa", "name": "Lisa R. (Hygienist)", "role": "Dental Hygienist", "working_days": [0, 2], "working_hours": {"start_hour": 8, "end_hour": 17}, "active": True},
            {"id": "staff_front", "name": "Front Desk", "role": "Scheduling & Calls", "working_days": [0, 1, 2, 3, 4], "working_hours": {"start_hour": 8, "end_hour": 18}, "active": True},
        ],
        "custom_phrases": ["Our office", "Your next visit", "Dental team", "Accepted insurance"],
        "routing_rules": [
            {"id": "route_appts", "name": "Appointment Requests", "trigger_description": "Caller wants to schedule, reschedule, or cancel", "action": "Book directly in calendar", "notify_target": "Front Desk Calendar"},
            {"id": "route_billing", "name": "Billing / Insurance Questions", "trigger_description": "Caller has insurance or bill inquiry", "action": "Front Desk Team", "notify_target": "Billing Department"},
            {"id": "route_emergency", "name": "Urgent / Emergency", "trigger_description": "Severe tooth pain, bleeding, or trauma", "action": "Transfer to office (protected flow)", "notify_target": "On-Call Dentist"},
            {"id": "route_general", "name": "All Other Inquiries", "trigger_description": "Directions, parking, general info", "action": "AI handles or takes a message", "notify_target": "Front Desk Inbox"},
        ],
        "insurance_plans": [
            {"id": "ins_delta", "payer": "Delta Dental", "plan_name": "PPO", "network_status": "in_network", "verification_required": True, "active": True},
            {"id": "ins_aetna", "payer": "Aetna Dental", "plan_name": "PPO / HMO", "network_status": "plan_dependent", "verification_required": True, "active": True},
            {"id": "ins_cigna", "payer": "Cigna Dental", "plan_name": "PPO", "network_status": "in_network", "verification_required": True, "active": True},
            {"id": "ins_metlife", "payer": "MetLife Dental", "plan_name": "PPO", "network_status": "in_network", "verification_required": False, "active": True},
        ],
        "conditional_data": {
            "title": "Insurance (Healthcare Only)",
            "subtitle": "Accepted insurance plans, network status, and verification.",
            "description": "The AI answers insurance questions strictly from your configured plans.",
        },
        "sample_test_queries": [
            {"query": "Do you take Delta Dental, and what is the copay?", "intent": "Insurance Verification", "entity": "Delta Dental PPO", "lookup": "Found: Delta Dental - PPO | In-Network ($30 copay)", "action": "4-step insurance flow & explain $30 in-network copay", "reply": "Yes! BrightSmile Dental Care is in-network with Delta Dental PPO. For standard preventive cleanings and exams, your in-network copay is typically $30, which our office will verify prior to your visit."},
            {"query": "Can I schedule a cleaning with Lisa the hygienist on Friday?", "intent": "Provider Schedule Check", "entity": "Lisa R. (Hygienist)", "lookup": "Lisa works Mon & Wed only (Off on Friday)", "action": "Explain schedule & offer available days", "reply": "Our hygienist Lisa works on Mondays and Wednesdays from 8:00 AM to 5:00 PM. Would you like to schedule your routine cleaning with her next Monday at 10:00 AM or Wednesday at 2:00 PM?"},
            {"query": "I have an out-of-network HMO insurance, how much will a visit cost?", "intent": "Insurance Verification", "entity": "Out-of-Network HMO", "lookup": "Out-of-network policy ($80 fee)", "action": "Explain out-of-network copay & claim assistance", "reply": "For out-of-network HMO plans, your estimated visit fee is $80. Our office will provide full itemized receipts and documentation so you can submit for direct reimbursement with your carrier."},
            {"query": "Can I reschedule my appointment?", "intent": "Reschedule Appointment", "entity": "Existing Appointment", "lookup": "Found appointment on Friday 3:00 PM", "action": "Reschedule in calendar", "reply": "Certainly! I see your appointment this Friday at 3:00 PM. What day and time would you prefer to move it to?"},
            {"query": "I'm a new patient, what do I need to do?", "intent": "New Patient Intake", "entity": "New Patient", "lookup": "Intake forms available online", "action": "Send new patient link & book exam", "reply": "Welcome to BrightSmile Dental Care! As a new patient, we recommend booking a comprehensive dental exam and cleaning. We will also send you a quick online intake form to complete before your visit."},
            {"query": "Do you offer payment plans?", "intent": "Billing / Payment Question", "entity": "Financing & Payment Plans", "lookup": "CareCredit & In-House Plans available", "action": "Share payment options", "reply": "Yes! We offer flexible in-house payment options and CareCredit financing with 0% interest for eligible treatments."},
        ],
    },
    "Medical Clinic": {
        "display_name": "Medical Clinic",
        "icon": "stethoscope",
        "summary": "Preloaded: medical intents, primary care services, insurance, and life-safety triage.",
        "conditional_kind": "insurance",
        "inbound_greeting": "Thank you for calling Metro Community Health. How can I assist you with your appointment or medical care today?",
        "outbound_greeting": "Hi {first_name}, this is Metro Health Clinic with a reminder regarding your appointment on {date} at {time}.",
        "services": [
            {"id": "serv_physical", "name": "Annual Physical Exam", "duration_minutes": 45, "provider_role": "Primary Care Physician", "active": True},
            {"id": "serv_sick", "name": "Sick / Urgent Visit", "duration_minutes": 30, "provider_role": "Physician Assistant", "active": True},
            {"id": "serv_followup", "name": "Follow-Up Consultation", "duration_minutes": 30, "provider_role": "Attending Doctor", "active": True},
            {"id": "serv_refill", "name": "Prescription Review", "duration_minutes": 15, "provider_role": "Clinical Staff", "active": True},
        ],
        "staff": [
            {"id": "staff_dr_patel", "name": "Dr. Patel", "role": "Internal Medicine", "active": True},
            {"id": "staff_dr_chen", "name": "Dr. Chen", "role": "Family Medicine", "active": True},
            {"id": "staff_nurse", "name": "Nurse Manager", "role": "Clinical Triage", "active": True},
            {"id": "staff_front", "name": "Front Desk", "role": "Patient Intake", "active": True},
        ],
        "custom_phrases": ["Our clinic", "Medical records", "Lab results", "Care team"],
        "routing_rules": [
            {"id": "route_appts", "name": "Doctor Appointments", "trigger_description": "Schedule routine or urgent visit", "action": "Book directly in calendar", "notify_target": "Clinical Schedule"},
            {"id": "route_records", "name": "Medical Records & Labs", "trigger_description": "Lab results or record request", "action": "Nurse Desk", "notify_target": "Nursing Inbox"},
            {"id": "route_emergency", "name": "Medical Emergency", "trigger_description": "Chest pain, shortness of breath, severe distress", "action": "Transfer or direct to 911", "notify_target": "Urgent Care On-Call"},
            {"id": "route_general", "name": "All Other Inquiries", "trigger_description": "Hours, pharmacy fax, location", "action": "AI handles or takes a message", "notify_target": "Reception Desk"},
        ],
        "insurance_plans": [
            {"id": "ins_bcbs", "payer": "Blue Cross Blue Shield", "plan_name": "PPO / HMO", "network_status": "in_network", "verification_required": True, "active": True},
            {"id": "ins_medicare", "payer": "Medicare", "plan_name": "Part B", "network_status": "in_network", "verification_required": False, "active": True},
            {"id": "ins_uhc", "payer": "UnitedHealthcare", "plan_name": "Choice Plus", "network_status": "in_network", "verification_required": True, "active": True},
            {"id": "ins_aetna", "payer": "Aetna", "plan_name": "Open Choice", "network_status": "plan_dependent", "verification_required": True, "active": True},
        ],
        "conditional_data": {
            "title": "Insurance (Healthcare Only)",
            "subtitle": "Accepted medical insurance plans and verification.",
            "description": "The AI answers healthcare insurance inquiries directly from configured plans.",
        },
        "sample_test_queries": [
            {"query": "Do you accept Medicare?", "intent": "Insurance Question", "entity": "Medicare", "lookup": "Found: Medicare Part B | In-Network", "action": "Provide coverage info", "reply": "Yes, we accept Medicare Part B and are in-network. Copays and deductibles depend on your specific supplemental plan."},
            {"query": "I need to schedule an annual physical.", "intent": "Book Appointment", "entity": "Annual Physical Exam", "lookup": "Slot available: Monday 9:00 AM", "action": "Book in calendar", "reply": "I can help schedule your annual physical with Dr. Patel or Dr. Chen. We have an opening on Monday at 9:00 AM. Would that work?"},
            {"query": "Can I request a prescription refill?", "intent": "Prescription Refill", "entity": "Prescription Review", "lookup": "Pharmacy routing active", "action": "Capture medication details & notify nurse", "reply": "I can certainly take down your refill request. Please provide the medication name, dosage, and your preferred pharmacy."},
            {"query": "What are your clinic hours?", "intent": "Office Hours", "entity": "Business Hours", "lookup": "Hours: Mon-Fri 8:00 AM - 5:00 PM", "action": "Provide clinic hours", "reply": "Our clinic is open Monday through Friday from 8:00 AM to 5:00 PM. We also have Saturday morning hours for urgent visits from 9:00 AM to 1:00 PM."},
        ],
    },
    "Chiropractor": {
        "display_name": "Chiropractor",
        "icon": "bone",
        "summary": "Preloaded: chiropractic exams, adjustments, auto accident / PI intake, decompression therapy.",
        "conditional_kind": "insurance",
        "inbound_greeting": "Thank you for calling Spine & Wellness Chiropractic. Are you calling to schedule an adjustment, new patient consultation, or auto injury care?",
        "outbound_greeting": "Hi {first_name}, this is Spine & Wellness Chiropractic with a reminder about your appointment on {date} at {time}.",
        "services": [
            {"id": "serv_chiro_exam", "name": "New Patient Exam & Adjustment", "duration_minutes": 45, "provider_role": "Lead Chiropractor", "active": True},
            {"id": "serv_chiro_adjust", "name": "Routine Spinal Adjustment", "duration_minutes": 20, "provider_role": "Associate Chiropractor", "active": True},
            {"id": "serv_chiro_decomp", "name": "Spinal Decompression Therapy", "duration_minutes": 30, "provider_role": "Chiropractic Assistant", "active": True},
            {"id": "serv_chiro_pi", "name": "Auto Accident / PI Intake Exam", "duration_minutes": 60, "provider_role": "Lead Chiropractor", "active": True},
        ],
        "staff": [
            {"id": "staff_chiro_lead", "name": "Dr. Vance", "role": "Doctor of Chiropractic", "active": True},
            {"id": "staff_chiro_front", "name": "Front Desk Reception", "role": "Patient Intake & Scheduling", "active": True},
        ],
        "custom_phrases": ["Subluxation", "Adjustment", "Wellness care", "Personal injury claim"],
        "routing_rules": [
            {"id": "route_appts", "name": "Adjustments & Exams", "trigger_description": "Schedule routine or initial visit", "action": "Book in calendar", "notify_target": "Chiro Calendar"},
            {"id": "route_pi", "name": "Auto Accident / Attorney Cases", "trigger_description": "Personal injury or lien case", "action": "Route to Case Coordinator", "notify_target": "PI Coordinator"},
            {"id": "route_general", "name": "General Inquiries", "trigger_description": "Directions, pricing, hours", "action": "AI handles or takes a message", "notify_target": "Reception Desk"},
        ],
        "insurance_plans": [
            {"id": "ins_bcbs_chiro", "payer": "Blue Cross Blue Shield", "plan_name": "PPO", "network_status": "in_network", "verification_required": True, "active": True},
            {"id": "ins_medicare_chiro", "payer": "Medicare", "plan_name": "Part B", "network_status": "in_network", "verification_required": True, "active": True},
        ],
        "conditional_data": {
            "title": "Chiropractic & Insurance",
            "subtitle": "Coverage for adjustments, Medicare rules, and auto accident claims.",
        },
        "sample_test_queries": [
            {"query": "Do you accept insurance for adjustments?", "intent": "Insurance Question", "entity": "Health Insurance", "lookup": "Found: BCBS & Medicare In-Network", "action": "Explain coverage guidelines", "reply": "Yes, we accept major plans including Blue Cross Blue Shield and Medicare for spinal adjustments. We verify benefits prior to your first session."},
            {"query": "I was in a car accident and my neck hurts.", "intent": "Auto Accident Intake", "entity": "Personal Injury Claim", "lookup": "PI Intake workflow available", "action": "Screen auto accident intake details", "reply": "I am so sorry to hear about your accident. We specialize in auto accident recovery and accept third-party insurance and attorney liens. Can you share the date of the incident?"},
        ],
    },
    "Wellness Center": {
        "display_name": "Wellness Center",
        "icon": "sparkles",
        "summary": "Preloaded: IV hydration, cryotherapy, infrared sauna, massage, contraindication screening.",
        "conditional_kind": "wellness",
        "inbound_greeting": "Thank you for calling Radiant Health & Wellness Center. How can we support your recovery, wellness, and self-care today?",
        "outbound_greeting": "Hi {first_name}, this is Radiant Wellness with a reminder regarding your session on {date} at {time}.",
        "services": [
            {"id": "serv_iv", "name": "IV Vitamin Hydration Therapy", "duration_minutes": 45, "provider_role": "Registered Nurse", "active": True},
            {"id": "serv_cryo", "name": "Whole Body Cryotherapy", "duration_minutes": 15, "provider_role": "Cryo Technician", "active": True},
            {"id": "serv_sauna", "name": "Infrared Sauna Session", "duration_minutes": 40, "provider_role": "Wellness Associate", "active": True},
            {"id": "serv_massage", "name": "Deep Tissue Recovery Massage", "duration_minutes": 60, "provider_role": "Licensed Massage Therapist", "active": True},
        ],
        "staff": [
            {"id": "staff_nurse_lead", "name": "Sarah J., RN", "role": "Lead Infusion Nurse", "active": True},
            {"id": "staff_therapist", "name": "Marcus L., LMT", "role": "Massage Therapist", "active": True},
            {"id": "staff_desk", "name": "Front Desk Host", "role": "Client Intake & Scheduling", "active": True},
        ],
        "custom_phrases": ["Hydration drip", "Cryo chamber", "Infrared detox", "Contraindications"],
        "routing_rules": [
            {"id": "route_booking", "name": "Session Bookings", "trigger_description": "Book IV, sauna, or cryo", "action": "Book in calendar", "notify_target": "Wellness Schedule"},
            {"id": "route_contra", "name": "Health Pre-Screening", "trigger_description": "Pregnancy, pacemaker, or medical questions", "action": "Screen & route to Clinical Nurse", "notify_target": "Nurse Inbox"},
            {"id": "route_general", "name": "Pricing & Packages", "trigger_description": "Memberships, gift cards, hours", "action": "AI answers or sends link", "notify_target": "Front Desk"},
        ],
        "insurance_plans": [],
        "conditional_data": {
            "title": "Wellness Services & Contraindications",
            "subtitle": "Screening parameters for sauna, cryo, and IV drip protocols.",
            "contraindication_warnings": ["Pregnancy (Sauna/Cryo)", "Pacemaker (Cryo/Electric)", "Active blood clot (Massage)"],
        },
        "sample_test_queries": [
            {"query": "How much is an IV hydration drip?", "intent": "Pricing Inquiry", "entity": "IV Therapy", "lookup": "IV drips start at $129", "action": "Provide pricing details", "reply": "Our IV hydration drips start at $129 for the Myers Cocktail and immunity boosters. Would you like to book a 45-minute infusion session?"},
            {"query": "Can I do cryotherapy if I'm pregnant?", "intent": "Contraindication Inquiry", "entity": "Cryotherapy & Pregnancy", "lookup": "Contraindication: Pregnancy is restricted", "action": "Provide safety guideline & alternatives", "reply": "For your safety, whole-body cryotherapy is contraindicated during pregnancy. However, we offer pregnancy-safe prenatal massage and targeted hydration options with doctor clearance."},
        ],
    },
    "Law Firm": {
        "display_name": "Law Firm",
        "icon": "scale",
        "summary": "Preloaded: legal intake, practice areas, conflict checking, and consultation routing.",
        "conditional_kind": "legal",
        "inbound_greeting": "Thank you for calling Sterling & Vance Legal Counsel. How can our legal team assist you today?",
        "outbound_greeting": "Hello {first_name}, this is Sterling Law following up on your consultation request for {date}.",
        "services": [
            {"id": "serv_pi", "name": "Personal Injury Case Review", "duration_minutes": 45, "provider_role": "Litigation Partner", "active": True},
            {"id": "serv_family", "name": "Family Law Consultation", "duration_minutes": 60, "provider_role": "Associate Attorney", "active": True},
            {"id": "serv_business", "name": "Business & Contract Advisory", "duration_minutes": 60, "provider_role": "Corporate Counsel", "active": True},
            {"id": "serv_estate", "name": "Estate Planning & Wills", "duration_minutes": 60, "provider_role": "Estate Attorney", "active": True},
        ],
        "staff": [
            {"id": "staff_vance", "name": "Arthur Vance", "role": "Managing Partner", "active": True},
            {"id": "staff_sterling", "name": "Elena Sterling", "role": "Senior Litigator", "active": True},
            {"id": "staff_intake", "name": "Legal Intake Team", "role": "Client Intake & Screening", "active": True},
            {"id": "staff_paralegal", "name": "Paralegal Support", "role": "Case Management", "active": True},
        ],
        "custom_phrases": ["Our firm", "Confidential consultation", "Retainer agreement", "Case evaluation"],
        "routing_rules": [
            {"id": "route_new_client", "name": "New Potential Client", "trigger_description": "Caller seeking legal representation", "action": "Legal Intake Team", "notify_target": "Intake Queue"},
            {"id": "route_existing", "name": "Existing Client Status", "trigger_description": "Inquiry about an active case file", "action": "Assigned Paralegal / Attorney", "notify_target": "Case Manager"},
            {"id": "route_court", "name": "Urgent Court / Deposition", "trigger_description": "Court appearance, subpoena, immediate hearing", "action": "Transfer to Managing Partner", "notify_target": "Litigation Direct"},
            {"id": "route_general", "name": "General Inquiries", "trigger_description": "Directions, billing, documents", "action": "AI handles or takes message", "notify_target": "Firm Admin"},
        ],
        "insurance_plans": [],
        "conditional_data": {
            "title": "Legal Intake & Practice Areas",
            "subtitle": "Screening parameters, practice areas, and conflict checking rules.",
            "practice_areas": ["Personal Injury", "Family Law & Divorce", "Business Law", "Estate Planning", "Criminal Defense", "Immigration"],
            "conflict_check_required": True,
            "statute_of_limitations_warning": True,
            "intake_fee": "Free initial case assessment",
        },
        "sample_test_queries": [
            {"query": "I was injured in a car accident and need an attorney.", "intent": "Personal Injury Intake", "entity": "Auto Accident Claim", "lookup": "Practice Area: Personal Injury (Active)", "action": "Screen intake details & route to Intake Team", "reply": "I am very sorry to hear that. Our personal injury team provides free case reviews. Can you share the date of the accident and if medical attention was required?"},
            {"query": "Do you handle uncontested divorces?", "intent": "Family Law Consultation", "entity": "Uncontested Divorce", "lookup": "Practice Area: Family Law", "action": "Book 60 min consultation", "reply": "Yes, our family law team regularly assists with uncontested divorces and separation agreements. We can schedule a private 60-minute consultation with an attorney."},
            {"query": "What is your hourly consultation fee?", "intent": "Pricing Inquiry", "entity": "Consultation Rates", "lookup": "Fee schedule active", "action": "Explain fee structure & screening", "reply": "Personal injury and accident assessments are 100% free with no upfront cost. For business and estate consultations, we offer a flat-rate initial consultation of $250."},
            {"query": "I have an active case with Arthur Vance.", "intent": "Existing Client Callback", "entity": "Case Update", "lookup": "Found attorney: Arthur Vance", "action": "Route message to attorney queue", "reply": "Understood. I will notify Mr. Vance's paralegal immediately with your call details so they can pull your file and get back to you."},
        ],
    },
    "Real Estate Agency": {
        "display_name": "Real Estate Agency",
        "icon": "building",
        "summary": "Preloaded: property showings, buyer/seller intake, open houses, and agent dispatch.",
        "conditional_kind": "real_estate",
        "inbound_greeting": "Thank you for calling Horizon Realty Group. Are you looking to buy, sell, or schedule a property tour today?",
        "outbound_greeting": "Hi {first_name}, this is Horizon Realty following up on the property viewing you requested for {date}.",
        "services": [
            {"id": "serv_showing", "name": "Private Property Showing", "duration_minutes": 45, "provider_role": "Showing Agent", "active": True},
            {"id": "serv_listing", "name": "Home Valuation & Listing Consultation", "duration_minutes": 60, "provider_role": "Listing Specialist", "active": True},
            {"id": "serv_buyer_strategy", "name": "Buyer Strategy Session", "duration_minutes": 45, "provider_role": "Buyer Agent", "active": True},
            {"id": "serv_open_house", "name": "Open House Registration", "duration_minutes": 15, "provider_role": "Host Agent", "active": True},
        ],
        "staff": [
            {"id": "staff_broker", "name": "Managing Broker", "role": "Principal Broker", "active": True},
            {"id": "staff_listing", "name": "Senior Listing Agent", "role": "Seller Representative", "active": True},
            {"id": "staff_buyer", "name": "Buyer Specialist", "role": "Buyer Representative", "active": True},
        ],
        "custom_phrases": ["Active listing", "MLS number", "Escrow", "Private showing"],
        "routing_rules": [
            {"id": "route_showing", "name": "Showing Requests", "trigger_description": "Buyer wants to view a home", "action": "Showing Agent", "notify_target": "Showing Coordinator"},
            {"id": "route_seller", "name": "Seller & Valuation Leads", "trigger_description": "Owner wants to sell or get home value", "action": "Senior Listing Agent", "notify_target": "Listing Lead Queue"},
            {"id": "route_agent", "name": "Specific Agent Inquiries", "trigger_description": "Caller asks for an agent by name", "action": "Transfer directly to agent cell", "notify_target": "Agent Directory"},
            {"id": "route_general", "name": "Office & General Inquiries", "trigger_description": "Location, escrow docs, open houses", "action": "AI answers or logs lead", "notify_target": "Office Admin"},
        ],
        "insurance_plans": [],
        "conditional_data": {
            "title": "Property Inquiries & Showings",
            "subtitle": "Listing requirements, showing notice, and pre-qualification.",
            "showing_advance_notice": "24 hours advance notice required for occupied homes",
            "buyer_pre_approval_required": True,
            "property_categories": ["Single Family", "Condo / Townhome", "Multi-Family", "Commercial", "Land"],
        },
        "sample_test_queries": [
            {"query": "I would like to schedule a showing for 742 Evergreen Terrace.", "intent": "Schedule Property Showing", "entity": "742 Evergreen Terrace", "lookup": "Found active listing: 742 Evergreen Terrace", "action": "Verify buyer status & book showing", "reply": "I would love to help you view 742 Evergreen Terrace! We require 24 hours advance notice for occupied properties. Are you currently working with an agent, or pre-approved with a lender?"},
            {"query": "Are you holding open houses this weekend?", "intent": "Open House Inquiry", "entity": "Weekend Open Houses", "lookup": "Found 3 upcoming open houses", "action": "Provide open house schedule", "reply": "Yes! We have 3 open houses scheduled this Saturday and Sunday from 1:00 PM to 4:00 PM. I can text you the addresses and property sheets if you would like."},
            {"query": "Can you give me a market valuation on my home?", "intent": "Home Valuation Request", "entity": "Comparative Market Analysis", "lookup": "Connect to Listing Specialist", "action": "Capture address & book valuation consult", "reply": "We offer complimentary Comparative Market Analyses (CMA). Can you tell me your property address, bedroom/bathroom count, and your target timeline for selling?"},
        ],
    },
    "Home Services (Plumbing, Electrical, HVAC)": {
        "display_name": "Home Services (Plumbing, Electrical, HVAC)",
        "icon": "wrench",
        "summary": "Preloaded: trade dispatch, service area radius, emergency rates, and technician routing.",
        "conditional_kind": "home_services",
        "inbound_greeting": "Thank you for calling Apex Home Comfort & Repair. Are you experiencing an HVAC, plumbing, or electrical issue?",
        "outbound_greeting": "Hi {first_name}, this is Apex Home Services letting you know our technician is on the way for your {date} service.",
        "services": [
            {"id": "serv_hvac", "name": "HVAC Diagnostic & Inspection", "duration_minutes": 60, "provider_role": "HVAC Lead Tech", "active": True},
            {"id": "serv_plumbing", "name": "Plumbing Leak & Drain Repair", "duration_minutes": 60, "provider_role": "Master Plumber", "active": True},
            {"id": "serv_electrical", "name": "Electrical Troubleshooting", "duration_minutes": 60, "provider_role": "Licensed Electrician", "active": True},
            {"id": "serv_roofing", "name": "Roof Leak & Shingle Inspection", "duration_minutes": 60, "provider_role": "Roofing Specialist", "active": True},
            {"id": "serv_maintenance", "name": "Seasonal System Tune-Up", "duration_minutes": 45, "provider_role": "Maintenance Specialist", "active": True},
        ],
        "staff": [
            {"id": "staff_mike", "name": "Mike T.", "role": "Lead HVAC Specialist", "active": True},
            {"id": "staff_carlos", "name": "Carlos R.", "role": "Master Plumber", "active": True},
            {"id": "staff_dave", "name": "Dave K.", "role": "Licensed Electrician", "active": True},
            {"id": "staff_dispatch", "name": "Dispatch Desk", "role": "Fleet & Technician Dispatch", "active": True},
        ],
        "custom_phrases": ["Our technicians", "Service call fee", "Diagnostic report", "On-site estimate"],
        "routing_rules": [
            {"id": "route_service", "name": "Standard Service Calls", "trigger_description": "Routine repair or estimate request", "action": "Book technician dispatch window", "notify_target": "Dispatch Board"},
            {"id": "route_emergency", "name": "Flooding, Gas Smell, No Heat in Winter", "trigger_description": "Emergency service triggers", "action": "Transfer to On-Call Dispatcher", "notify_target": "Emergency Dispatch Cell"},
            {"id": "route_quote", "name": "Equipment Replacement Quote", "trigger_description": "New AC, furnace, or water heater installation", "action": "Route to Comfort Advisor", "notify_target": "Sales Estimator"},
            {"id": "route_general", "name": "General Questions", "trigger_description": "Billing, warranty, service area", "action": "AI answers or logs ticket", "notify_target": "Office Desk"},
        ],
        "insurance_plans": [],
        "conditional_data": {
            "title": "Service Area & Dispatch",
            "subtitle": "Coverage radius, zip codes, and dispatch rates.",
            "service_radius_miles": 25,
            "primary_zip_codes": ["10001", "10002", "10003", "10010", "10016"],
            "diagnostic_dispatch_fee": "$89 (Waived if repair approved)",
            "emergency_after_hours_fee": "$149",
        },
        "sample_test_queries": [
            {"query": "My air conditioner is blowing warm air.", "intent": "HVAC Service Request", "entity": "AC Not Cooling", "lookup": "Diagnostic Fee: $89 (Waived with repair)", "action": "Book tech dispatch window", "reply": "We can get a certified HVAC technician to your home today. Our standard diagnostic dispatch fee is $89, which is credited toward the repair if you proceed. What is your address?"},
            {"query": "Do you have emergency plumbers available today?", "intent": "Emergency Plumbing Request", "entity": "Emergency Dispatch", "lookup": "On-call plumber available", "action": "Flag emergency & transfer to dispatcher", "reply": "Yes, we have emergency plumbers on call right now. If you are experiencing a water leak, please shut off your main valve if possible while I connect you with dispatch."},
            {"query": "What is your service call fee?", "intent": "Pricing Inquiry", "entity": "Dispatch Fee", "lookup": "Fee: $89 standard / $149 after hours", "action": "Explain dispatch fees", "reply": "Our standard diagnostic dispatch fee is $89 during regular business hours, which is credited directly toward any work you approve. Emergency after-hours service is $149."},
            {"query": "Do you service zip code 10001?", "intent": "Service Area Check", "entity": "ZIP Code 10001", "lookup": "Found: 10001 is within primary service zone", "action": "Confirm area & prompt for booking", "reply": "Yes, zip code 10001 is directly in our primary service territory! What kind of service or repair do you need help with?"},
        ],
    },
    "Car Dealership": {
        "display_name": "Car Dealership",
        "icon": "car",
        "summary": "Preloaded: sales inventory, test drive booking, trade-in valuations, service bay scheduling.",
        "conditional_kind": "dealership",
        "inbound_greeting": "Thank you for calling Apex Motors. Are you looking to explore inventory, schedule a test drive, or book maintenance service?",
        "outbound_greeting": "Hi {first_name}, this is Apex Motors confirming your test drive appointment on {date} at {time}.",
        "services": [
            {"id": "serv_test_drive", "name": "Vehicle Test Drive Session", "duration_minutes": 45, "provider_role": "Product Specialist", "active": True},
            {"id": "serv_trade_eval", "name": "Trade-In Appraisal & Valuation", "duration_minutes": 30, "provider_role": "Appraisal Manager", "active": True},
            {"id": "serv_auto_maint", "name": "Dealership Maintenance & Service", "duration_minutes": 60, "provider_role": "Certified Service Advisor", "active": True},
            {"id": "serv_finance_consult", "name": "Financing & Lease Consultation", "duration_minutes": 45, "provider_role": "Finance Director", "active": True},
        ],
        "staff": [
            {"id": "staff_sales_mgr", "name": "Sales Desk", "role": "Sales & Test Drive Coordinator", "active": True},
            {"id": "staff_service_adv", "name": "Service Bay Advisor", "role": "Maintenance & Warranty", "active": True},
            {"id": "staff_appraiser", "name": "Pre-Owned Valuations", "role": "Trade-In Appraiser", "active": True},
        ],
        "custom_phrases": ["Current inventory", "Window sticker", "Trade-in value", "Certified Pre-Owned"],
        "routing_rules": [
            {"id": "route_sales", "name": "Sales & Inventory Inquiries", "trigger_description": "New/used car search or pricing", "action": "Sales Desk", "notify_target": "Sales Inbox"},
            {"id": "route_test_drive", "name": "Test Drive Bookings", "trigger_description": "Customer wants to test drive a vehicle", "action": "Book in calendar & notify rep", "notify_target": "Sales Calendar"},
            {"id": "route_service", "name": "Service & Maintenance Bay", "trigger_description": "Oil, brakes, recalls, warranty work", "action": "Book bay slot in calendar", "notify_target": "Service Bay Schedule"},
            {"id": "route_general", "name": "Hours & Dealership Location", "trigger_description": "Directions, showroom hours", "action": "AI answers directly", "notify_target": "Showroom Reception"},
        ],
        "insurance_plans": [],
        "conditional_data": {
            "title": "Inventory & Test Drive Rules",
            "subtitle": "Test drive requirements, trade-in process, and service bay windows.",
            "driver_license_required": True,
            "minimum_age_test_drive": 18,
            "trade_in_inspection_required": "In-person physical appraisal required for final valuation",
        },
        "sample_test_queries": [
            {"query": "Do you have any 2024 Honda CR-Vs in stock?", "intent": "Inventory Search", "entity": "2024 Honda CR-V", "lookup": "Found 3 matching vehicles in lot", "action": "Provide inventory details & offer test drive", "reply": "Yes! We currently have three 2024 Honda CR-V models in stock, including EX-L and Sport Touring trims. Would you like to schedule a test drive this afternoon?"},
            {"query": "Can I book a test drive for tomorrow?", "intent": "Test Drive Booking", "entity": "Test Drive", "lookup": "Slots available: Tomorrow 11:00 AM, 2:00 PM", "action": "Book test drive appointment", "reply": "I would love to set that up! We have test drive slots available tomorrow at 11:00 AM or 2:00 PM. Please bring your valid driver's license and proof of insurance."},
            {"query": "How do you evaluate trade-ins?", "intent": "Trade-In Valuation", "entity": "Vehicle Appraisal", "lookup": "Trade-in workflow active", "action": "Collect VIN/Mileage & book appraisal", "reply": "We offer top market value for trade-ins! I can take down your vehicle's year, make, model, and mileage for an instant estimate, followed by a quick 15-minute appraisal when you arrive."},
        ],
    },
    "Accounting / Bookkeeping Firm": {
        "display_name": "Accounting & Tax Firm",
        "icon": "calculator",
        "summary": "Preloaded: tax preparation, bookkeeping, payroll, IRS notice reviews, document upload link.",
        "conditional_kind": "accounting",
        "inbound_greeting": "Thank you for calling Apex CPA & Advisory. Are you calling for individual tax filing, business accounting, or an IRS notice review?",
        "outbound_greeting": "Hi {first_name}, this is Apex CPA following up regarding your upcoming tax consultation on {date} at {time}.",
        "services": [
            {"id": "serv_tax_prep", "name": "Tax Return Preparation & Filing", "duration_minutes": 60, "provider_role": "CPA / Tax Preparer", "active": True},
            {"id": "serv_biz_accounting", "name": "Monthly Bookkeeping & Payroll Review", "duration_minutes": 45, "provider_role": "Senior Accountant", "active": True},
            {"id": "serv_irs_notice", "name": "IRS Audit & Notice Consultation", "duration_minutes": 45, "provider_role": "Enrolled Agent / Partner", "active": True},
            {"id": "serv_tax_strategy", "name": "Business Tax Planning & Advisory", "duration_minutes": 60, "provider_role": "Managing Partner", "active": True},
        ],
        "staff": [
            {"id": "staff_cpa_lead", "name": "David Miller, CPA", "role": "Managing Partner", "active": True},
            {"id": "staff_bookkeeper", "name": "Sarah P.", "role": "Payroll & Bookkeeping Lead", "active": True},
            {"id": "staff_client_mgr", "name": "Client Services Desk", "role": "Document Intake & Scheduling", "active": True},
        ],
        "custom_phrases": ["Tax return", "W-2 / 1099", "IRS notice", "Secure client portal"],
        "routing_rules": [
            {"id": "route_tax_appts", "name": "Tax Filing Consultations", "trigger_description": "Schedule initial or annual tax review", "action": "Book in calendar", "notify_target": "Tax Season Schedule"},
            {"id": "route_irs", "name": "Urgent IRS Notices / Audits", "trigger_description": "Letters from IRS or state department", "action": "Flag priority & route to Partner", "notify_target": "Partner Direct"},
            {"id": "route_docs", "name": "Document Upload Link Request", "trigger_description": "Client sending W-2s, receipts, statements", "action": "Send secure portal upload SMS", "notify_target": "Portal Intake"},
            {"id": "route_general", "name": "General Inquiries", "trigger_description": "Hours, fees, status", "action": "AI answers or logs message", "notify_target": "Office Inbox"},
        ],
        "insurance_plans": [],
        "conditional_data": {
            "title": "Tax Filing & Portal Policies",
            "subtitle": "Deadlines, upload links, and initial consultation fees.",
            "tax_season_cutoff": "April 15 for personal returns; October 15 for extensions",
            "secure_portal_link": "https://portal.gocustify.com/documents",
        },
        "sample_test_queries": [
            {"query": "I received an IRS notice CP2000, what should I do?", "intent": "IRS Notice Consultation", "entity": "IRS Notice CP2000", "lookup": "Notice review priority active", "action": "Route to Partner & book consultation", "reply": "Don't panic — notice CP2000 is an inquiry, not a bill. Our CPAs can review the document with you. We can text you a link to securely upload a copy of the letter before your consultation."},
            {"query": "Can you text me a link to upload my W-2 forms?", "intent": "Document Upload Link", "entity": "Secure Portal", "lookup": "Secure portal automated SMS active", "action": "Send secure portal SMS link", "reply": "Absolutely! I have dispatched a secure link to your phone number where you can take photos or upload PDFs of your W-2s and tax documents."},
        ],
    },
    "Veterinary Clinic": {
        "display_name": "Veterinary Clinic",
        "icon": "paw",
        "summary": "Preloaded: pet care, wellness exams, vaccinations, pet insurance, and urgent triage.",
        "conditional_kind": "veterinary",
        "inbound_greeting": "Thank you for calling Paws & Whiskers Animal Hospital. How can we help care for your pet today?",
        "outbound_greeting": "Hi {first_name}, this is Paws & Whiskers calling with a reminder about your pet's appointment on {date} at {time}.",
        "services": [
            {"id": "serv_wellness", "name": "Annual Pet Wellness Exam", "duration_minutes": 30, "provider_role": "Veterinarian", "active": True},
            {"id": "serv_vax", "name": "Vaccination Booster Clinic", "duration_minutes": 20, "provider_role": "Vet Technician", "active": True},
            {"id": "serv_sick_pet", "name": "Sick Pet Clinical Exam", "duration_minutes": 45, "provider_role": "Senior Veterinarian", "active": True},
            {"id": "serv_dental_pet", "name": "Pet Dental Cleaning & Scaling", "duration_minutes": 60, "provider_role": "Dental Vet Specialist", "active": True},
        ],
        "staff": [
            {"id": "staff_chief_vet", "name": "Dr. Bailey", "role": "Chief Veterinarian", "active": True},
            {"id": "staff_assoc_vet", "name": "Dr. Kim", "role": "Associate Veterinarian", "active": True},
            {"id": "staff_vet_tech", "name": "Lead Vet Tech", "role": "Clinical Nursing & Triage", "active": True},
            {"id": "staff_front", "name": "Client Care Desk", "role": "Intake & Records", "active": True},
        ],
        "custom_phrases": ["Our clinic", "Wellness plan", "Microchip", "Rabies vaccination"],
        "routing_rules": [
            {"id": "route_appts", "name": "Routine Pet Appointments", "trigger_description": "Wellness, shots, microchips", "action": "Book directly in practice management", "notify_target": "Vet Schedule"},
            {"id": "route_emergency", "name": "Poisoning, Seizure, Bleeding", "trigger_description": "Critical pet emergency", "action": "Immediate Transfer to On-Call Vet", "notify_target": "Emergency Treatment Room"},
            {"id": "route_refills", "name": "Pet Medication & Food Orders", "trigger_description": "Flea/tick, prescription diet, heartworm", "action": "Pharmacy Tech", "notify_target": "Vet Pharmacy"},
            {"id": "route_general", "name": "Boarding, Grooming, Records", "trigger_description": "General non-urgent inquiries", "action": "AI answers or logs message", "notify_target": "Client Care"},
        ],
        "insurance_plans": [
            {"id": "ins_trupanion", "payer": "Trupanion", "plan_name": "Medical Policy", "network_status": "in_network", "verification_required": True, "active": True},
            {"id": "ins_nationwide", "payer": "Nationwide Pet", "plan_name": "Whole Pet", "network_status": "plan_dependent", "verification_required": True, "active": True},
            {"id": "ins_healthy_paws", "payer": "Healthy Paws", "plan_name": "Accident & Illness", "network_status": "in_network", "verification_required": False, "active": True},
        ],
        "conditional_data": {
            "title": "Pet Intake & Pet Insurance",
            "subtitle": "Accepted species, pet insurance plans, and triage rules.",
            "accepted_species": ["Canine (Dogs)", "Feline (Cats)", "Small Mammals (Rabbits, Guinea Pigs)"],
            "pet_insurance_accepted": True,
            "rabies_requirement": "Current rabies certificate required for all hospital visits",
        },
        "sample_test_queries": [
            {"query": "Do you accept Trupanion pet insurance?", "intent": "Pet Insurance Question", "entity": "Trupanion", "lookup": "Found: Trupanion Direct Pay Accepted", "action": "Provide pet insurance policy", "reply": "Yes! We accept Trupanion and support direct hospital payment at checkout, so you only pay your deductible and copay."},
            {"query": "My dog ate chocolate, what should I do?", "intent": "Urgent Pet Poisoning", "entity": "Chocolate Ingestion", "lookup": "Emergency triage triggered", "action": "Immediate transfer to ER vet", "reply": "Chocolate can be toxic to dogs. Please bring your dog to our hospital immediately or call the ASPCA Animal Poison Control hotline while I connect you directly with our emergency vet."},
        ],
    },
    "Other": {
        "display_name": "General Business",
        "icon": "briefcase",
        "summary": "Universal master setup: appointments, messages, general inquiry, and smart routing.",
        "conditional_kind": "general",
        "inbound_greeting": "Thank you for calling. This is our virtual receptionist. How can I help you today?",
        "outbound_greeting": "Hi {first_name}, this is a quick reminder regarding your upcoming appointment on {date} at {time}.",
        "services": [
            {"id": "serv_consult", "name": "General Consultation", "duration_minutes": 30, "provider_role": "Specialist", "active": True},
            {"id": "serv_meeting", "name": "Discovery Meeting", "duration_minutes": 45, "provider_role": "Manager", "active": True},
        ],
        "staff": [
            {"id": "staff_team", "name": "Client Services Team", "role": "Operations & Support", "active": True},
            {"id": "staff_manager", "name": "Office Manager", "role": "General Management", "active": True},
        ],
        "custom_phrases": ["Our office", "Our team", "Your appointment"],
        "routing_rules": [
            {"id": "route_appts", "name": "Appointment Booking", "trigger_description": "Schedule, reschedule, or cancel", "action": "Book directly in calendar", "notify_target": "Main Calendar"},
            {"id": "route_general", "name": "General Inquiries", "trigger_description": "Hours, pricing, info", "action": "AI answers or takes message", "notify_target": "Office Inbox"},
        ],
        "insurance_plans": [],
        "conditional_data": {
            "title": "General Business Details",
            "subtitle": "Custom parameters and options for your business.",
        },
        "sample_test_queries": [
            {"query": "What are your business hours?", "intent": "Business Hours", "entity": "Office Hours", "lookup": "Found hours: Mon-Fri 9:00 AM - 5:00 PM", "action": "Provide business hours", "reply": "We are open Monday through Friday from 9:00 AM to 5:00 PM. We are closed on weekends and major holidays."},
            {"query": "Can I schedule a consultation?", "intent": "Book Appointment", "entity": "General Consultation", "lookup": "Slot available: Tomorrow 2:00 PM", "action": "Book in calendar", "reply": "I would be happy to schedule a consultation for you. We have openings tomorrow at 2:00 PM or Wednesday at 10:30 AM. Which would you prefer?"},
        ],
    },
}


def get_industry_preset(business_type: str | None) -> dict:
    """Return the rich preset for an industry, falling back to General Business."""
    cleaned = (business_type or "").strip()
    return INDUSTRY_PRESETS.get(cleaned) or INDUSTRY_PRESETS["Other"]


def list_all_industry_presets() -> list[dict]:
    """Return all available industry presets as a list for UI menus."""
    results = []
    for key, val in INDUSTRY_PRESETS.items():
        results.append({
            "key": key,
            "display_name": val.get("display_name", key),
            "icon": val.get("icon", "briefcase"),
            "summary": val.get("summary", ""),
            "conditional_kind": val.get("conditional_kind", "general"),
        })
    return results
