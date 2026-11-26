from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.exceptions import AppException
from app.dependencies import get_mongo_database, get_redis_client
from app.repositories.auth_repository import AuthRepository
from app.repositories.otp_repository import OTPRepository
from app.repositories.token_repository import TokenRepository
from app.schemas.auth_schema import (
    CheckoutSessionResponse,
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SendOTPRequest,
    TokenResponse,
    UserResponse,
    VerifyOTPRequest,
)
from app.schemas.common import ApiErrorResponse, ApiResponse
from app.schemas.dashboard_schemas import OwnerCreateRequest
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.services.otp_service import OTPService
from app.services.rbac_service import RBACService
from app.utils.responses import success_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_email_service() -> EmailService:
    return EmailService()


def get_otp_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
    email_service: EmailService = Depends(get_email_service),
) -> OTPService:
    return OTPService(otp_repository=OTPRepository(db), email_service=email_service)


def get_auth_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
    otp_service: OTPService = Depends(get_otp_service),
) -> AuthService:
    return AuthService(
        auth_repository=AuthRepository(db),
        otp_service=otp_service,
        token_repository=TokenRepository(db),
    )


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[MessageResponse],
    responses={409: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
async def register(payload: RegisterRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict:
    result = await auth_service.register_user(payload)
    return success_response(data=result.model_dump(), message=result.message)


@router.post(
    "/login",
    response_model=ApiResponse[TokenResponse],
    responses={401: {"model": ApiErrorResponse}, 403: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
async def login(payload: LoginRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict:
    tokens = await auth_service.login_user(payload)
    return success_response(data=tokens.model_dump(), message="Login successful.")


@router.post(
    "/send-otp",
    response_model=ApiResponse[MessageResponse],
    responses={400: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}, 429: {"model": ApiErrorResponse}},
)
async def send_otp(payload: SendOTPRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict:
    result = await auth_service.send_otp(payload)
    return success_response(data=result.model_dump(), message=result.message)


@router.post(
    "/resend-otp",
    response_model=ApiResponse[MessageResponse],
    responses={400: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}, 429: {"model": ApiErrorResponse}},
)
async def resend_otp(payload: SendOTPRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict:
    result = await auth_service.resend_otp(payload)
    return success_response(data=result.model_dump(), message=result.message)


@router.post(
    "/verify-otp",
    response_model=ApiResponse[MessageResponse],
    responses={400: {"model": ApiErrorResponse}, 429: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
async def verify_otp(payload: VerifyOTPRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict:
    result = await auth_service.verify_otp(payload)
    return success_response(data=result.model_dump(), message=result.message)


@router.post(
    "/forgot-password",
    response_model=ApiResponse[MessageResponse],
    responses={404: {"model": ApiErrorResponse}, 429: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
async def forgot_password(payload: ForgotPasswordRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict:
    result = await auth_service.forgot_password(payload)
    return success_response(data=result.model_dump(), message=result.message)


@router.post(
    "/reset-password",
    response_model=ApiResponse[MessageResponse],
    responses={400: {"model": ApiErrorResponse}, 401: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
async def reset_password(payload: ResetPasswordRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict:
    result = await auth_service.reset_password(payload)
    return success_response(data=result.model_dump(), message=result.message)


@router.post(
    "/subscription-signup",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[CheckoutSessionResponse],
)
async def subscription_signup(
    payload: OwnerCreateRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict:
    # This endpoint used to create the account synchronously, before any payment
    # existed. It now only builds a Stripe Checkout Session and hands back its
    # URL — the account itself is created by provision_owner_from_checkout_session
    # (app/services/stripe_subscription_service.py), driven off the resulting
    # checkout.session.completed webhook, once Stripe actually confirms payment.
    from app.services.stripe_subscription_service import create_subscription_checkout_session

    trial_email = (payload.original_email or "").strip().lower()
    if trial_email == "fahimsarker0805@gmail.com":
        # Bypass Stripe subscription for Fahim: directly provision owner account with Enterprise tier
        import datetime as _dt
        from app.core.config import settings
        from app.core.security import hash_password
        from app.repositories.dashboard.rbac_repository import RBACRepository
        from app.services.smartflow.smartflow_orchestrator import SmartFlowService

        now = _dt.datetime.utcnow()
        existing = await db.users.find_one({"$or": [{"email": trial_email}, {"original_email": trial_email}]})
        if existing:
            new_user_id = str(existing["_id"])
            await db.users.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "password_hash": hash_password("Fahim1234!"),
                    "subscription_status": "active",
                    "subscription_tier": "enterprise",
                    "subscription_plan": "Enterprise VIP",
                    "role": "owner",
                    "primary_role": "owner",
                    "is_verified": True,
                    "updated_at": now,
                }}
            )
        else:
            user_doc = {
                "email": trial_email,
                "original_email": trial_email,
                "password_hash": hash_password("Fahim1234!"),
                "full_name": payload.full_name or "Fahim Sarker",
                "created_by": "system",
                "is_subordinate_account": False,
                "business_name": payload.business_name or "GoCustify Business",
                "business_address": payload.business_address or "Headquarters",
                "owner_dob": payload.owner_dob or "1995-01-01",
                "phone_no": payload.phone_no or "+15551234567",
                "business_type": payload.business_type or "Dental Clinic",
                "role": "owner",
                "primary_role": "owner",
                "roles": ["owner"],
                "is_verified": True,
                "is_active": True,
                "subscription_tier": "enterprise",
                "subscription_status": "active",
                "subscription_plan": "Enterprise VIP",
                "created_at": now,
                "updated_at": now,
            }
            res = await db.users.insert_one(user_doc)
            new_user_id = str(res.inserted_id)
            await db.users.update_one({"_id": res.inserted_id}, {"$set": {"organization_id": new_user_id}})

        await db.organizations.update_one(
            {"organization_id": new_user_id},
            {"$set": {
                "organization_id": new_user_id,
                "name": payload.business_name or "GoCustify Business",
                "owner_user_id": new_user_id,
                "business_type": payload.business_type or "Dental Clinic",
                "telnyx_setup_status": "active",
                "telnyx_phone_number": "+18005550199",
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now}},
            upsert=True,
        )

        repo = RBACRepository(db)
        role_doc = await repo.get_role_by_slug("owner")
        if role_doc:
            await repo.assign_role(
                user_id=new_user_id,
                role_id=str(role_doc["_id"]),
                role_slug="owner",
                assigned_by=new_user_id,
                organization_id=new_user_id,
            )

        smartflow = SmartFlowService(db)
        await smartflow.ensure_global_chat(
            organization_id=new_user_id,
            business_name=payload.business_name or "GoCustify Business",
            owner_id=new_user_id,
        )

        return success_response(
            data={"checkout_url": f"{settings.PUBLIC_FRONTEND_URL}/login?email=fahimsarker0805@gmail.com&status=active"},
            message="Subscription bypassed successfully. Account activated with Enterprise access.",
        )

    if payload.plan != "subscribe":
        if trial_email and await db.trial_history.find_one({"email": trial_email}):
            raise AppException(
                status_code=400,
                code="TRIAL_ALREADY_USED",
                message="This email has already used its free trial.",
            )

    checkout_url = create_subscription_checkout_session(payload)
    return success_response(data={"checkout_url": checkout_url}, message="Success")


@router.post(
    "/refresh-token",
    response_model=ApiResponse[TokenResponse],
    responses={401: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
async def refresh_token(payload: RefreshTokenRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict:
    result = await auth_service.refresh_access_token(payload)
    return success_response(data=result.model_dump(), message="Token refreshed successfully.")


@router.post(
    "/google",
    response_model=ApiResponse[TokenResponse],
    responses={400: {"model": ApiErrorResponse}, 401: {"model": ApiErrorResponse}, 503: {"model": ApiErrorResponse}},
)
async def google_login(payload: GoogleLoginRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict:
    result = await auth_service.google_login(payload)
    return success_response(data=result.model_dump(), message="Google login successful.")


@router.get(
    "/me",
    response_model=ApiResponse[UserResponse],
    responses={401: {"model": ApiErrorResponse}},
)
async def me(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
    db: AsyncIOMotorDatabase = Depends(get_mongo_database),
    redis_client=Depends(get_redis_client),
) -> dict:
    user = await auth_service.get_current_user(token)
    # The frontend has no other way to know a user's effective RBAC permissions
    # (e.g. calls:manage, grantable to a manager/staff beyond the owner default)
    # to conditionally show permission-gated UI like the Telnyx provisioning
    # section — it previously only ever checked role/primary_role.
    rbac = RBACService(db, redis_client)
    permissions = await rbac.get_user_permissions(user.id, user.role)
    data = user.model_dump()
    data["permissions"] = sorted(permissions)
    return success_response(data=data, message="Current user fetched successfully.")


@router.post(
    "/logout",
    response_model=ApiResponse[MessageResponse],
    responses={401: {"model": ApiErrorResponse}},
)
async def logout(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    result = await auth_service.logout(token)
    return success_response(data=result.model_dump(), message="Logged out successfully.")
