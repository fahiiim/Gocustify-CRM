from __future__ import annotations

import pytest
from app.services.social_provider_adapters import (
    FacebookMessengerAdapter,
    InstagramAdapter,
    get_social_provider_adapter,
)


def test_meta_facebook_feed_comment_normalization():
    adapter = get_social_provider_adapter("facebook_messenger")
    assert isinstance(adapter, FacebookMessengerAdapter)

    payload = {
        "object": "page",
        "entry": [
            {
                "id": "page_123456789",
                "time": 1700000000,
                "changes": [
                    {
                        "field": "feed",
                        "value": {
                            "item": "comment",
                            "verb": "add",
                            "comment_id": "comment_fb_101",
                            "post_id": "post_fb_505",
                            "message": "Do you have appointments available tomorrow morning?",
                            "from": {
                                "id": "fb_user_999",
                                "name": "Alice Johnson",
                            },
                            "created_time": 1700000050,
                        },
                    }
                ],
            }
        ],
    }

    events = adapter.normalize_webhook_events(payload)
    assert len(events) == 1
    event = events[0]
    assert event.event_id == "comment_fb_101"
    assert event.contact_external_id == "fb_user_999"
    assert event.contact_name == "Alice Johnson"
    assert event.content == "Do you have appointments available tomorrow morning?"
    assert event.direction == "inbound"
    assert event.external_account_id == "page_123456789"
    assert event.timestamp is not None


def test_meta_instagram_comment_normalization():
    adapter = get_social_provider_adapter("instagram")
    assert isinstance(adapter, InstagramAdapter)

    payload = {
        "object": "instagram",
        "entry": [
            {
                "id": "ig_account_555",
                "time": 1700000100,
                "changes": [
                    {
                        "field": "comments",
                        "value": {
                            "id": "ig_comment_202",
                            "text": "What is the price for dental teeth whitening?",
                            "from": {
                                "id": "ig_user_888",
                                "username": "bob_traveler",
                            },
                            "timestamp": 1700000120,
                        },
                    }
                ],
            }
        ],
    }

    events = adapter.normalize_webhook_events(payload)
    assert len(events) == 1
    event = events[0]
    assert event.event_id == "ig_comment_202"
    assert event.contact_external_id == "ig_user_888"
    assert event.contact_name == "bob_traveler"
    assert event.content == "What is the price for dental teeth whitening?"
    assert event.direction == "inbound"
    assert event.external_account_id == "ig_account_555"
    assert event.timestamp is not None


def test_meta_comments_ignores_page_self_comment():
    adapter = FacebookMessengerAdapter()
    payload = {
        "object": "page",
        "entry": [
            {
                "id": "page_123456789",
                "changes": [
                    {
                        "field": "feed",
                        "value": {
                            "item": "comment",
                            "verb": "add",
                            "comment_id": "comment_self_1",
                            "message": "Thanks for reaching out!",
                            "from": {
                                "id": "page_123456789",  # Same as page / account_id
                                "name": "Dental Clinic Page",
                            },
                            "created_time": 1700000200,
                        },
                    }
                ],
            }
        ],
    }
    events = adapter.normalize_webhook_events(payload)
    assert len(events) == 0


def test_meta_feed_ignores_non_comment_items():
    adapter = FacebookMessengerAdapter()
    payload = {
        "object": "page",
        "entry": [
            {
                "id": "page_123456789",
                "changes": [
                    {
                        "field": "feed",
                        "value": {
                            "item": "status",
                            "verb": "add",
                            "message": "Clinic status updated",
                        },
                    },
                    {
                        "field": "feed",
                        "value": {
                            "item": "comment",
                            "verb": "remove",
                            "comment_id": "comment_deleted",
                            "from": {"id": "fb_user_123"},
                        },
                    },
                ],
            }
        ],
    }
    events = adapter.normalize_webhook_events(payload)
    assert len(events) == 0
