import pytest
from bson import ObjectId
from app.services.invoice_generator import generate_transaction_invoice_pdf, build_pdf_from_lines
from app.schemas.dashboard_schemas import TransactionDetails
from app.tests.conftest import grant_role

def test_invoice_generator_pdf_structure():
    lines = ["Test Line 1", "Total: $100.00"]
    pdf_bytes = build_pdf_from_lines(lines)

    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-1.4")
    assert pdf_bytes.endswith(b"%%EOF")
    assert b"/Type /Catalog" in pdf_bytes
    assert b"/Type /Page" in pdf_bytes

def test_generate_transaction_invoice_pdf():
    trx = TransactionDetails(
        transaction_id="TRX-9988",
        plan_name="Growth Plan",
        date="2026-11-18",
        user_name="John Doe",
        account_number="**** **** **** 4242",
        email="john@example.com",
        amount=99.00,
    )
    pdf_bytes = generate_transaction_invoice_pdf(trx)

    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-1.4")
    assert pdf_bytes.endswith(b"%%EOF")
    assert b"TRX-9988" in pdf_bytes
    assert b"John Doe" in pdf_bytes

def test_admin_download_invoice_endpoint(client, mock_db):
    import asyncio
    from app.core.security import create_access_token
    # Setup admin user in db
    email = "superadmin_invoice@example.com"
    user_oid = ObjectId()
    asyncio.run(mock_db.users.insert_one({
        "_id": user_oid,
        "email": email,
        "full_name": "Invoice Admin",
        "role": "super_admin",
        "roles": ["super_admin"],
        "is_active": True,
        "is_verified": True,
    }))

    grant_role(mock_db, email, "super_admin")

    token = create_access_token(str(user_oid), email)
    headers = {"Authorization": f"Bearer {token}"}

    # Insert mock transaction/invoice
    trx_oid = ObjectId()
    asyncio.run(mock_db.invoices.insert_one({
        "_id": trx_oid,
        "transaction_id": "TRX-777",
        "plan_name": "Pro Plan",
        "user_name": "Alice Smith",
        "user_email": "alice@example.com",
        "total_amount": 15000,
        "account_number": "**** **** **** 1234",
    }))

    resp = client.get(f"/api/v1/dashboard/admin/earnings/transactions/TRX-777/invoice", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert "attachment; filename=\"invoice_TRX-777.pdf\"" in resp.headers["content-disposition"]
    assert resp.content.startswith(b"%PDF-1.4")
    assert resp.content.endswith(b"%%EOF")
