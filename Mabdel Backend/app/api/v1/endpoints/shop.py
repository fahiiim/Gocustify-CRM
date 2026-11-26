from __future__ import annotations

from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from starlette.datastructures import UploadFile

from app.core.exceptions import AppException
from app.core.security_filters import safe_search_or, safe_regex
from app.dependencies import get_current_user, get_mongo_database, require_role
from app.services.media_storage_service import MediaStorageService
from app.utils.helpers import utc_now

router = APIRouter(prefix="/shop", tags=["Shop"])


def _serialize_doc(doc: dict[str, Any]) -> dict[str, Any]:
    data: dict[str, Any] = {}
    for key, value in doc.items():
        if key == "_id":
            data["id"] = str(value)
            data["_id"] = str(value)
        elif isinstance(value, ObjectId):
            data[key] = str(value)
        else:
            data[key] = value
    return data


def _object_id_or_raw(value: str) -> ObjectId | str:
    return ObjectId(value) if ObjectId.is_valid(value) else value


def _search_filter(search: str | None) -> dict[str, Any]:
    return safe_search_or(["name", "category", "description"], search)


def get_media_storage_service() -> MediaStorageService:
    return MediaStorageService()


def _current_user_id(current_user: dict) -> str:
    return str(current_user.get("user_id") or current_user.get("_id") or current_user.get("id") or "system")


async def _request_payload(
    request: Request,
    *,
    media_storage: MediaStorageService | None = None,
    owner_id: str | None = None,
) -> dict[str, Any]:
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type:
        form = await request.form()
        payload: dict[str, Any] = {}
        for key, value in form.multi_items():
            if isinstance(value, UploadFile):
                if key in {"image", "imageFile", "file"} and value.filename and media_storage and owner_id:
                    stored = media_storage.store_image(
                        owner_id=owner_id,
                        folder="shop_products",
                        file_bytes=await value.read(),
                        content_type=value.content_type,
                        filename=value.filename,
                        label="Product image",
                    )
                    payload["imageUrl"] = stored.url
                    payload["imageMeta"] = {
                        "publicPath": stored.public_path,
                        "fileName": stored.filename,
                        "contentType": stored.content_type,
                        "sizeBytes": stored.size_bytes,
                    }
                continue
            payload[key] = value
        return payload

    try:
        return await request.json()
    except Exception:
        return {}


def _normalize_product_payload(payload: dict[str, Any]) -> dict[str, Any]:
    def as_bool(value: Any) -> bool:
        if isinstance(value, bool):
            return value
        return str(value).lower() in {"1", "true", "yes", "on", "active"}

    normalized: dict[str, Any] = {}
    if "name" in payload:
        normalized["name"] = str(payload.get("name") or "").strip()
    if "productName" in payload and "name" not in normalized:
        normalized["name"] = str(payload.get("productName") or "").strip()
    if "category" in payload:
        normalized["category"] = str(payload.get("category") or "").strip()
    if "description" in payload:
        normalized["description"] = str(payload.get("description") or "").strip()
    if "destinationUrl" in payload or "ctaUrl" in payload or "url" in payload:
        normalized["destinationUrl"] = payload.get("destinationUrl") or payload.get("ctaUrl") or payload.get("url")
        normalized["ctaUrl"] = normalized["destinationUrl"]
    if "imageUrl" in payload:
        normalized["imageUrl"] = payload.get("imageUrl")
    if "imageMeta" in payload:
        normalized["imageMeta"] = payload.get("imageMeta")
    if "price" in payload:
        try:
            normalized["price"] = float(payload.get("price") or 0)
        except (TypeError, ValueError):
            normalized["price"] = 0.0
    if "stock" in payload:
        try:
            normalized["stock"] = int(payload.get("stock") or 0)
        except (TypeError, ValueError):
            normalized["stock"] = 0
    if "isActive" in payload:
        normalized["isActive"] = as_bool(payload.get("isActive"))
    if "active" in payload and "isActive" not in normalized:
        normalized["isActive"] = as_bool(payload.get("active"))
    return normalized


