from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


SocialPlatform = Literal["facebook", "instagram", "linkedin", "x", "threads", "draft"]


class SocialPostCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=63206)
    platforms: list[SocialPlatform] = Field(default_factory=lambda: ["draft"], min_length=1)
    media_url: str | None = None
    scheduled_at: datetime | None = None
    is_draft: bool = False
    title: str | None = None


class SocialPostUpdateRequest(BaseModel):
    content: str | None = Field(default=None, min_length=1, max_length=63206)
    platforms: list[SocialPlatform] | None = None
    media_url: str | None = None
    scheduled_at: datetime | None = None
    is_draft: bool | None = None
    title: str | None = None


class PlatformPostResult(BaseModel):
    platform: SocialPlatform
    status: Literal["published", "scheduled", "failed", "not_connected", "draft"]
    post_id: str | None = None
    error: str | None = None


class SocialPostResponse(BaseModel):
    id: str
    content: str
    platforms: list[SocialPlatform]
    media_url: str | None = None
    scheduled_at: datetime | None = None
    results: list[PlatformPostResult] = Field(default_factory=list)
    is_draft: bool = False
    title: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
