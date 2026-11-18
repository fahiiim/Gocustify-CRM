# Known Audit Status, Solved Bugs & Remaining Open Gaps (`11_KNOWN_GAPS_AND_AUDIT_STATUS.md`)

Before starting work on any feature or bug report, check this list. A comprehensive codebase audit (`PROJECT_FEATURE_AUDIT.md` / `PROJECT_FEATURE_AUDIT.pdf`) was performed across all 85 features. Many high-priority security and functional bugs have **already been fixed and covered by automated tests**, while a few specific product gaps remain open.

---

## 1. Already Fixed & Verified (Do NOT Re-Implement)

These features were previously broken in older commits or audits, but are **now 100% fixed and verified by pytest**:

1. **Subscription Onboarding & Trial Selection (`FEAT-ONBD-03`):**
   - *Fixed:* `subscription_router` is mounted in `app/api/v1/router.py` (line 45) and `/api/v1/subscriptions/plans`, `/select`, `/checkout-session`, `/portal` work end-to-end.
2. **Team Member Suspension (Ban/Unban) & Per-User RBAC Restrictions (`FEAT-RBAC-03`):**
   - *Fixed:* `/api/v1/dashboard/owner/team/{user_id}/ban` and `/unban` block/unblock users. `status == "blocked"` is enforced in `get_current_user` (`app/dependencies.py`), `login_user`, `refresh_access_token`, and `google_login` (`app/services/auth_service.py`).
   - *Fixed:* Per-user permission restrictions in `rbac_user_restrictions` are intersected (`result &= set(restriction["allowed_permissions"])`) in `RBACRepository.get_user_effective_permissions()` (`app/repositories/rbac_repository.py`).
3. **Private Media Storage & Attachment Isolation (`FEAT-CHAT-03`):**
   - *Fixed:* Sensitive attachments (`PRIVATE_MEDIA_FOLDERS`) are stored in `private_uploads/` outside `/media`, blocked at the public mount by `_PublicMediaFiles` (`app/main.py`), and served only via authenticated, org-scoped `/api/v1/media/private/{folder}/{filename}` (`app/api/v1/endpoints/private_media.py`).
4. **Customer Support Live Chat & Helpdesk Sessions (`FEAT-CHAT-08`):**
   - *Fixed:* Business user routes (`/api/v1/smartflow/support/sessions`) and Admin helpdesk routes (`/api/v1/dashboard/admin/support/sessions`) are unified on `support_sessions` and `support_messages`, verified by `app/tests/test_admin_support_chat_e2e.py`.
5. **CalDAV SSRF Protection & Celery Sync (`FEAT-CALN-02`):**
   - *Fixed:* `caldav_service.py` validates schemes (`https` only), resolves DNS, blocks loopback/private/link-local IPs, disables redirects (`follow_redirects=False`), and `caldav_sync_tasks.py` uses `await get_database()`. Verified by `app/tests/test_caldav_ssrf.py`.
6. **Concurrency-Safe Appointment Booking (`FEAT-CALN-04`):**
   - *Fixed:* `@serialized_booking` in `app/services/smartflow/booking_lock.py` enforces an org-level MongoDB lease lock across `appointment_service.py`, `calendar_service.py`, and `call_meeting_request_service.py`. Verified by `app/tests/test_receptionist_delivery_and_lock.py`.
7. **Automated Appointment Reminders via SMS & Push (`FEAT-CALN-06`):**
   - *Fixed:* `reminder_tasks.py` (`reminder.send` and `appointments.send_reminders`), `celery_app.py` queue routing & 15-minute `beat_schedule`, `docker-compose.prod.yml` (`worker`, `beat`, `redis`, `redis-broker`), and `AppointmentService.send_due_reminders()` are complete and verified by `app/tests/test_appointment_reminders.py`.

---

## 2. Remaining Open Gaps / Unbuilt Background Jobs (Be Aware)

If the user asks to work on any of the following, know that they are **currently unbuilt or partially wired**:

1. **Automated Trial Expiration & Number Deactivation Cron:**
   - While user documents store `trial_ends_at` and `subscription_status`, there is **no** Celery Beat task that automatically flips expired trials to `expired` or suspends/releases their assigned Telnyx numbers when a trial or subscription lapses.
2. **Automated Birthday Campaign / Greeting Cron:**
   - Contacts can store a `birthday` field, and bulk messaging exists, but there is **no** scheduled Celery task that automatically sends birthday SMS/emails each morning.
3. **AI Auto-Reply to Social Media Comments & Post DMs:**
   - Social integrations (`social_posts_service.py`, `social_provider_adapters.py`) support OAuth connection, publishing posts, and unified inbox messaging, but there is **no** automated AI comment-reply or social DM auto-responder workflow wired to webhooks yet.
4. **Multi-Worker Live Call Session State (`active_sessions`):**
   - Live AI call sessions in `app/api/v1/endpoints/calls.py` are held in an in-process Python dictionary (`active_sessions`). Uvicorn must run as a **single worker process** for voice webhooks and WebSocket media streams to find the same in-memory session, unless call state is externalized to Redis.
5. **Mobile App (`madbel-mobile`) Feature Parity:**
   - Several newer web features (such as advanced AI receptionist capability toggles, custom domain email DNS wizard, and CalDAV setup) have full UI in `Mabdel Website` but only partial or compatibility screens in `madbel-mobile`.