@router.get("/admin/products")
async def admin_list_products(
    page: int = 1,
    limit: int = 100,
    q: str | None = None,
    search: str | None = None,
    category: str | None = None,
    active: bool | None = None,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    query = _search_filter(search or q)
    if category:
        query["category"] = category
    if active is not None:
        query["isActive"] = active

    offset = max(page - 1, 0) * limit
    total = await db.shop_products.count_documents(query)
    items = await db.shop_products.find(query).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
    return {
        "success": True,
        "data": [_serialize_doc(item) for item in items],
        "meta": {
            "page": page,
            "limit": limit,
            "totalItems": total,
            "totalPages": max(1, (total + limit - 1) // limit),
        },
    }


@router.get("/admin/products/table")
async def admin_list_products_table(
    page: int = 1,
    limit: int = 100,
    q: str | None = None,
    search: str | None = None,
    category: str | None = None,
    active: bool | None = None,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    return await admin_list_products(page, limit, q, search, category, active, current_user, db)


@router.post("/admin/products")
async def admin_create_product(
    request: Request,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
    media_storage: MediaStorageService = Depends(get_media_storage_service),
):
    payload = _normalize_product_payload(
        await _request_payload(request, media_storage=media_storage, owner_id=_current_user_id(current_user))
    )
    payload.setdefault("name", "Untitled Product")
    payload.setdefault("price", 0.0)
    payload.setdefault("isActive", False)
    payload["created_at"] = utc_now()
    payload["updated_at"] = utc_now()
    result = await db.shop_products.insert_one(payload)
    payload["id"] = str(result.inserted_id)
    payload["_id"] = str(result.inserted_id)
    return {"success": True, "data": payload, "message": "Product created"}


@router.patch("/admin/products/{product_id}/status")
async def admin_toggle_product_status(
    product_id: str,
    request: Request,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    payload = await _request_payload(request)
    is_active = bool(payload.get("isActive", payload.get("active", False)))
    result = await db.shop_products.update_one(
        {"_id": _object_id_or_raw(product_id)},
        {"$set": {"isActive": is_active, "updated_at": utc_now()}},
    )
    return {"success": True, "data": result.modified_count > 0, "message": "Product status updated"}


@router.patch("/admin/products/{product_id}")
@router.put("/admin/products/{product_id}")
async def admin_update_product(
    product_id: str,
    request: Request,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
    media_storage: MediaStorageService = Depends(get_media_storage_service),
):
    payload = _normalize_product_payload(
        await _request_payload(request, media_storage=media_storage, owner_id=_current_user_id(current_user))
    )
    payload["updated_at"] = utc_now()
    result = await db.shop_products.update_one(
        {"_id": _object_id_or_raw(product_id)},
        {"$set": payload},
    )
    return {"success": True, "data": result.modified_count > 0, "message": "Product updated"}


@router.delete("/admin/products/{product_id}")
async def admin_delete_product(
    product_id: str,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    result = await db.shop_products.delete_one({"_id": _object_id_or_raw(product_id)})
    return {"success": True, "data": result.deleted_count > 0, "message": "Product deleted"}


@router.get("/products")
async def list_shop_products(
    page: int = 1,
    limit: int = 100,
    q: str | None = None,
    search: str | None = None,
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    query = {"isActive": True, **_search_filter(search or q)}
    offset = max(page - 1, 0) * limit
    total = await db.shop_products.count_documents(query)
    items = await db.shop_products.find(query).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
    return {"success": True, "data": [_serialize_doc(item) for item in items], "meta": {"totalItems": total}}


@router.get("/products/{product_id}")
async def get_shop_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    item = await db.shop_products.find_one({"_id": _object_id_or_raw(product_id)})
    return {"success": bool(item), "data": _serialize_doc(item) if item else None}


# ─── CART & CHECKOUT ENDPOINTS (T26 / FEAT-CRM-04) ──────────────────────────

@router.get("/cart")
async def get_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    user_id = _current_user_id(current_user)
    cart = await db.shop_carts.find_one({"user_id": user_id})
    if not cart:
        return {"success": True, "data": {"items": [], "subtotal": 0.0, "total": 0.0}}
    return {"success": True, "data": _serialize_doc(cart)}


@router.post("/cart")
async def update_cart_item(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    user_id = _current_user_id(current_user)
    payload = await _request_payload(request)
    product_id = payload.get("productId") or payload.get("product_id")
    quantity = int(payload.get("quantity", 1))

    if not product_id:
        raise AppException(status_code=400, code="INVALID_PRODUCT", message="productId is required.")

    product = await db.shop_products.find_one({"_id": _object_id_or_raw(product_id)})
    if not product or not product.get("isActive", True):
        raise AppException(status_code=404, code="PRODUCT_NOT_FOUND", message="Product is unavailable.")

    cart = await db.shop_carts.find_one({"user_id": user_id}) or {"user_id": user_id, "items": []}
    items = cart.get("items", [])

    existing_item = next((item for item in items if str(item.get("productId")) == str(product_id)), None)
    if quantity <= 0:
        items = [item for item in items if str(item.get("productId")) != str(product_id)]
    elif existing_item:
        existing_item["quantity"] = quantity
        existing_item["price"] = float(product.get("price", 0.0))
        existing_item["name"] = product.get("name", "")
    else:
        items.append({
            "productId": str(product_id),
            "name": product.get("name", ""),
            "price": float(product.get("price", 0.0)),
            "quantity": quantity,
            "imageUrl": product.get("imageUrl"),
        })

    subtotal = sum(item["price"] * item["quantity"] for item in items)
    cart["items"] = items
    cart["subtotal"] = round(subtotal, 2)
    cart["total"] = round(subtotal, 2)
    cart["updated_at"] = utc_now()

    await db.shop_carts.update_one(
        {"user_id": user_id},
        {"$set": cart, "$setOnInsert": {"created_at": utc_now()}},
        upsert=True,
    )
    return {"success": True, "data": _serialize_doc(cart), "message": "Cart updated"}


@router.delete("/cart/{product_id}")
async def remove_cart_item(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    user_id = _current_user_id(current_user)
    cart = await db.shop_carts.find_one({"user_id": user_id})
    if cart:
        items = [item for item in cart.get("items", []) if str(item.get("productId")) != str(product_id)]
        subtotal = sum(item["price"] * item["quantity"] for item in items)
        await db.shop_carts.update_one(
            {"user_id": user_id},
            {"$set": {"items": items, "subtotal": round(subtotal, 2), "total": round(subtotal, 2), "updated_at": utc_now()}},
        )
    return {"success": True, "message": "Item removed from cart"}


@router.delete("/cart")
async def clear_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    user_id = _current_user_id(current_user)
    await db.shop_carts.delete_one({"user_id": user_id})
    return {"success": True, "message": "Cart cleared"}


@router.post("/checkout")
async def checkout(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
):
    user_id = _current_user_id(current_user)
    payload = await _request_payload(request)
    order_items = payload.get("items")

    if not order_items:
        cart = await db.shop_carts.find_one({"user_id": user_id})
        order_items = (cart or {}).get("items", [])

    if not order_items:
        raise AppException(status_code=400, code="EMPTY_CART", message="No items in cart to checkout.")

    validated_items = []
    subtotal = 0.0

    for item in order_items:
        p_id = item.get("productId") or item.get("product_id")
        qty = int(item.get("quantity", 1))
        product = await db.shop_products.find_one({"_id": _object_id_or_raw(p_id)})
        if not product or not product.get("isActive", True):
            raise AppException(status_code=400, code="INVALID_PRODUCT", message=f"Product {p_id} is unavailable.")

        unit_price = float(product.get("price", 0.0))
        line_total = round(unit_price * qty, 2)
        subtotal += line_total
        validated_items.append({
            "productId": str(p_id),
            "name": product.get("name"),
            "price": unit_price,
            "quantity": qty,
            "lineTotal": line_total,
        })

    order_doc = {
        "user_id": user_id,
        "items": validated_items,
        "subtotal": round(subtotal, 2),
        "tax": 0.0,
        "total": round(subtotal, 2),
        "status": "confirmed",
        "shipping_address": payload.get("shippingAddress") or payload.get("shipping_address"),
        "payment_method": payload.get("paymentMethod", "card"),
        "created_at": utc_now(),
        "updated_at": utc_now(),
    }
    res = await db.shop_orders.insert_one(order_doc)
    order_id = str(res.inserted_id)
    order_doc["id"] = order_id
    order_doc["_id"] = order_id

    # Clear user's cart upon checkout
    await db.shop_carts.delete_one({"user_id": user_id})

    return {
        "success": True,
        "data": _serialize_doc(order_doc),
        "message": "Order placed successfully",
    }
