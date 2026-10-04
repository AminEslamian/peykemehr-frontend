# Backend Coordination & Fixes Checklist (Backend Backlog)

All items below, along with code snippets and deployment configurations, are documented in detail in [`BACKEND_HANDOVER.md`](./BACKEND_HANDOVER.md), organized in order of priority:

1. **Allow Proposing / Adding Custom Tags in Reports (`reports/serializers.py`) - Added by Mr. Karami's contest:**
   - `ReportCreateSerializer` only accepts IDs of predefined `Tag` records. Add an optional `other_tag` field to allow educators to suggest new classroom activity topics.

2. **Expand Teacher Profile Endpoint for User Editing (`GET & PATCH /api/auth/profile/`):**
   - Currently, `GET /api/auth/profile/` only returns 3 fields (`first_name`, `last_name`, `gender`). Include complete educator fields (`school`, `province`, `city`, `position`, `grade`, `national_id`, `point_total`) and enable `PATCH` for profile updates.

3. **Make National ID Optional in Registration & Models (`accounts`):**
   - Requirement: Do not require National ID during registration. Set `null=True, blank=True` on `Teacher.national_id`, make the serializer field optional, and remove mandatory validation.

4. **Exclude Admins & Superusers from Teacher List (`adminpanel/views.py`):**
   - Currently, `AdminTeacherViewSet` returns all accounts (including superusers/staff). Add `.filter(is_superuser=False, is_staff=False)` to isolate educators from system administrators.

5. **Optional Media on Announcements / Blogs (`blogs/models.py`):**
   - `Blog.media` is currently mandatory (`No file was submitted`). Set `null=True, blank=True` to allow text-only announcements.

6. **Add Token Refresh Route (`api/auth/token/refresh/`):**
   - Refresh tokens are issued on login/registration, but the SimpleJWT `TokenRefreshView` route is not registered in `urls.py`.
