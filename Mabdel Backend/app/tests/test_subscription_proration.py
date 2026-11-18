import pytest
from unittest.mock import MagicMock, patch
from bson import ObjectId
from app.services.stripe_subscription_service import upgrade_subscription_tier
from app.core.exceptions import AppException

@pytest.mark.asyncio
async def test_upgrade_subscription_tier_proration(mock_db):
    user_id = str(ObjectId())
    await mock_db.users.insert_one({
        "_id": ObjectId(user_id),
        "email": "owner@example.com",
        "subscription_tier": "starter",
        "stripe_subscription_id": "sub_test123",
    })

    mock_sub = {
        "id": "sub_test123",
        "items": {"data": [{"id": "si_item123"}]},
        "status": "active",
    }

    mock_client = MagicMock()
    mock_client.subscriptions.retrieve.return_value = mock_sub
    mock_client.subscriptions.update.return_value = {"id": "sub_test123", "status": "active"}

    with patch("app.services.stripe_subscription_service._client", return_value=mock_client), \
         patch("app.services.stripe_subscription_service.settings") as mock_settings:
        mock_settings.STRIPE_PRICE_STARTER = "price_starter"
        mock_settings.STRIPE_PRICE_GROWTH = "price_growth"
        mock_settings.STRIPE_PRICE_PRO = "price_pro"

        res = await upgrade_subscription_tier(
            db=mock_db,
            user_id=user_id,
            new_tier="growth",
            proration_behavior="create_prorations",
        )

        assert res["subscription_tier"] == "growth"
        assert res["proration_behavior"] == "create_prorations"
        assert res["status"] == "active"

        mock_client.subscriptions.update.assert_called_once_with(
            "sub_test123",
            params={
                "items": [{"id": "si_item123", "price": "price_growth"}],
                "proration_behavior": "create_prorations",
            },
        )

        updated_user = await mock_db.users.find_one({"_id": ObjectId(user_id)})
        assert updated_user["subscription_tier"] == "growth"

@pytest.mark.asyncio
async def test_upgrade_subscription_tier_invalid_tier(mock_db):
    user_id = str(ObjectId())
    with pytest.raises(AppException) as exc_info:
        await upgrade_subscription_tier(
            db=mock_db,
            user_id=user_id,
            new_tier="enterprise_unknown",
        )
    assert exc_info.value.code == "INVALID_TIER"

