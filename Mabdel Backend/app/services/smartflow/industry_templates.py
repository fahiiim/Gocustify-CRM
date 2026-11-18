"""Per-industry vocabulary/safety data for the AI receptionist, seeded directly from
the client's "GoCustify AI Receptionist" spec (Dentist/Medical/Chiropractor/... each
have their own "Supported Intents" list and restrictions in that document).

This is deliberately NOT a separate engine per industry (the spec itself says "do not
build separate AI systems for every industry; use one engine + templates"). It is just
extra context rendered into the same prompt every business type already gets, keyed by
the business's own `business_type` string (see ``BUSINESS_TYPE_OPTIONS`` in
``Mabdel Website/src/pages/Profile/tabs/AIConfigTab.jsx`` - the two must stay in sync).

``supported_intents`` is vocabulary/context for the model, never a hard classifier -
the spec is explicit that keyword/intent matching must stay natural-language, not
keyword-to-fixed-action. ``emergency_keywords`` are ADDED to the built-in universal
list and the owner's own custom ones, never replacing them. ``safety_restrictions``
are additional "must not" lines specific to that industry (e.g. a dental/medical
business's AI must never diagnose) - these are universal good practice, not merely
US-specific, so they are not geofenced.
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
            "REFERRAL_REQUEST",
        ],
        "emergency_keywords": ["trouble breathing", "severe bleeding", "serious swelling", "serious trauma"],
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
            "REFERRAL_REQUEST", "PRESCRIPTION_REQUEST", "MEDICAL_RECORDS", "LAB_QUESTION",
            "INSURANCE_QUESTION", "INSURANCE_ACCEPTED", "INSURANCE_IN_NETWORK", "INSURANCE_BENEFITS",
            "INSURANCE_VERIFICATION", "MEDICARE_QUESTION", "MEDICAID_QUESTION", "BILLING",
            "MEDICAL_CONCERN", "MEDICAL_EMERGENCY",
        ],
        "emergency_keywords": ["trouble breathing", "severe bleeding", "serious swelling", "serious trauma"],
        "safety_restrictions": [
            "diagnose a medical condition", "prescribe or change medication", "guarantee insurance coverage",
            "interpret clinical or lab results independently", "promise a specific treatment outcome",
        ],
    },
    "Chiropractor": {
        "supported_intents": [
            "NEW_PATIENT", "EXISTING_PATIENT", "CONSULTATION_REQUEST", "APPOINTMENT_SCHEDULE",
            "APPOINTMENT_RESCHEDULE", "APPOINTMENT_CANCEL", "APPOINTMENT_CONFIRM", "ADJUSTMENT_APPOINTMENT",
            "FOLLOW_UP_VISIT", "NEW_PATIENT_EXAM", "PAIN_OR_SYMPTOM_CONCERN", "INSURANCE_QUESTION",
            "INSURANCE_ACCEPTED", "INSURANCE_IN_NETWORK", "INSURANCE_BENEFITS", "INSURANCE_VERIFICATION",
            "PRICING", "BILLING", "RECORDS_REQUEST",
        ],
        "emergency_keywords": ["trouble breathing", "severe bleeding", "serious swelling", "serious trauma"],
        "safety_restrictions": [
            "diagnose a condition or tell a caller what condition they have",
            "promise that chiropractic treatment will cure or resolve a condition",
            "recommend unsafe self-treatment", "guarantee that insurance covers treatment",
            "interpret imaging or clinical results independently",
        ],
    },
    "Salon / Spa": {
        "supported_intents": [
            "APPOINTMENT_SCHEDULE", "APPOINTMENT_RESCHEDULE", "APPOINTMENT_CANCEL", "SERVICE_INQUIRY",
            "HAIRCUT", "HAIR_COLOR", "NAILS", "FACIAL", "MASSAGE", "WAXING", "LASHES", "BROWS",
            "STYLIST_REQUEST", "PRICING",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [],
    },
    "Law Firm": {
        "supported_intents": [
            "NEW_POTENTIAL_CLIENT", "EXISTING_CLIENT", "CONSULTATION_REQUEST", "CONSULTATION_RESCHEDULE",
            "CONSULTATION_CANCEL", "CASE_STATUS_REQUEST", "ATTORNEY_CALLBACK", "DOCUMENT_REQUEST",
            "BILLING", "PERSONAL_INJURY", "FAMILY_LAW", "CRIMINAL_DEFENSE", "IMMIGRATION", "BUSINESS_LAW",
            "ESTATE_PLANNING", "REAL_ESTATE_LAW", "EMPLOYMENT_LAW", "BANKRUPTCY",
        ],
        "emergency_keywords": [],
        "safety_restrictions": ["give legal advice", "predict a case outcome", "claim an attorney-client relationship exists"],
    },
    "Real Estate Agency": {
        "supported_intents": [
            "BUYER_LEAD", "SELLER_LEAD", "RENTER_LEAD", "PROPERTY_INQUIRY", "SHOWING_REQUEST",
            "SHOWING_RESCHEDULE", "SHOWING_CANCEL", "LISTING_CONSULTATION", "PROPERTY_VALUE_REQUEST",
            "OPEN_HOUSE", "AGENT_CALLBACK",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [],
    },
    "Home Services (Plumbing, Electrical, HVAC)": {
        "supported_intents": [
            "NEW_SERVICE_REQUEST", "SERVICE_APPOINTMENT", "RESCHEDULE_SERVICE", "CANCEL_SERVICE",
            "ESTIMATE_REQUEST", "ESTIMATE_FOLLOW_UP", "TECHNICIAN_STATUS", "EXISTING_JOB", "WARRANTY",
            "MAINTENANCE", "EMERGENCY_SERVICE", "BILLING", "SERVICE_AREA", "PRICING",
            "AC_NOT_COOLING", "HEATING_NOT_WORKING", "LEAK", "CLOGGED_DRAIN", "WATER_HEATER",
            "POWER_ISSUE", "OUTLET_ISSUE", "PANEL_UPGRADE",
        ],
        "emergency_keywords": ["fire", "smoke", "gas smell", "carbon monoxide", "electrical hazard", "flooding"],
        "safety_restrictions": ["give dangerous electrical, gas, fire, or other hazardous repair instructions"],
    },
    "Restaurant": {
        "supported_intents": [
            "NEW_RESERVATION", "RESERVATION_CHANGE", "RESERVATION_CANCEL", "RESERVATION_CONFIRM",
            "WAITLIST", "MENU_QUESTION", "HOURS", "LOCATION", "PRIVATE_EVENT", "CATERING",
            "LARGE_PARTY", "TAKEOUT_STATUS", "COMPLAINT", "MANAGER_REQUEST",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [],
    },
    "Auto Repair Shop": {
        "supported_intents": [
            "SERVICE_APPOINTMENT", "RESCHEDULE_SERVICE", "CANCEL_SERVICE", "DIAGNOSTIC_REQUEST",
            "OIL_CHANGE", "BRAKES", "TIRES", "ENGINE", "TRANSMISSION", "BATTERY", "AC_REPAIR",
            "INSPECTION", "ESTIMATE_REQUEST", "REPAIR_STATUS", "VEHICLE_READY", "TOWING", "BILLING",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [],
    },
    "Fitness Studio / Gym": {
        "supported_intents": [
            "MEMBERSHIP_INQUIRY", "NEW_MEMBERSHIP", "MEMBERSHIP_CANCEL", "MEMBERSHIP_FREEZE",
            "CLASS_BOOKING", "CLASS_RESCHEDULE", "CLASS_CANCEL", "PERSONAL_TRAINING", "TRIAL_CLASS",
            "TOUR_REQUEST", "CLASS_SCHEDULE", "PRICING", "BILLING",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [],
    },
    "Retail Store": {
        "supported_intents": [
            "PRODUCT_AVAILABILITY", "PRODUCT_INFORMATION", "ORDER_STATUS", "ORDER_PICKUP", "ORDER_CANCEL",
            "RETURN_REQUEST", "EXCHANGE_REQUEST", "REFUND_STATUS", "STORE_HOURS", "STORE_LOCATION",
            "PROMOTION", "MANAGER_REQUEST", "COMPLAINT",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [],
    },
    "Accounting / Bookkeeping Firm": {
        "supported_intents": [
            "NEW_CLIENT", "EXISTING_CLIENT", "CONSULTATION_REQUEST", "CONSULTATION_RESCHEDULE",
            "CONSULTATION_CANCEL", "TAX_PREPARATION", "BOOKKEEPING", "PAYROLL", "BUSINESS_TAX",
            "PERSONAL_TAX", "IRS_NOTICE", "DOCUMENT_REQUEST", "INVOICE_QUESTION", "PAYMENT_QUESTION",
            "ACCOUNTANT_CALLBACK",
        ],
        "emergency_keywords": [],
        "safety_restrictions": ["provide unsupported tax or legal conclusions"],
    },
    "Insurance Agency": {
        "supported_intents": [
            "NEW_QUOTE", "EXISTING_POLICY", "AUTO_INSURANCE", "HOME_INSURANCE", "RENTERS_INSURANCE",
            "COMMERCIAL_INSURANCE", "LIFE_INSURANCE", "POLICY_CHANGE_REQUEST", "POLICY_RENEWAL",
            "PAYMENT_QUESTION", "CLAIM_QUESTION", "CLAIM_STATUS", "DOCUMENT_REQUEST", "AGENT_CALLBACK",
            "APPOINTMENT",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [
            "falsely claim to be a licensed insurance professional", "guarantee coverage",
            "make an unauthorized policy determination",
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
    "Photography Studio": {
        "supported_intents": [
            "NEW_INQUIRY", "SESSION_BOOKING", "RESCHEDULE_SESSION", "CANCEL_SESSION", "WEDDING_PHOTOGRAPHY",
            "PORTRAIT_SESSION", "FAMILY_SESSION", "EVENT_PHOTOGRAPHY", "COMMERCIAL_PHOTOGRAPHY",
            "REAL_ESTATE_PHOTOGRAPHY", "PRICING", "PACKAGE_QUESTION", "AVAILABILITY", "PHOTO_DELIVERY",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [],
    },
    "Consulting Firm": {
        "supported_intents": [
            "NEW_LEAD", "EXISTING_CLIENT", "CONSULTATION_REQUEST", "CONSULTATION_RESCHEDULE",
            "CONSULTATION_CANCEL", "SERVICE_INQUIRY", "PROJECT_STATUS", "PROPOSAL_QUESTION", "PRICING",
            "CONTRACT", "DOCUMENT_REQUEST", "CONSULTANT_CALLBACK", "BILLING",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [],
    },
    UNRECOGNIZED_BUSINESS_TYPE_FALLBACK: {
        "supported_intents": [
            "GENERAL_INQUIRY", "NEW_CUSTOMER", "EXISTING_CUSTOMER", "APPOINTMENT_SCHEDULE",
            "APPOINTMENT_RESCHEDULE", "APPOINTMENT_CANCEL", "SERVICE_REQUEST", "QUOTE_REQUEST",
            "ORDER_STATUS", "BILLING", "PRICING", "PRODUCT_INFORMATION", "SERVICE_INFORMATION",
            "BUSINESS_HOURS", "LOCATION",
        ],
        "emergency_keywords": [],
        "safety_restrictions": [],
    },
}


def get_industry_template(business_type: str | None) -> dict:
    """Named types match exactly (same list the owner picks from in Settings); anything
    else - blank, a custom/"Other" business type, or free text the owner typed - safely
    falls back to the generic template rather than ever failing to build a prompt."""
    return INDUSTRY_TEMPLATES.get((business_type or "").strip()) or INDUSTRY_TEMPLATES[UNRECOGNIZED_BUSINESS_TYPE_FALLBACK]


# Business types where "do you take my insurance" comes up. Only used to help the
# model RECOGNIZE an insurer name the caller says - recognition is never itself an
# answer; the owner's own configured `insurance_plans` is the only source of truth
# for whether a plan is actually accepted (see InsurancePlan in app/schemas/smartflow.py).
INSURANCE_ELIGIBLE_BUSINESS_TYPES = {"Dental Clinic", "Medical Clinic", "Chiropractor"}

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
}


def is_insurance_eligible_business_type(business_type: str | None) -> bool:
    return (business_type or "").strip() in INSURANCE_ELIGIBLE_BUSINESS_TYPES


def get_insurance_recognition_dictionary(business_type: str | None) -> list[str]:
    return INSURANCE_RECOGNITION_DICTIONARY.get((business_type or "").strip(), [])


INDUSTRY_PRESETS: dict[str, dict] = {
    "Dental Clinic": {
        "display_name": "Dentist (Dental Clinic)",
        "icon": "tooth",
        "summary": "Preloaded: dental intents, services, insurance, and phrasing.",
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
            {"id": "staff_smith", "name": "Dr. Smith", "role": "General Dentist", "active": True},
            {"id": "staff_jones", "name": "Dr. Jones", "role": "Implant & Surgery", "active": True},
            {"id": "staff_lisa", "name": "Lisa R.", "role": "Hygienist", "active": True},
            {"id": "staff_front", "name": "Front Desk", "role": "Scheduling & Calls", "active": True},
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
            {"query": "Do you take Delta Dental?", "intent": "Insurance Question", "entity": "Delta Dental", "lookup": "Found: Delta Dental - PPO | In-Network", "action": "Provide insurance info (No transfer)", "reply": "Yes, BrightSmile Dental Care is in-network with Delta Dental PPO. Your specific benefits and coverage may still require verification with Delta Dental."},
            {"query": "I'd like to schedule a cleaning.", "intent": "Book Appointment", "entity": "Routine Cleaning", "lookup": "Slot available: Tomorrow 10:00 AM", "action": "Book directly in calendar", "reply": "I would be happy to help schedule your routine dental cleaning. We have an opening with our hygienist tomorrow at 10:00 AM or Thursday at 2:30 PM. Which works best for you?"},
            {"query": "Can I reschedule my appointment?", "intent": "Reschedule Appointment", "entity": "Existing Appointment", "lookup": "Found appointment on Friday 3:00 PM", "action": "Reschedule in calendar", "reply": "Certainly! I see your appointment this Friday at 3:00 PM. What day and time would you prefer to move it to?"},
            {"query": "I'm a new patient, what do I need to do?", "intent": "New Patient Intake", "entity": "New Patient", "lookup": "Intake forms available online", "action": "Send new patient link & book exam", "reply": "Welcome to BrightSmile Dental Care! As a new patient, we recommend booking a comprehensive dental exam and cleaning. We will also send you a quick online intake form to complete before your visit."},
            {"query": "Do you offer payment plans?", "intent": "Billing / Payment Question", "entity": "Financing & Payment Plans", "lookup": "CareCredit & In-House Plans available", "action": "Share payment options", "reply": "Yes! We offer flexible in-house payment options and CareCredit financing with 0% interest for eligible treatments."},
        ],
    },
    "Medical Clinic": {
        "display_name": "Medical Clinic",
        "icon": "stethoscope",
        "summary": "Preloaded: medical intents, primary care services, insurance, and triage.",
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
    "Restaurant": {
        "display_name": "Restaurant",
        "icon": "utensils",
        "summary": "Preloaded: table reservations, party sizes, catering, and event booking.",
        "conditional_kind": "restaurant",
        "inbound_greeting": "Thank you for calling Bistro Belle. How can I help you with a reservation, private event, or menu inquiry today?",
        "outbound_greeting": "Hello {first_name}, this is Bistro Belle calling to confirm your dinner reservation for {date} at {time}.",
        "services": [
            {"id": "serv_dinner", "name": "Dinner Table Reservation", "duration_minutes": 90, "provider_role": "Dining Room Host", "active": True},
            {"id": "serv_large_party", "name": "Large Party (6-12 Guests)", "duration_minutes": 120, "provider_role": "Maitre D'", "active": True},
            {"id": "serv_private_event", "name": "Private Dining & Event", "duration_minutes": 180, "provider_role": "Event Coordinator", "active": True},
            {"id": "serv_catering", "name": "Off-Site Catering Inquiry", "duration_minutes": 30, "provider_role": "Catering Manager", "active": True},
        ],
        "staff": [
            {"id": "staff_host", "name": "Head Maitre D'", "role": "Floor & Seating Management", "active": True},
            {"id": "staff_gm", "name": "General Manager", "role": "Guest Relations & VIP", "active": True},
            {"id": "staff_events", "name": "Event Coordinator", "role": "Private Dining & Parties", "active": True},
        ],
        "custom_phrases": ["Our dining room", "Chef's tasting menu", "Private terrace", "Corkage policy"],
        "routing_rules": [
            {"id": "route_res", "name": "Table Reservations (1-6 Guests)", "trigger_description": "Standard dining reservation", "action": "Book table directly in OpenTable/Resy", "notify_target": "Host Stand"},
            {"id": "route_events", "name": "Parties of 7+ & Private Dining", "trigger_description": "Large group or banquet request", "action": "Event Coordinator", "notify_target": "Events Desk"},
            {"id": "route_takeout", "name": "Takeout & Delivery Orders", "trigger_description": "Caller placing food order", "action": "Direct to Online Ordering Link via SMS", "notify_target": "Kitchen POS"},
            {"id": "route_general", "name": "Hours & Dietary Info", "trigger_description": "Menu, vegan/gluten-free options, directions", "action": "AI answers from menu knowledge", "notify_target": "Front Host"},
        ],
        "insurance_plans": [],
        "conditional_data": {
            "title": "Reservations & Party Rules",
            "subtitle": "Party size limits, deposit policies, and catering options.",
            "max_automated_party_size": 8,
            "deposit_required_for_large_parties": "$25 per person for parties of 6+",
            "cancellation_window_hours": 24,
            "corkage_fee": "$35 per 750ml bottle (max 2 bottles)",
        },
        "sample_test_queries": [
            {"query": "Can I reserve a table for 4 this Friday at 7 PM?", "intent": "Book Table Reservation", "entity": "Party of 4 | Friday 7:00 PM", "lookup": "Found table available: Main Dining Room", "action": "Book table & send confirmation SMS", "reply": "I have a lovely table for 4 available this Friday at 7:00 PM or 7:30 PM. May I have your name and phone number to hold the reservation?"},
            {"query": "Do you accommodate gluten-free diets?", "intent": "Dietary Inquiry", "entity": "Gluten-Free Options", "lookup": "Menu info: Dedicated GF options available", "action": "Provide dietary guidelines", "reply": "Yes! Our chef offers a dedicated gluten-free menu including pasta and dessert selections. Please notify your server upon arrival so our kitchen takes proper precautions."},
            {"query": "Can I book a private room for 20 people?", "intent": "Private Dining Event", "entity": "Party of 20", "lookup": "Party size > 8: Requires Event Coordinator", "action": "Route to Event Coordinator & send banquet package", "reply": "We would love to host your party of 20 in our private Wine Cellar room! I will transfer your details to our Event Coordinator who will follow up with banquet menus and availability."},
            {"query": "What is your dress code?", "intent": "Restaurant Policies", "entity": "Dress Code", "lookup": "Policy: Smart Casual", "action": "Share dress code policy", "reply": "Our dress code is smart casual. We kindly ask guests to avoid athletic wear and flip-flops in the main dining room."},
        ],
    },
    "Auto Repair Shop": {
        "display_name": "Auto Repair Shop",
        "icon": "car",
        "summary": "Preloaded: vehicle diagnostics, maintenance types, towing, and service advisory.",
        "conditional_kind": "auto_repair",
        "inbound_greeting": "Thank you for calling Precision Auto Care. Are you calling for routine maintenance, a repair estimate, or diagnostics?",
        "outbound_greeting": "Hi {first_name}, this is Precision Auto letting you know your vehicle is ready for pickup.",
        "services": [
            {"id": "serv_oil", "name": "Synthetic Oil & Filter Service", "duration_minutes": 45, "provider_role": "Lube Tech", "active": True},
            {"id": "serv_brake", "name": "Brake Pad & Rotor Inspection", "duration_minutes": 60, "provider_role": "Brake Specialist", "active": True},
            {"id": "serv_diag", "name": "Check Engine Light Diagnostics", "duration_minutes": 60, "provider_role": "Master Diagnostic Tech", "active": True},
            {"id": "serv_tire", "name": "Tire Mount & Alignment", "duration_minutes": 60, "provider_role": "Alignment Tech", "active": True},
        ],
        "staff": [
            {"id": "staff_advisor", "name": "Service Advisor Desk", "role": "Customer Estimates & Intake", "active": True},
            {"id": "staff_master", "name": "Master Mechanic", "role": "Engine & Transmission Lead", "active": True},
            {"id": "staff_brakes", "name": "Chassis & Brake Specialist", "role": "Suspension & Brakes", "active": True},
        ],
        "custom_phrases": ["Our shop", "OEM parts", "Warranty covered", "Diagnostic scan"],
        "routing_rules": [
            {"id": "route_service", "name": "Service & Maintenance", "trigger_description": "Oil changes, tires, scheduled maintenance", "action": "Book bay slot in calendar", "notify_target": "Service Writer Bay"},
            {"id": "route_estimate", "name": "Repair Estimates & Status", "trigger_description": "Vehicle repair update or price quote", "action": "Service Advisor Desk", "notify_target": "Advisors Queue"},
            {"id": "route_towing", "name": "Towing & Breakdown", "trigger_description": "Stranded driver or vehicle drop-off", "action": "Transfer to Towing Dispatch Partner", "notify_target": "Towing Cell"},
            {"id": "route_general", "name": "Shop Hours & Location", "trigger_description": "Drop-off box, hours, warranties", "action": "AI answers or sends directions", "notify_target": "Shop Desk"},
        ],
        "insurance_plans": [],
        "conditional_data": {
            "title": "Vehicle Intake & Diagnostics",
            "subtitle": "Supported makes, diagnostic fees, and towing options.",
            "diagnostic_inspection_fee": "$99 (Credited toward approved repairs)",
            "loaner_vehicles": "Complimentary for repairs over $500",
            "accepted_makes": "All Domestic, Asian, and European vehicles",
            "towing_hotline": "24/7 Roadside Assistance Available",
        },
        "sample_test_queries": [
            {"query": "My check engine light is on, can I drop off my car?", "intent": "Diagnostic Service Request", "entity": "Check Engine Light", "lookup": "Diagnostic fee: $99 (Credited toward repair)", "action": "Book drop-off appointment", "reply": "Yes, we can perform a comprehensive computer diagnostic scan. Our diagnostic fee is $99, which is credited directly toward the repair if you proceed. We have drop-off slots available tomorrow morning at 8:00 AM."},
            {"query": "How much is a full synthetic oil change?", "intent": "Pricing Inquiry", "entity": "Synthetic Oil Change", "lookup": "Standard rate: $79.95 up to 5 qts", "action": "Provide oil service pricing", "reply": "Our full synthetic oil and filter service is $79.95 for up to 5 quarts of premium synthetic oil and includes a complimentary 21-point safety inspection."},
            {"query": "Do you repair European cars like BMW and Audi?", "intent": "Capability Inquiry", "entity": "European Vehicles", "lookup": "Specialty: BMW, Audi, Mercedes certified techs", "action": "Confirm specialty service", "reply": "Yes! We have ASE-certified technicians specialized in European models including BMW, Audi, and Mercedes with factory-grade diagnostic scanners."},
            {"query": "Is my vehicle ready for pickup?", "intent": "Vehicle Status Check", "entity": "Pickup Status", "lookup": "Connect to Service Advisor queue", "action": "Route to Service Advisor", "reply": "I can connect you with your Service Advisor to check the exact status of your vehicle. May I have your name and vehicle make/model?"},
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
            {"query": "I need to book a puppy wellness exam and rabies shot.", "intent": "Book Appointment", "entity": "Puppy Wellness & Rabies", "lookup": "Slot available: Thursday 3:00 PM", "action": "Book wellness appointment", "reply": "We would love to meet your new puppy! We have an opening for a comprehensive puppy wellness exam and vaccination booster this Thursday at 3:00 PM."},
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
