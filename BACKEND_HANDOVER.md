# Backend Handover & Technical Integration Guide
**Project:** Safire Mehr (Peyke Mehr) Portal  
**Frontend Stack:** React + Vite + TypeScript (Astra Design System)

This document contains all technical specifications, recommended Django backend fixes, and deployment configurations needed by the backend developer, ordered by priority of requested portal changes.

---

## Section 1: Backend Fixes & Improvements (Django)

The frontend application is almost done for the the beta version. The following backend adjustments are organized in order of priority based on feature requirements, and the technical guidances are only suggestion:

### 1. Allow Proposing / Adding Custom Tags in Reports (`reports`) - Added by Mr. Karami's contest
* **Priority Context:** Requirement: *"اگر تگی انتخاب نشد، سایر باید انتخاب شود و توضیحات الزامی باشد"* (If no predefined topic tag is selected, educators must specify a custom topic and description).
* **File:** `reports/serializers.py` -> `ReportCreateSerializer`
* **Issue:** `ReportCreateSerializer` only accepts IDs of existing predefined `Tag` records in the database.
* **Recommended Change:** Add an optional `other_tag` write-only field to `ReportCreateSerializer`. When supplied, auto-create the `Tag` record or save the custom topic:
  ```python
  class ReportCreateSerializer(serializers.ModelSerializer):
      other_tag = serializers.CharField(required=False, allow_blank=True, write_only=True)
      # ...
  ```

---

### 2. Expand Teacher Profile Endpoint for User Editing (`GET & PATCH /api/auth/profile/`)
* **Priority Context:** Requirement: *"امکان ادیت برای کاربر (+صفحه پروفایل)"* (Allow educators to view and edit their profile details).
* **File:** `accounts/views.py` -> `TeacherProfileView` / `TeacherProfileSerializer`
* **Issue:** `GET /api/auth/profile/` currently returns only `{ first_name, last_name, gender }`, and the view does not support `PATCH` or `PUT` methods.
* **Recommended Changes:**
  1. Include all educator fields in `TeacherProfileSerializer`: `province`, `city`, `school`, `position`, `grade`, `national_id`, and `point_total`.
  2. Implement `PATCH` method support on `TeacherProfileView` so teachers can update their profile information.

---

### 3. Make National ID Optional in Registration & Models (`accounts`)
* **Priority Context:** Requirement: *"کد ملی گرفته نشود"* (Do not require National ID during registration).
* **Files:**
  - `accounts/models.py` -> `Teacher` model (`national_id` field)
  - `accounts/serializers.py` -> `RegisterSendOTPSerializer`
  - `accounts/views.py` -> `RegisterSendOTPView`, `RegisterVerifyOTPView`
* **Issue:** `Teacher.national_id` currently has `unique=True` without `null=True, blank=True`. The serializer strictly validates a 10-digit checksum and the view blocks registration if missing or duplicated.
* **Recommended Changes:**
  1. In `accounts/models.py`, allow null values:
     ```python
     national_id = models.CharField(
         max_length=10,
         unique=True,
         null=True,
         blank=True,
         validators=[national_id_validator],
         verbose_name="کد ملی"
     )
     ```
  2. In `accounts/serializers.py`, mark `national_id` as optional (`required=False, allow_null=True, allow_blank=True`).
  3. In `accounts/views.py`, only check uniqueness if `national_id` is actually provided in the request payload.

---

### 4. Separate Admins from Teachers in Admin Panel
* **Priority Context:** Requirement: *"پنل ادمین (+= مدیریت) برای کاربر سطح مدیر"* (Role isolation in the management console).
* **File:** `adminpanel/views.py` -> `AdminTeacherViewSet`
* **Issue:** `AdminTeacherViewSet.queryset = Teacher.objects.all().order_by("-id")` currently includes superusers and staff accounts in the teacher directory table.
* **Recommended Code:**
  ```python
  class AdminTeacherViewSet(viewsets.ModelViewSet):
      # Exclude superusers and staff accounts from the teacher list
      queryset = Teacher.objects.filter(is_superuser=False, is_staff=False).order_by("-id")
      serializer_class = AdminTeacherSerializer
      permission_classes = [IsStaffOrSuperUser]
  ```

---

### 5. Allow Optional Media on Announcements / Blogs (`blogs`)
* **File:** `blogs/models.py` -> `Blog` model
* **Issue:** `media = models.FileField(upload_to="blogs/")` does not have `null=True, blank=True`. Attempting to publish an announcement without an image/video raises a validation error (`No file was submitted.`).
* **Recommended Code:**
  ```python
  class Blog(models.Model):
      title = models.CharField(max_length=200)
      content = models.TextField()
      media = models.FileField(upload_to="blogs/", null=True, blank=True)
      created_at = models.DateTimeField(auto_now_add=True)
  ```

---

### 6. Add SimpleJWT Token Refresh Endpoint (`token/refresh`)
* **File:** `config/urls.py` or `accounts/urls.py`
* **Issue:** JWT refresh tokens are issued upon login, but no endpoint is registered in `urls.py` to exchange them for a new access token when expired.
* **Recommended Code:**
  ```python
  from rest_framework_simplejwt.views import TokenRefreshView

  urlpatterns = [
      # ...
      path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
  ]
  ```

---

## Section 2: Repository Setup & Deployment Architecture

### Repository Structure
The frontend and backend can remain in separate Git repositories (polyrepo architecture). Giving the developer access to the `frontend` repository alone is completely standard practice.

### A. Local Development Setup
1. Run the Django backend on port 8000:
   ```powershell
   python manage.py runserver 8000
   ```
2. In the `frontend/` directory:
   ```bash
   npm install
   npm run dev
   ```
3. In `frontend/vite.config.ts`, requests to `/api`, `/admin-panel`, and `/media` are automatically proxied to `http://127.0.0.1:8000`. No CORS configuration is required locally.

---

### B. Production Deployment Scenarios

#### Scenario 1 (Recommended): Single-Host Deployment with Nginx Reverse Proxy
Build the frontend production bundle:
```bash
npm run build
```
This generates the static build inside `frontend/dist/`.

Configure Nginx as follows:
```nginx
server {
    listen 80;
    server_name safiremehr.ir;

    # 1. Serve React Frontend Static Files
    location / {
        root /var/www/safiremehr/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 2. Proxy API Requests to Django (Gunicorn / Uvicorn)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 3. Django Admin & Admin-Panel API
    location /admin-panel/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 4. Serve Media Uploads
    location /media/ {
        alias /var/www/safiremehr/project/safiremehr-proj1/media/;
    }
}
```
* **Benefits:** Single domain, zero CORS complications, optimized static file delivery through Nginx.

#### Scenario 2: Separate Domains (e.g., Frontend on CDN/Vercel & Backend on API domain)
If the frontend is hosted on a separate domain (e.g., `app.safiremehr.ir`) and the backend on `api.safiremehr.ir`:
1. In Django, install `django-cors-headers` and whitelist the frontend domain in `CORS_ALLOWED_ORIGINS`.
2. Configure the API base URL in the frontend environment.
