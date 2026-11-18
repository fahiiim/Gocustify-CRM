import pytest
import asyncio
from bson import ObjectId
from app.core.security import create_access_token

def _auth_user(mock_db, email: str = "customer@example.com") -> tuple[dict[str, str], str]:
    user_id = str(ObjectId())
    asyncio.run(mock_db.users.insert_one({
        "_id": ObjectId(user_id),
        "email": email,
        "full_name": "Shop Customer",
        "role": "user",
        "is_active": True,
        "is_verified": True,
    }))
    token = create_access_token(user_id, email)
    return {"Authorization": f"Bearer {token}"}, user_id

def test_shop_cart_and_checkout_flow(client, mock_db):
    headers, user_id = _auth_user(mock_db)

    # 1. Create active product
    p_oid = ObjectId()
    asyncio.run(mock_db.shop_products.insert_one({
        "_id": p_oid,
        "name": "Wireless Charging Pad",
        "price": 29.99,
        "isActive": True,
    }))
    product_id = str(p_oid)

    # 2. Add product to cart
    add_resp = client.post(
        "/api/v1/shop/cart",
        headers=headers,
        json={"productId": product_id, "quantity": 2},
    )
    assert add_resp.status_code == 200
    cart_data = add_resp.json()["data"]
    assert len(cart_data["items"]) == 1
    assert cart_data["items"][0]["quantity"] == 2
    assert cart_data["total"] == 59.98

    # 3. Get cart
    get_cart_resp = client.get("/api/v1/shop/cart", headers=headers)
    assert get_cart_resp.status_code == 200
    assert get_cart_resp.json()["data"]["total"] == 59.98

    # 4. Checkout cart
    checkout_resp = client.post(
        "/api/v1/shop/checkout",
        headers=headers,
        json={
            "shippingAddress": {"street": "123 Market St", "city": "Metropolis"},
            "paymentMethod": "credit_card",
        },
    )
    assert checkout_resp.status_code == 200
    order_data = checkout_resp.json()["data"]
    assert order_data["status"] == "confirmed"
    assert order_data["total"] == 59.98
    assert len(order_data["items"]) == 1

    # 5. Verify cart is cleared after checkout
    cleared_cart_resp = client.get("/api/v1/shop/cart", headers=headers)
    assert cleared_cart_resp.status_code == 200
    assert len(cleared_cart_resp.json()["data"]["items"]) == 0

def test_shop_checkout_empty_cart_fails(client, mock_db):
    headers, _ = _auth_user(mock_db, "empty_cart_user@example.com")
    resp = client.post("/api/v1/shop/checkout", headers=headers, json={})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "EMPTY_CART"
