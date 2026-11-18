"""
PDF Invoice Generation Service.
Generates compliant, binary application/pdf streams without requiring native system dependencies.
"""
from __future__ import annotations

from io import BytesIO
from typing import Any, Dict, List, Union


def build_pdf_from_lines(lines: List[str]) -> bytes:
    """Builds a compliant PDF 1.4 binary document from text lines."""
    def escape(text: str) -> str:
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    content_lines = ["BT", "/F1 12 Tf", "50 780 Td", "16 TL"]
    first = True
    for line in lines:
        if first:
            content_lines.append(f"({escape(line)}) Tj")
            first = False
        else:
            content_lines.append("T*")
            content_lines.append(f"({escape(line)}) Tj")
    content_lines.append("ET")
    stream = "\n".join(content_lines).encode("latin-1", "replace")

    objects = [
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
        b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
        f"5 0 obj << /Length {len(stream)} >> stream\n".encode("latin-1") + stream + b"\nendstream endobj\n",
    ]

    buffer = BytesIO()
    buffer.write(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(buffer.tell())
        buffer.write(obj)
    xref_offset = buffer.tell()
    buffer.write(f"xref\n0 {len(offsets)}\n".encode("latin-1"))
    buffer.write(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        buffer.write(f"{offset:010d} 00000 n \n".encode("latin-1"))
    buffer.write((f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF").encode("latin-1"))
    return buffer.getvalue()


def generate_transaction_invoice_pdf(transaction: Any) -> bytes:
    """Renders a transaction record as an official platform PDF invoice."""
    trx_id = getattr(transaction, "transaction_id", None) or (transaction.get("transaction_id") if isinstance(transaction, dict) else "")
    plan = getattr(transaction, "plan_name", None) or (transaction.get("plan_name") if isinstance(transaction, dict) else "Subscription")
    date_val = getattr(transaction, "date", None) or (transaction.get("date") if isinstance(transaction, dict) else "")
    user_name = getattr(transaction, "user_name", None) or (transaction.get("user_name") if isinstance(transaction, dict) else "Customer")
    email = getattr(transaction, "email", None) or (transaction.get("email") if isinstance(transaction, dict) else "-")
    amount = getattr(transaction, "amount", None) or (transaction.get("amount") if isinstance(transaction, dict) else 0.0)
    account_number = getattr(transaction, "account_number", None) or (transaction.get("account_number") if isinstance(transaction, dict) else "****")

    lines = [
        "GoCustify Platform - Payment Receipt & Tax Invoice",
        "==================================================",
        "",
        f"Invoice / Transaction Ref: {trx_id}",
        f"Billing Date: {date_val}",
        f"Customer Name: {user_name}",
        f"Customer Email: {email}",
        f"Payment Method: Card ending in {account_number[-4:] if len(str(account_number)) >= 4 else account_number}",
        "",
        "Item Breakdown:",
        "--------------------------------------------------",
        f"Plan / Description: {plan}",
        f"Billing Period: Monthly Recurring",
        f"Total Paid: ${float(amount):.2f} USD",
        "Status: Paid (Confirmed)",
        "",
        "Thank you for your business with GoCustify!",
    ]
    return build_pdf_from_lines(lines)
